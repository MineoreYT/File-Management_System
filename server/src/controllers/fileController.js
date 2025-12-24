const database = require('../config/database');
const validator = require('validator');
const fs = require('fs');
const path = require('path');

const uploadFiles = (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = req.user.id;
    const folderId = req.body.folderId || null;
    const db = database.getDb();

    // Verify folder exists if folderId is provided
    if (folderId) {
        db.get('SELECT id FROM folders WHERE id = ? AND user_id = ?', 
            [folderId, userId], (err, folder) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!folder) {
                return res.status(404).json({ error: 'Folder not found' });
            }
            processFileUploads(req.files, userId, folderId, res);
        });
    } else {
        processFileUploads(req.files, userId, null, res);
    }
};

const processFileUploads = (files, userId, folderId, res) => {
    const db = database.getDb();
    const uploadedFiles = [];
    let totalSize = 0;

    // Prepare batch insert
    const insertPromises = files.map(file => {
        return new Promise((resolve, reject) => {
            const fileData = {
                name: file.filename,
                original_name: file.originalname,
                file_path: file.path,
                file_size: file.size,
                mime_type: file.mimetype,
                folder_id: folderId,
                user_id: userId
            };

            db.run(`INSERT INTO files (name, original_name, file_path, file_size, mime_type, folder_id, user_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [fileData.name, fileData.original_name, fileData.file_path, 
                 fileData.file_size, fileData.mime_type, fileData.folder_id, fileData.user_id],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        totalSize += file.size;
                        uploadedFiles.push({
                            id: this.lastID,
                            ...fileData,
                            created_at: new Date().toISOString()
                        });
                        resolve();
                    }
                });
        });
    });

    Promise.all(insertPromises)
        .then(() => {
            // Update user storage usage
            db.run('UPDATE users SET storage_used = storage_used + ? WHERE id = ?',
                [totalSize, userId], (err) => {
                if (err) {
                    console.error('Error updating storage usage:', err);
                }
            });

            res.status(201).json({
                message: 'Files uploaded successfully',
                files: uploadedFiles,
                totalSize
            });
        })
        .catch(err => {
            console.error('Error inserting files:', err);
            
            // Clean up uploaded files on database error
            files.forEach(file => {
                fs.unlink(file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Error deleting file:', unlinkErr);
                });
            });

            res.status(500).json({ error: 'Failed to save file information' });
        });
};

const getFiles = (req, res) => {
    const userId = req.user.id;
    const folderId = req.query.folderId || null;
    const getAllFiles = req.query.all === 'true'; // New parameter to get all files
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder || 'ASC';

    console.log('getFiles called with params:', { userId, folderId, getAllFiles, search, sortBy, sortOrder });

    // Validate and sanitize inputs
    if (folderId && !validator.isInt(String(folderId), { min: 1 })) {
        return res.status(400).json({ error: 'Invalid folder ID' });
    }

    // Sanitize search query
    const sanitizedSearch = search ? validator.escape(search.trim()) : null;
    
    // Validate sort parameters
    const validSortColumns = ['name', 'original_name', 'file_size', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    const db = database.getDb();
    
    let query = 'SELECT * FROM files WHERE user_id = ?';
    let params = [userId];

    // Only filter by folder if not getting all files
    if (!getAllFiles) {
        if (folderId) {
            query += ' AND folder_id = ?';
            params.push(folderId);
        } else {
            query += ' AND folder_id IS NULL';
        }
    }

    if (sanitizedSearch) {
        query += ' AND (original_name LIKE ? OR name LIKE ?)';
        params.push(`%${sanitizedSearch}%`, `%${sanitizedSearch}%`);
    }

    // Add sorting with validated parameters
    query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    console.log('Executing query:', query, 'with params:', params);

    db.all(query, params, (err, files) => {
        if (err) {
            console.error('Database error in getFiles:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        console.log(`Found ${files.length} files for user ${userId}`);
        res.json({ files });
    });
};

const downloadFile = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const db = database.getDb();

    db.get('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId], (err, file) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Check if file exists on disk
        if (!fs.existsSync(file.file_path)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        res.setHeader('Content-Length', file.file_size);

        // Stream file to response
        const fileStream = fs.createReadStream(file.file_path);
        fileStream.pipe(res);
    });
};

const deleteFile = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const db = database.getDb();

    db.get('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId], (err, file) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete from database
        db.run('DELETE FROM files WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete file' });
            }

            // Delete physical file
            fs.unlink(file.file_path, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting physical file:', unlinkErr);
                }
            });

            // Update user storage usage
            db.run('UPDATE users SET storage_used = storage_used - ? WHERE id = ?',
                [file.file_size, userId], (err) => {
                if (err) {
                    console.error('Error updating storage usage:', err);
                }
            });

            res.json({ message: 'File deleted successfully' });
        });
    });
};

const renameFile = (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'File name is required and must be a string' });
    }

    // Sanitize and validate file name
    const sanitizedName = validator.escape(name.trim());
    
    // Check for valid filename (no path traversal, special chars)
    if (!/^[a-zA-Z0-9._\-\s()]+$/.test(sanitizedName) || sanitizedName.length > 255) {
        return res.status(400).json({ 
            error: 'Invalid file name. Use only letters, numbers, spaces, dots, hyphens, underscores, and parentheses. Max 255 characters.' 
        });
    }

    // Validate ID parameter
    if (!validator.isInt(id, { min: 1 })) {
        return res.status(400).json({ error: 'Invalid file ID' });
    }

    const db = database.getDb();

    db.get('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId], (err, file) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        db.run('UPDATE files SET original_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [sanitizedName, id], function(err) {
            if (err) {
                console.error('Error renaming file:', err);
                return res.status(500).json({ error: 'Failed to rename file' });
            }

            res.json({
                message: 'File renamed successfully',
                file: { ...file, original_name: sanitizedName }
            });
        });
    });
};

const moveFile = (req, res) => {
    const { id } = req.params;
    const { folderId } = req.body;
    const userId = req.user.id;

    // Validate ID parameter
    if (!validator.isInt(id, { min: 1 })) {
        return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Validate folderId if provided
    if (folderId !== null && folderId !== undefined && !validator.isInt(String(folderId), { min: 1 })) {
        return res.status(400).json({ error: 'Invalid folder ID' });
    }

    const db = database.getDb();

    // Verify file exists
    db.get('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId], (err, file) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Verify target folder exists if folderId is provided
        if (folderId) {
            db.get('SELECT id FROM folders WHERE id = ? AND user_id = ?', 
                [folderId, userId], (err, folder) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                if (!folder) {
                    return res.status(404).json({ error: 'Target folder not found' });
                }
                updateFileLocation(id, folderId, res);
            });
        } else {
            updateFileLocation(id, null, res);
        }
    });
};

const updateFileLocation = (fileId, folderId, res) => {
    const db = database.getDb();
    
    db.run('UPDATE files SET folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [folderId, fileId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to move file' });
        }

        res.json({ message: 'File moved successfully' });
    });
};

const getFilePreview = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const db = database.getDb();

    db.get('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId], (err, file) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Check if file exists on disk
        if (!fs.existsSync(file.file_path)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        res.setHeader('Content-Length', file.file_size);

        // Stream file to response
        const fileStream = fs.createReadStream(file.file_path);
        fileStream.pipe(res);
    });
};

module.exports = {
    uploadFiles,
    getFiles,
    downloadFile,
    deleteFile,
    renameFile,
    moveFile,
    getFilePreview
};