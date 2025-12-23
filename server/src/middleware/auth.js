const jwt = require('jsonwebtoken');
const database = require('../config/database');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        
        // Get user details from database
        const db = database.getDb();
        db.get('SELECT id, username, email, storage_quota, storage_used FROM users WHERE id = ?', 
            [user.userId], (err, userRow) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!userRow) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            req.user = userRow;
            next();
        });
    });
};

module.exports = { authenticateToken };