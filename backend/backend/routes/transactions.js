const express = require('express');
const router = express.Router();
const { authenticate, requireBuyer } = require('../middleware/auth');
const { query, createTransaction, updatePaymentStatus, releaseEscrow, createNotification } = require('../database/queries');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const axios = require('axios');

// ============================================
// CREATE PAYMENT INTENT (Stripe - International)
// ============================================
router.post('/create-payment-intent', authenticate, requireBuyer, async (req, res) => {
    try {
        const { artefact_id, mode, delivery_method, shipping_address } = req.body;
        
        // Get artefact details
        const artefact = await query(
            `SELECT a.*, u.email as artisan_email, u.full_name as artisan_name,
                    u.phone_number as artisan_phone
             FROM artefacts a
             JOIN users u ON a.artisan_id = u.id
             WHERE a.id = $1 AND a.status = 'active'`,
            [artefact_id]
        );
        
        if (artefact.rows.length === 0) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        
        const artefactData = artefact.rows[0];
        
        // Check if user is trying to buy their own artefact
        if (artefactData.artisan_id === req.user.id) {
            return res.status(400).json({ error: 'You cannot purchase your own artefact' });
        }
        
        // Calculate price based on mode
        let amount = mode === 'local' ? artefactData.local_price : artefactData.foreign_price_usd;
        let currency = mode === 'local' ? 'kes' : 'usd';
        
        // Calculate fees
        const platformFeePercent = mode === 'local' ? parseFloat(process.env.PLATFORM_FEE_LOCAL) : parseFloat(process.env.PLATFORM_FEE_FOREIGN);
        const platformFee = amount * platformFeePercent;
        const paymentProcessingFee = amount * 0.029 + 0.30; // Stripe standard fee
        let shippingFee = 0;
        
        // Calculate shipping if international
        if (delivery_method === 'international_shipping') {
            // Estimate shipping based on weight
            const weight = artefactData.weight_kg || 1;
            shippingFee = await estimateShippingCost(weight, shipping_address?.country || 'US');
        } else if (delivery_method === 'local_courier') {
            shippingFee = 5; // Flat rate local delivery
        }
        
        const totalAmount = amount + shippingFee;
        const sellerPayout = amount - platformFee - paymentProcessingFee;
        
        // Generate unique transaction reference
        const transactionRef = `TXN_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        
        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Convert to cents
            currency: currency,
            metadata: {
                artefact_id: artefact_id,
                buyer_id: req.user.id,
                seller_id: artefactData.artisan_id,
                transaction_ref: transactionRef,
                mode: mode,
                platform_fee: platformFee,
                seller_payout: sellerPayout
            },
            receipt_email: req.user.email,
            description: `Purchase of: ${artefactData.title}`
        });
        
        // Create transaction record in database
        const transaction = await createTransaction({
            transaction_ref: transactionRef,
            artefact_id: artefact_id,
            buyer_id: req.user.id,
            seller_id: artefactData.artisan_id,
            amount_paid: totalAmount,
            platform_fee: platformFee,
            payment_processing_fee: paymentProcessingFee,
            shipping_fee: shippingFee,
            seller_payout: sellerPayout,
            currency: currency.toUpperCase(),
            payment_method: 'card',
            delivery_method: delivery_method,
            delivery_address: shipping_address ? JSON.stringify(shipping_address) : null
        });
        
        // Mark artefact as reserved
        await query(
            'UPDATE artefacts SET status = $1, updated_at = NOW() WHERE id = $2',
            ['reserved', artefact_id]
        );
        
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            transactionRef: transactionRef,
            transaction: transaction,
            amount: totalAmount,
            currency: currency,
            breakdown: {
                item_price: amount,
                shipping_fee: shippingFee,
                platform_fee: platformFee,
                processing_fee: paymentProcessingFee,
                total: totalAmount
            }
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Failed to create payment intent', details: error.message });
    }
});

// ============================================
// CREATE M-PESA PAYMENT (Local - Kenya/Tanzania)
// ============================================
router.post('/create-mpesa-payment', authenticate, requireBuyer, async (req, res) => {
    try {
        const { artefact_id, phone_number, delivery_method } = req.body;
        
        // Get artefact details
        const artefact = await query(
            `SELECT a.*, u.email as artisan_email, u.full_name as artisan_name
             FROM artefacts a
             JOIN users u ON a.artisan_id = u.id
             WHERE a.id = $1 AND a.status = 'active'`,
            [artefact_id]
        );
        
        if (artefact.rows.length === 0) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        
        const artefactData = artefact.rows[0];
        
        // Calculate amount
        let amount = artefactData.local_price;
        let shippingFee = delivery_method === 'local_courier' ? 5 : 0;
        const totalAmount = amount + shippingFee;
        
        // Generate unique transaction reference
        const transactionRef = `MPESA_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        // Format phone number for M-Pesa (254XXXXXXXXX)
        let formattedPhone = phone_number;
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.substring(1);
        }
        
        // Create transaction record
        const transaction = await createTransaction({
            transaction_ref: transactionRef,
            artefact_id: artefact_id,
            buyer_id: req.user.id,
            seller_id: artefactData.artisan_id,
            amount_paid: totalAmount,
            platform_fee: totalAmount * 0.10,
            seller_payout: totalAmount * 0.90,
            currency: 'KES',
            payment_method: 'mpesa',
            delivery_method: delivery_method,
            payment_status: 'pending'
        });
        
        // Initiate M-Pesa STK Push
        const mpesaResponse = await initiateMpesaPayment({
            phoneNumber: formattedPhone,
            amount: Math.round(totalAmount),
            accountReference: transactionRef,
            transactionDesc: `Artefact: ${artefactData.title.substring(0, 30)}`
        });
        
        // Store M-Pesa request ID
        await query(
            'UPDATE transactions SET payment_intent_id = $1 WHERE transaction_ref = $2',
            [mpesaResponse.CheckoutRequestID, transactionRef]
        );
        
        // Mark artefact as reserved
        await query(
            'UPDATE artefacts SET status = $1 WHERE id = $2',
            ['reserved', artefact_id]
        );
        
        res.json({
            success: true,
            message: 'M-Pesa STK Push sent to your phone',
            transactionRef: transactionRef,
            checkoutRequestId: mpesaResponse.CheckoutRequestID,
            amount: totalAmount,
            currency: 'KES'
        });
    } catch (error) {
        console.error('Error creating M-Pesa payment:', error);
        res.status(500).json({ error: 'Failed to initiate M-Pesa payment', details: error.message });
    }
});

// ============================================
// M-PESA CALLBACK WEBHOOK
// ============================================
router.post('/mpesa-callback', express.raw({type: 'application/json'}), async (req, res) => {
    try {
        const callbackData = req.body;
        
        console.log('M-Pesa Callback Received:', JSON.stringify(callbackData, null, 2));
        
        const { Body } = callbackData;
        const { stkCallback } = Body;
        
        const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;
        
        // Find transaction by CheckoutRequestID
        const transaction = await query(
            'SELECT * FROM transactions WHERE payment_intent_id = $1',
            [CheckoutRequestID]
        );
        
        if (transaction.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        const transactionData = transaction.rows[0];
        
        if (ResultCode === 0) {
            // Payment successful
            let mpesaReceiptNumber = '';
            let paymentAmount = 0;
            
            if (CallbackMetadata && CallbackMetadata.Item) {
                CallbackMetadata.Item.forEach(item => {
                    if (item.Name === 'MpesaReceiptNumber') {
                        mpesaReceiptNumber = item.Value;
                    }
                    if (item.Name === 'Amount') {
                        paymentAmount = item.Value;
                    }
                });
            }
            
            // Update transaction status
            await updatePaymentStatus(transactionData.transaction_ref, 'completed', mpesaReceiptNumber);
            
            // Notify buyer
            await createNotification(
                transactionData.buyer_id,
                'payment_successful',
                'Payment Successful!',
                `Your payment of ${paymentAmount} KES has been confirmed. The seller will prepare your order.`,
                { transaction_id: transactionData.id }
            );
            
            // Notify seller
            await createNotification(
                transactionData.seller_id,
                'payment_received',
                'Payment Received!',
                `You have received payment for your artefact. Please prepare for shipping.`,
                { transaction_id: transactionData.id }
            );
        } else {
            // Payment failed
            await updatePaymentStatus(transactionData.transaction_ref, 'failed', null);
            
            // Release artefact back to active
            await query(
                'UPDATE artefacts SET status = $1 WHERE id = $2',
                ['active', transactionData.artefact_id]
            );
            
            // Notify buyer of failure
            await createNotification(
                transactionData.buyer_id,
                'payment_failed',
                'Payment Failed',
                `Your payment failed: ${ResultDesc}. Please try again.`,
                { transaction_id: transactionData.id }
            );
        }
        
        res.json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
        console.error('M-Pesa callback error:', error);
        res.json({ ResultCode: 1, ResultDesc: 'Failed' });
    }
});

// ============================================
// STRIPE WEBHOOK (Handle payment confirmation)
// ============================================
router.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                const transactionRef = paymentIntent.metadata.transaction_ref;
                
                // Update transaction status
                await updatePaymentStatus(transactionRef, 'completed', paymentIntent.id);
                
                // Get transaction details
                const transaction = await query(
                    'SELECT * FROM transactions WHERE transaction_ref = $1',
                    [transactionRef]
                );
                
                if (transaction.rows.length > 0) {
                    const tx = transaction.rows[0];
                    
                    // Notify buyer
                    await createNotification(
                        tx.buyer_id,
                        'payment_successful',
                        'Payment Successful!',
                        `Your payment of ${tx.amount_paid} ${tx.currency} has been confirmed.`,
                        { transaction_id: tx.id }
                    );
                    
                    // Notify seller
                    await createNotification(
                        tx.seller_id,
                        'payment_received',
                        'New Order!',
                        `You have received a new order. Please prepare for shipping.`,
                        { transaction_id: tx.id }
                    );
                }
                break;
                
            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object;
                const failedRef = failedIntent.metadata.transaction_ref;
                
                await updatePaymentStatus(failedRef, 'failed', null);
                
                // Release artefact
                const failedTx = await query(
                    'SELECT artefact_id FROM transactions WHERE transaction_ref = $1',
                    [failedRef]
                );
                
                if (failedTx.rows.length > 0) {
                    await query(
                        'UPDATE artefacts SET status = $1 WHERE id = $2',
                        ['active', failedTx.rows[0].artefact_id]
                    );
                }
                break;
                
            case 'charge.refunded':
                const refund = event.data.object;
                const refundRef = refund.metadata.transaction_ref;
                
                await updatePaymentStatus(refundRef, 'refunded', null);
                break;
        }
        
        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// ============================================
// CONFIRM DELIVERY AND RELEASE ESCROW
// ============================================
router.post('/confirm-delivery', authenticate, async (req, res) => {
    try {
        const { transaction_id } = req.body;
        
        // Get transaction details
        const transaction = await query(`
            SELECT t.*, a.title as artefact_title, a.artisan_id
            FROM transactions t
            JOIN artefacts a ON t.artefact_id = a.id
            WHERE t.id = $1 AND t.buyer_id = $2
        `, [transaction_id, req.user.id]);
        
        if (transaction.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        const tx = transaction.rows[0];
        
        // Check if already released
        if (tx.escrow_release_status === 'released') {
            return res.status(400).json({ error: 'Escrow already released' });
        }
        
        // Release escrow to seller
        const updatedTransaction = await releaseEscrow(transaction_id);
        
        // Update artefact status to sold
        await query(
            `UPDATE artefacts SET status = 'sold', sold_at = NOW(), updated_at = NOW() 
             WHERE id = $1`,
            [tx.artefact_id]
        );
        
        // Update user's total sales
        await query(
            `UPDATE users SET total_sales = total_sales + 1, updated_at = NOW()
             WHERE id = $1`,
            [tx.seller_id]
        );
        
        // Notify seller
        await createNotification(
            tx.seller_id,
            'escrow_released',
            'Funds Released!',
            `${req.user.full_name} has confirmed delivery. Your payment of ${tx.seller_payout} ${tx.currency} has been released.`,
            { transaction_id }
        );
        
        // Create review reminder for buyer
        await createNotification(
            req.user.id,
            'review_reminder',
            'Review Your Purchase',
            `How was your experience with ${tx.artefact_title}? Leave a review to help other buyers.`,
            { transaction_id, artefact_id: tx.artefact_id }
        );
        
        res.json({
            success: true,
            message: 'Delivery confirmed, funds released to seller',
            transaction: updatedTransaction
        });
    } catch (error) {
        console.error('Error confirming delivery:', error);
        res.status(500).json({ error: 'Failed to confirm delivery' });
    }
});

// ============================================
// REPORT DELIVERY ISSUE (Open Dispute)
// ============================================
router.post('/report-issue', authenticate, async (req, res) => {
    try {
        const { transaction_id, reason, description, evidence_urls } = req.body;
        
        const validReasons = ['not_received', 'damaged', 'not_as_described', 'wrong_item', 'other'];
        if (!validReasons.includes(reason)) {
            return res.status(400).json({ error: 'Invalid reason' });
        }
        
        // Get transaction
        const transaction = await query(
            `SELECT t.*, a.title, u.email as seller_email, u.full_name as seller_name
             FROM transactions t
             JOIN artefacts a ON t.artefact_id = a.id
             JOIN users u ON t.seller_id = u.id
             WHERE t.id = $1 AND t.buyer_id = $2`,
            [transaction_id, req.user.id]
        );
        
        if (transaction.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        const tx = transaction.rows[0];
        
        // Create dispute
        const dispute = await query(`
            INSERT INTO disputes (
                transaction_id, opened_by, reason, description, 
                evidence_urls, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, 'open', NOW())
            RETURNING *
        `, [transaction_id, req.user.id, reason, description, evidence_urls || []]);
        
        // Update transaction with dispute flag
        await query(
            `UPDATE transactions SET disputed = true, dispute_reason = $1, 
             dispute_opened_at = NOW() WHERE id = $2`,
            [reason, transaction_id]
        );
        
        // Notify admin
        await query(`
            INSERT INTO notifications (user_id, type, title, body, data)
            SELECT id, 'dispute_opened', 'New Dispute Opened', 
                   'Dispute on order #${tx.transaction_ref}: ${reason}',
                   '{"dispute_id": "${dispute.rows[0].id}", "transaction_id": "${transaction_id}"}'
            FROM users WHERE user_type = 'admin'
        `);
        
        // Notify seller
        await createNotification(
            tx.seller_id,
            'dispute_opened',
            'Dispute Opened on Your Order',
            `A dispute has been opened for order ${tx.transaction_ref}. Reason: ${reason}`,
            { dispute_id: dispute.rows[0].id, transaction_id }
        );
        
        res.json({
            success: true,
            message: 'Issue reported successfully. Our team will investigate.',
            dispute: dispute.rows[0]
        });
    } catch (error) {
        console.error('Error reporting issue:', error);
        res.status(500).json({ error: 'Failed to report issue' });
    }
});

// ============================================
// GET TRANSACTION DETAILS
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const transaction = await query(`
            SELECT 
                t.*,
                a.title as artefact_title,
                a.main_image_url as artefact_image,
                a.category as artefact_category,
                buyer.id as buyer_id,
                buyer.full_name as buyer_name,
                buyer.phone_number as buyer_phone,
                buyer.email as buyer_email,
                seller.id as seller_id,
                seller.full_name as seller_name,
                seller.phone_number as seller_phone,
                seller.email as seller_email,
                d.id as dispute_id,
                d.status as dispute_status,
                d.reason as dispute_reason
            FROM transactions t
            JOIN artefacts a ON t.artefact_id = a.id
            JOIN users buyer ON t.buyer_id = buyer.id
            JOIN users seller ON t.seller_id = seller.id
            LEFT JOIN disputes d ON t.id = d.transaction_id AND d.status != 'closed'
            WHERE t.id = $1 AND (t.buyer_id = $2 OR t.seller_id = $2)
        `, [id, req.user.id]);
        
        if (transaction.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        res.json({
            success: true,
            transaction: transaction.rows[0]
        });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
});

// ============================================
// GET USER'S TRANSACTION HISTORY
// ============================================
router.get('/my/history', authenticate, async (req, res) => {
    try {
        const { status, page = 1, limit = 20, role } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let queryText = `
            SELECT 
                t.id,
                t.transaction_ref,
                t.amount_paid,
                t.currency,
                t.payment_status,
                t.escrow_release_status,
                t.delivery_method,
                t.tracking_number,
                t.created_at,
                t.payment_completed_at,
                t.delivered_at,
                a.id as artefact_id,
                a.title as artefact_title,
                a.main_image_url as artefact_image,
                CASE 
                    WHEN t.buyer_id = $1 THEN 'buyer'
                    ELSE 'seller'
                END as user_role,
                CASE 
                    WHEN t.buyer_id = $1 THEN seller.full_name
                    ELSE buyer.full_name
                END as other_party_name,
                CASE 
                    WHEN t.buyer_id = $1 THEN seller.profile_picture_url
                    ELSE buyer.profile_picture_url
                END as other_party_avatar
            FROM transactions t
            JOIN artefacts a ON t.artefact_id = a.id
            JOIN users buyer ON t.buyer_id = buyer.id
            JOIN users seller ON t.seller_id = seller.id
            WHERE (t.buyer_id = $1 OR t.seller_id = $1)
        `;
        
        const values = [req.user.id];
        let paramCount = 2;
        
        if (status && status !== 'all') {
            queryText += ` AND t.payment_status = $${paramCount++}`;
            values.push(status);
        }
        
        if (role && role !== 'all') {
            if (role === 'buying') {
                queryText += ` AND t.buyer_id = $1`;
            } else if (role === 'selling') {
                queryText += ` AND t.seller_id = $1`;
            }
        }
        
        queryText += ` ORDER BY t.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        values.push(parseInt(limit), offset);
        
        const transactions = await query(queryText, values);
        
        // Get counts by status
        const counts = await query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed,
                COUNT(CASE WHEN disputed = true THEN 1 END) as disputed
            FROM transactions
            WHERE buyer_id = $1 OR seller_id = $1
        `, [req.user.id]);
        
        res.json({
            success: true,
            transactions: transactions.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: transactions.rows.length
            },
            counts: counts.rows[0]
        });
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
});

// ============================================
// UPDATE SHIPPING TRACKING (Seller only)
// ============================================
router.post('/:id/update-shipping', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { tracking_number, courier_company, shipping_label_url } = req.body;
        
        // Verify seller owns this transaction
        const transaction = await query(
            `SELECT t.*, a.artisan_id 
             FROM transactions t
             JOIN artefacts a ON t.artefact_id = a.id
             WHERE t.id = $1 AND a.artisan_id = $2`,
            [id, req.user.id]
        );
        
        if (transaction.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found or you are not the seller' });
        }
        
        // Update shipping info
        await query(`
            UPDATE transactions 
            SET tracking_number = $1, 
                courier_company = $2, 
                shipping_label_url = $3,
                shipped_at = CASE WHEN shipped_at IS NULL THEN NOW() ELSE shipped_at END,
                updated_at = NOW()
            WHERE id = $4
        `, [tracking_number, courier_company, shipping_label_url, id]);
        
        // Notify buyer
        await createNotification(
            transaction.rows[0].buyer_id,
            'shipping_update',
            'Your Order Has Shipped!',
            `Your order has been shipped via ${courier_company}. Tracking: ${tracking_number}`,
            { transaction_id: id, tracking_number, courier_company }
        );
        
        res.json({
            success: true,
            message: 'Shipping information updated successfully',
            tracking_number,
            courier_company
        });
    } catch (error) {
        console.error('Error updating shipping:', error);
        res.status(500).json({ error: 'Failed to update shipping information' });
    }
});

// ============================================
// REQUEST REFUND (Buyer only)
// ============================================
router.post('/:id/request-refund', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, details } = req.body;
        
        // Verify buyer owns this transaction
        const transaction = await query(
            `SELECT t.*, a.title 
             FROM transactions t
             JOIN artefacts a ON t.artefact_id = a.id
             WHERE t.id = $1 AND t.buyer_id = $2 AND t.payment_status = 'completed'`,
            [id, req.user.id]
        );
        
        if (transaction.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found or cannot be refunded' });
        }
        
        const tx = transaction.rows[0];
        
        // Process refund via Stripe if card payment
        let refundResult = null;
        if (tx.payment_method === 'card' && tx.payment_intent_id) {
            try {
                refundResult = await stripe.refunds.create({
                    payment_intent: tx.payment_intent_id,
                    amount: Math.round(tx.amount_paid * 100),
                    reason: 'requested_by_customer',
                    metadata: {
                        transaction_id: id,
                        reason: reason
                    }
                });
            } catch (stripeError) {
                console.error('Stripe refund error:', stripeError);
                return res.status(500).json({ error: 'Failed to process refund' });
            }
        }
        
        // Update transaction status
        await query(`
            UPDATE transactions 
            SET payment_status = $1, 
                updated_at = NOW(),
                dispute_reason = $2
            WHERE id = $3
        `, ['refunded', `${reason}: ${details}`, id]);
        
        // Update artefact status back to active
        await query(
            'UPDATE artefacts SET status = $1 WHERE id = $2',
            ['active', tx.artefact_id]
        );
        
        // Notify seller
        await createNotification(
            tx.seller_id,
            'refund_issued',
            'Refund Issued',
            `A refund has been issued for order ${tx.transaction_ref}. Reason: ${reason}`,
            { transaction_id: id }
        );
        
        res.json({
            success: true,
            message: 'Refund requested successfully',
            refund: refundResult
        });
    } catch (error) {
        console.error('Error requesting refund:', error);
        res.status(500).json({ error: 'Failed to process refund request' });
    }
});

// ============================================
// ADMIN: GET ALL TRANSACTIONS
// ============================================
router.get('/admin/all', authenticate, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { status, page = 1, limit = 50, start_date, end_date } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let queryText = `
            SELECT 
                t.*,
                a.title as artefact_title,
                buyer.full_name as buyer_name,
                buyer.email as buyer_email,
                seller.full_name as seller_name,
                seller.email as seller_email
            FROM transactions t
            JOIN artefacts a ON t.artefact_id = a.id
            JOIN users buyer ON t.buyer_id = buyer.id
            JOIN users seller ON t.seller_id = seller.id
            WHERE 1=1
        `;
        
        const values = [];
        let paramCount = 1;
        
        if (status && status !== 'all') {
            queryText += ` AND t.payment_status = $${paramCount++}`;
            values.push(status);
        }
        
        if (start_date) {
            queryText += ` AND t.created_at >= $${paramCount++}`;
            values.push(start_date);
        }
        
        if (end_date) {
            queryText += ` AND t.created_at <= $${paramCount++}`;
            values.push(end_date);
        }
        
        queryText += ` ORDER BY t.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        values.push(parseInt(limit), offset);
        
        const transactions = await query(queryText, values);
        
        // Get summary statistics
        const summary = await query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN payment_status = 'completed' THEN amount_paid ELSE 0 END) as total_revenue,
                SUM(platform_fee) as total_fees,
                AVG(amount_paid) as average_order_value,
                COUNT(CASE WHEN disputed = true THEN 1 END) as disputed_count
            FROM transactions
            WHERE payment_status = 'completed'
        `);
        
        res.json({
            success: true,
            transactions: transactions.rows,
            summary: summary.rows[0],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: transactions.rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching admin transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// ============================================
// HELPER FUNCTION: Estimate Shipping Cost
// ============================================
async function estimateShippingCost(weightKg, destinationCountry) {
    // This is a simplified estimation
    // In production, integrate with DHL/FedEx API
    
    const baseRates = {
        'US': 25,
        'GB': 20,
        'CA': 30,
        'AU': 35,
        'DE': 22,
        'FR': 22,
        'default': 25
    };
    
    const ratePerKg = 5;
    const baseRate = baseRates[destinationCountry] || baseRates.default;
    
    return baseRate + (weightKg * ratePerKg);
}

// ============================================
// HELPER FUNCTION: Initiate M-Pesa Payment
// ============================================
async function initiateMpesaPayment({ phoneNumber, amount, accountReference, transactionDesc }) {
    // This is a simplified version
    // In production, implement full M-Pesa API integration
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');
    
    const data = {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: `${process.env.CLIENT_URL}/api/transactions/mpesa-callback`,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
    };
    
    // In production, make actual API call to M-Pesa
    // const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', data, {
    //     headers: {
    //         Authorization: `Bearer ${await getMpesaToken()}`
    //     }
    // });
    
    // Mock response for development
    return {
        CheckoutRequestID: `ws_CO_${Date.now()}`,
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing'
    };
}

module.exports = router;