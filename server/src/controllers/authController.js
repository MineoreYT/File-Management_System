const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const database = require('../config/database');

// Password strength validation
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
        return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
        return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
        return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
        return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
        return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
    }
    
    return null; // Password is valid
};

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address' });
        }

        // Validate username (alphanumeric, 3-20 characters)
        if (!validator.isAlphanumeric(username) || username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters' });
        }

        // Validate password strength
        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ error: passwordError });
        }

        // Sanitize inputs
        const sanitizedUsername = validator.escape(username.trim());
        const sanitizedEmail = validator.normalizeEmail(email.trim());

        const db = database.getDb();

        // Check if user already exists
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', 
            [sanitizedUsername, sanitizedEmail], async (err, existingUser) => {
            if (err) {
                console.error('Database error during registration:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingUser) {
                return res.status(409).json({ error: 'Username or email already exists' });
            }

            // Hash password with higher salt rounds for better security
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert new user
            db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [sanitizedUsername, sanitizedEmail, hashedPassword], function(err) {
                if (err) {
                    console.error('Failed to create user:', err);
                    return res.status(500).json({ error: 'Failed to create user' });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { userId: this.lastID, username: sanitizedUsername },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.status(201).json({
                    message: 'User created successfully',
                    token,
                    user: {
                        id: this.lastID,
                        username: sanitizedUsername,
                        email: sanitizedEmail
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

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Sanitize username input
        const sanitizedUsername = validator.escape(username.trim());

        const db = database.getDb();

        // Find user by username or email
        db.get('SELECT * FROM users WHERE username = ? OR email = ?', 
            [sanitizedUsername, sanitizedUsername], async (err, user) => {
            if (err) {
                console.error('Database error during login:', err);
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