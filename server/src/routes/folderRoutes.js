const express = require('express');
const { 
    createFolder, 
    getFolders, 
    getFolderTree, 
    renameFolder, 
    deleteFolder 
} = require('../controllers/folderController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All folder routes require authentication
router.use(authenticateToken);

router.post('/', createFolder);
router.get('/', getFolders);
router.get('/tree', getFolderTree);
router.put('/:id', renameFolder);
router.delete('/:id', deleteFolder);

module.exports = router;