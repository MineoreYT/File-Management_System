const express = require('express');
const { 
    uploadFiles, 
    getFiles, 
    downloadFile, 
    deleteFile, 
    renameFile, 
    moveFile,
    getFilePreview 
} = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');
const { upload, checkStorageQuota } = require('../middleware/upload');

const router = express.Router();

// All file routes require authentication
router.use(authenticateToken);

// Upload route with proper middleware order
router.post('/upload', (req, res, next) => {
    // Ensure user is authenticated before multer processes
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}, upload.array('files', 10), checkStorageQuota, uploadFiles);

router.get('/', getFiles);
router.get('/:id/download', downloadFile);
router.get('/:id/preview', getFilePreview);
router.put('/:id/rename', renameFile);
router.put('/:id/move', moveFile);
router.delete('/:id', deleteFile);

module.exports = router;