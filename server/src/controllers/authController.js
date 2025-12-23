const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const database = require('../config/database');

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const db = database.getDb();

        // Check if user already exists
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', 
            [username, email], async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingUser) {
                return res.status(409).json({ error: 'Username or email already exists' });
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert new user
            db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create user' });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { userId: this.lastID, username },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.status(201).json({
                    message: 'User created successfully',
                    token,
                    user: {
                        id: this.lastID,
                        username,
                        email
                    }
                });
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const db = database.getDb();

        // Find user by username or email
        db.get('SELECT * FROM users WHERE username = ? OR email = ?', 
            [username, username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    storage_quota: user.storage_quota,
                    storage_used: user.storage_used
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getProfile = (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            storage_quota: req.user.storage_quota,
            storage_used: req.user.storage_used
        }
    });
};

module.exports = {
    register,
    login,
    getProfile
};