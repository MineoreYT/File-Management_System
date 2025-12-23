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
        // Generate unique filename with sanitized original name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// Enhanced file filter with security validation
const fileFilter = (req, file, cb) => {
    // Define allowed file types (whitelist approach)
    const allowedMimeTypes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // Documents
        'application/pdf', 'text/plain', 'text/csv', 'application/json',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Archives
        'application/zip', 'application/x-rar-compressed', 'application/x-tar', 'application/gzip',
        // Media
        'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'
    ];

    const allowedExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
        '.pdf', '.txt', '.csv', '.json', '.md',
        '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.rar', '.tar', '.gz',
        '.mp4', '.avi', '.mov', '.wmv',
        '.mp3', '.wav', '.ogg', '.m4a'
    ];

    // Get file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Check MIME type and extension
    const isMimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
    const isExtensionAllowed = allowedExtensions.includes(fileExtension);
    
    // Additional security checks
    const hasValidName = /^[a-zA-Z0-9._-]+$/.test(path.basename(file.originalname, fileExtension));
    const isNotExecutable = !['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar', '.app', '.deb', '.rpm'].includes(fileExtension);
    
    if (isMimeTypeAllowed && isExtensionAllowed && hasValidName && isNotExecutable) {
        cb(null, true);
    } else {
        const error = new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`);
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
    }
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