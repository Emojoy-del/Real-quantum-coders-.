const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// WebSocket setup
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.on('authenticate', (token) => {
        // Verify token and associate socket with user
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.join(`user_${decoded.id}`);
            console.log(`User ${decoded.id} authenticated on socket`);
        } catch (error) {
            console.error('Socket auth error:', error);
        }
    });
    
    socket.on('join_negotiation', (negotiationId) => {
        socket.join(`negotiation_${negotiationId}`);
        console.log(`Socket ${socket.id} joined negotiation ${negotiationId}`);
    });
    
    socket.on('leave_negotiation', (negotiationId) => {
        socket.leave(`negotiation_${negotiationId}`);
    });
    
    socket.on('send_negotiation_message', async (data) => {
        const { negotiationId, message } = data;
        
        // Save message to database
        const { query } = require('./database/queries');
        await query(
            `INSERT INTO negotiation_messages (negotiation_id, user_id, message)
             VALUES ($1, $2, $3)`,
            [negotiationId, socket.userId, message]
        );
        
        // Broadcast to others in the room
        socket.to(`negotiation_${negotiationId}`).emit('new_message', {
            userId: socket.userId,
            message,
            timestamp: new Date(),
            isOwn: false
        });
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Import routes
const authRoutes = require('./routes/auth');
const artefactRoutes = require('./routes/artefacts');
const negotiationRoutes = require('./routes/negotiations');
const transactionRoutes = require('./routes/transactions');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const reviewRoutes = require('./routes/reviews');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/artefacts', artefactRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    
    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };