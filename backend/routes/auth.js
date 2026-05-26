const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { createUser, getUserByPhone, getUserById } = require('../database/queries');

// ============ REGISTER NEW USER ============
router.post('/register', async (req, res) => {
    try {
        const { phone_number, full_name, email, user_type, password, firebase_token } = req.body;
        
        // Verify Firebase token if provided
        let firebase_uid = null;
        if (firebase_token) {
            const decodedToken = await admin.auth().verifyIdToken(firebase_token);
            firebase_uid = decodedToken.uid;
        }
        
        // Check if user exists
        const existingUser = await getUserByPhone(phone_number);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const newUser = await createUser({
            phone_number,
            full_name,
            email,
            user_type,
            password_hash: hashedPassword,
            firebase_uid
        });
        
        // Generate JWT
        const token = jwt.sign(
            { id: newUser.id, phone: newUser.phone_number, type: newUser.user_type },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                phone_number: newUser.phone_number,
                full_name: newUser.full_name,
                email: newUser.email,
                user_type: newUser.user_type
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

// ============ LOGIN ============
router.post('/login', async (req, res) => {
    try {
        const { phone_number, password, firebase_token } = req.body;
        
        // Find user
        const user = await getUserByPhone(phone_number);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword && !firebase_token) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Verify Firebase token if provided
        if (firebase_token) {
            const decodedToken = await admin.auth().verifyIdToken(firebase_token);
            if (decodedToken.uid !== user.firebase_uid) {
                return res.status(401).json({ error: 'Firebase token mismatch' });
            }
        }
        
        // Generate JWT
        const token = jwt.sign(
            { id: user.id, phone: user.phone_number, type: user.user_type },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        // Update last active
        await require('../database/queries').query(
            'UPDATE users SET last_active = NOW() WHERE id = $1',
            [user.id]
        );
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                phone_number: user.phone_number,
                full_name: user.full_name,
                email: user.email,
                user_type: user.user_type,
                profile_picture_url: user.profile_picture_url,
                rating: user.rating,
                total_sales: user.total_sales,
                id_verified: user.id_verified
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// ============ SEND VERIFICATION CODE (SMS) ============
router.post('/send-verification', async (req, res) => {
    try {
        const { phone_number } = req.body;
        
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store in database with expiry
        await require('../database/queries').query(
            `INSERT INTO verification_codes (phone_number, code, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
             ON CONFLICT (phone_number) DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '10 minutes'`,
            [phone_number, code]
        );
        
        // In production, send SMS via Twilio/Africastalking
        // For now, just return (you'll implement SMS gateway)
        
        res.json({
            success: true,
            message: 'Verification code sent',
            code: process.env.NODE_ENV === 'development' ? code : undefined
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
});

// ============ VERIFY PHONE NUMBER ============
router.post('/verify-phone', async (req, res) => {
    try {
        const { phone_number, code } = req.body;
        
        const result = await require('../database/queries').query(
            `SELECT * FROM verification_codes 
             WHERE phone_number = $1 AND code = $2 AND expires_at > NOW()`,
            [phone_number, code]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }
        
        // Mark user as verified
        await require('../database/queries').query(
            'UPDATE users SET id_verified = true, verified_at = NOW() WHERE phone_number = $1',
            [phone_number]
        );
        
        // Delete used code
        await require('../database/queries').query(
            'DELETE FROM verification_codes WHERE phone_number = $1',
            [phone_number]
        );
        
        res.json({
            success: true,
            message: 'Phone number verified successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// ============ FORGOT PASSWORD ============
router.post('/forgot-password', async (req, res) => {
    try {
        const { phone_number } = req.body;
        
        const user = await getUserByPhone(phone_number);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Generate reset token
        const resetToken = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        // Store reset token
        await require('../database/queries').query(
            'UPDATE users SET reset_token = $1, reset_expires = NOW() + INTERVAL \'1 hour\' WHERE id = $2',
            [resetToken, user.id]
        );
        
        // Send SMS with reset link (implement SMS gateway)
        
        res.json({
            success: true,
            message: 'Password reset link sent',
            resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// ============ RESET PASSWORD ============
router.post('/reset-password', async (req, res) => {
    try {
        const { reset_token, new_password } = req.body;
        
        // Verify token
        const decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
        
        const result = await require('../database/queries').query(
            'SELECT * FROM users WHERE id = $1 AND reset_token = $2 AND reset_expires > NOW()',
            [decoded.id, reset_token]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);
        
        // Update password
        await require('../database/queries').query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
            [hashedPassword, decoded.id]
        );
        
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

// ============ LOGOUT ============
router.post('/logout', require('../middleware/auth').authenticate, async (req, res) => {
    try {
        // Blacklist token (implement Redis for production)
        // For now, client just discards token
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// ============ REFRESH TOKEN ============
router.post('/refresh-token', require('../middleware/auth').authenticate, async (req, res) => {
    try {
        const newToken = jwt.sign(
            { id: req.user.id, phone: req.user.phone_number, type: req.user.user_type },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.json({
            success: true,
            token: newToken
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

module.exports = router;
