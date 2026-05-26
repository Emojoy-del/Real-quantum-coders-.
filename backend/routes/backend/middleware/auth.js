const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const { getUserById } = require('../database/queries');

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
    });
}

// Main authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Try JWT verification first
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            // If JWT fails, try Firebase token
            try {
                const firebaseDecoded = await admin.auth().verifyIdToken(token);
                decoded = { id: firebaseDecoded.uid };
            } catch (firebaseError) {
                return res.status(401).json({ error: 'Invalid token' });
            }
        }
        
        // Get user from database
        const user = await getUserById(decoded.id);
        
        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }
        
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// Role-based middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        if (!roles.includes(req.user.user_type)) {
            return res.status(403).json({ 
                error: `Access denied. Required role: ${roles.join(' or ')}` 
            });
        }
        
        next();
    };
};

// Specific role middlewares
const requireArtisan = requireRole(['artisan', 'admin']);
const requireBuyer = requireRole(['local_buyer', 'foreign_buyer', 'admin']);
const requireAdmin = requireRole(['admin']);

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await getUserById(decoded.id);
                if (user && user.is_active) {
                    req.user = user;
                }
            } catch (e) {
                // Token invalid but that's ok for optional auth
            }
        }
        next();
    } catch (error) {
        next();
    }
};

module.exports = { 
    authenticate, 
    requireArtisan, 
    requireBuyer, 
    requireAdmin,
    optionalAuth 
};