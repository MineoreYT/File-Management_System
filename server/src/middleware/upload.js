const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create user-specific directory
        const userDir = path.join(uploadsDir, req.user.id.toString());
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allow all file types for now, but you can add restrictions here
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 10 // Maximum 10 files at once
    }
});

// Middleware to check storage quota
const checkStorageQuota = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
    const newUsage = req.user.storage_used + totalSize;

    if (newUsage > req.user.storage_quota) {
        // Delete uploaded files if quota exceeded
        req.files.forEach(file => {
            fs.unlink(file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        });
        
        return res.status(413).json({ 
            error: 'Storage quota exceeded',
            quota: req.user.storage_quota,
            used: req.user.storage_used,
            required: totalSize
        });
    }

    next();
};

module.exports = {
    upload,
    checkStorageQuota
};