const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window per IP
    message: {
        error: 'Too many authentication attempts, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful requests
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registration attempts per hour per IP
    message: {
        error: 'Too many registration attempts, please try again later',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Public routes with rate limiting
router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

module.exports = router;