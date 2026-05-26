const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getUserById, query } = require('../database/queries');

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await getUserById(req.user.id);
        
        const { password_hash, reset_token, reset_expires, ...safeUser } = user;
        
        res.json({
            success: true,
            user: safeUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/me', authenticate, async (req, res) => {
    try {
        const { full_name, email, profile_picture_url, location, bio } = req.body;
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (full_name) {
            updates.push(`full_name = $${paramCount++}`);
            values.push(full_name);
        }
        if (email) {
            updates.push(`email = $${paramCount++}`);
            values.push(email);
        }
        if (profile_picture_url) {
            updates.push(`profile_picture_url = $${paramCount++}`);
            values.push(profile_picture_url);
        }
        if (location) {
            updates.push(`location = $${paramCount++}`);
            values.push(location);
        }
        if (bio) {
            updates.push(`bio = $${paramCount++}`);
            values.push(bio);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        updates.push(`updated_at = NOW()`);
        values.push(req.user.id);
        
        const result = await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        
        const { password_hash, reset_token, reset_expires, ...safeUser } = result.rows[0];
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: safeUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get user by ID (public profile)
router.get('/:id', async (req, res) => {
    try {
        const result = await query(
            `SELECT id, full_name, profile_picture_url, rating, total_sales, 
                    total_reviews, bio, location, created_at, id_verified
             FROM users WHERE id = $1 AND is_active = true`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get user's artefacts
        const artefacts = await query(
            `SELECT id, title, main_image_url, local_price, foreign_price_usd, 
                    views_count, created_at, status
             FROM artefacts WHERE artisan_id = $1 AND status = 'active'
             ORDER BY created_at DESC LIMIT 20`,
            [req.params.id]
        );
        
        res.json({
            success: true,
            user: result.rows[0],
            artefacts: artefacts.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Get user's sales statistics (artisan only)
router.get('/me/stats', authenticate, requireArtisan, async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(DISTINCT a.id) as total_listings,
                COUNT(DISTINCT CASE WHEN a.status = 'active' THEN a.id END) as active_listings,
                COUNT(DISTINCT CASE WHEN a.status = 'sold' THEN a.id END) as sold_count,
                COALESCE(SUM(t.amount_paid), 0) as total_revenue,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT t.buyer_id) as unique_buyers
            FROM users u
            LEFT JOIN artefacts a ON u.id = a.artisan_id
            LEFT JOIN transactions t ON a.id = t.artefact_id AND t.payment_status = 'completed'
            LEFT JOIN reviews r ON t.id = r.transaction_id
            WHERE u.id = $1
            GROUP BY u.id
        `, [req.user.id]);
        
        res.json({
            success: true,
            stats: stats.rows[0] || {
                total_listings: 0,
                active_listings: 0,
                sold_count: 0,
                total_revenue: 0,
                average_rating: 0,
                unique_buyers: 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Admin: Get all users
router.get('/admin/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, user_type, verified } = req.query;
        const offset = (page - 1) * limit;
        
        let queryText = `
            SELECT id, full_name, phone_number, email, user_type, 
                   id_verified, rating, total_sales, created_at, is_active
            FROM users
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;
        
        if (user_type) {
            queryText += ` AND user_type = $${paramCount++}`;
            values.push(user_type);
        }
        
        if (verified === 'true') {
            queryText += ` AND id_verified = true`;
        } else if (verified === 'false') {
            queryText += ` AND id_verified = false`;
        }
        
        queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        values.push(parseInt(limit), offset);
        
        const users = await query(queryText, values);
        
        const countResult = await query('SELECT COUNT(*) FROM users');
        
        res.json({
            success: true,
            users: users.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Admin: Verify user ID
router.put('/admin/verify-user/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { verified } = req.body;
        
        const result = await query(
            `UPDATE users SET id_verified = $1, verified_at = $2, updated_at = NOW()
             WHERE id = $3 RETURNING id, full_name, id_verified`,
            [verified === true, verified ? new Date() : null, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Send notification to user
        await require('./notifications').createNotification(
            req.params.id,
            'verification_update',
            verified ? 'Account Verified!' : 'Verification Failed',
            verified ? 'Your account has been verified. You can now sell artefacts.' : 'Your ID verification was rejected. Please upload a clearer document.'
        );
        
        res.json({
            success: true,
            message: `User ${verified ? 'verified' : 'unverified'} successfully`,
            user: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update verification status' });
    }
});

// Delete user account
router.delete('/me', authenticate, async (req, res) => {
    try {
        // Soft delete
        await query(
            'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
            [req.user.id]
        );
        
        res.json({
            success: true,
            message: 'Account deactivated successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;