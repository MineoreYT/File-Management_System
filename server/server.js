require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const folderRoutes = require('./src/routes/folderRoutes');
const fileRoutes = require('./src/routes/fileRoutes');

// Import database to initialize
require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically (with authentication in production)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large' });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({ error: 'Too many files' });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected file field' });
    }

    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});