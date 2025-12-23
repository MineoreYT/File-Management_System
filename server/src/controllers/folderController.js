const database = require('../config/database');
const path = require('path');

const createFolder = (req, res) => {
    const { name, parentId } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ error: 'Folder name is required' });
    }

    const db = database.getDb();

    // Get parent folder path if parentId is provided
    if (parentId) {
        db.get('SELECT path FROM folders WHERE id = ? AND user_id = ?', 
            [parentId, userId], (err, parentFolder) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!parentFolder) {
                return res.status(404).json({ error: 'Parent folder not found' });
            }

            const folderPath = path.posix.join(parentFolder.path, name);
            insertFolder(name, parentId, userId, folderPath, res);
        });
    } else {
        // Create in root
        const folderPath = `/${name}`;
        insertFolder(name, null, userId, folderPath, res);
    }
};

const insertFolder = (name, parentId, userId, folderPath, res) => {
    const db = database.getDb();
    
    // Check if folder with same name exists in the same parent
    db.get('SELECT id FROM folders WHERE name = ? AND parent_id = ? AND user_id = ?',
        [name, parentId, userId], (err, existingFolder) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (existingFolder) {
            return res.status(409).json({ error: 'Folder with this name already exists' });
        }

        // Insert new folder
        db.run('INSERT INTO folders (name, parent_id, user_id, path) VALUES (?, ?, ?, ?)',
            [name, parentId, userId, folderPath], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create folder' });
            }

            res.status(201).json({
                message: 'Folder created successfully',
                folder: {
                    id: this.lastID,
                    name,
                    parent_id: parentId,
                    path: folderPath,
                    created_at: new Date().toISOString()
                }
            });
        });
    });
};

const getFolders = (req, res) => {
    const userId = req.user.id;
    const parentId = req.query.parentId || null;

    const db = database.getDb();
    
    let query = 'SELECT * FROM folders WHERE user_id = ?';
    let params = [userId];

    if (parentId) {
        query += ' AND parent_id = ?';
        params.push(parentId);
    } else {
        query += ' AND parent_id IS NULL';
    }

    query += ' ORDER BY name ASC';

    db.all(query, params, (err, folders) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ folders });
    });
};

const getFolderTree = (req, res) => {
    const userId = req.user.id;
    const db = database.getDb();

    db.all('SELECT * FROM folders WHERE user_id = ? ORDER BY path ASC', [userId], (err, folders) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        // Build tree structure
        const folderMap = {};
        const tree = [];

        // Create folder map
        folders.forEach(folder => {
            folderMap[folder.id] = { ...folder, children: [] };
        });

        // Build tree
        folders.forEach(folder => {
            if (folder.parent_id === null) {
                tree.push(folderMap[folder.id]);
            } else if (folderMap[folder.parent_id]) {
                folderMap[folder.parent_id].children.push(folderMap[folder.id]);
            }
        });

        res.json({ tree });
    });
};

const renameFolder = (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ error: 'Folder name is required' });
    }

    const db = database.getDb();

    // Check if folder exists and belongs to user
    db.get('SELECT * FROM folders WHERE id = ? AND user_id = ?', [id, userId], (err, folder) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Check if new name conflicts with existing folders
        db.get('SELECT id FROM folders WHERE name = ? AND parent_id = ? AND user_id = ? AND id != ?',
            [name, folder.parent_id, userId, id], (err, existingFolder) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (existingFolder) {
                return res.status(409).json({ error: 'Folder with this name already exists' });
            }

            // Update folder name and path
            const oldPath = folder.path;
            const newPath = folder.parent_id ? 
                path.posix.join(path.dirname(oldPath), name) : 
                `/${name}`;

            db.run('UPDATE folders SET name = ?, path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, newPath, id], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to rename folder' });
                }

                // Update paths of all subfolders
                updateSubfolderPaths(oldPath, newPath, userId);

                res.json({
                    message: 'Folder renamed successfully',
                    folder: { ...folder, name, path: newPath }
                });
            });
        });
    });
};

const updateSubfolderPaths = (oldPath, newPath, userId) => {
    const db = database.getDb();
    
    db.all('SELECT * FROM folders WHERE path LIKE ? AND user_id = ?', 
        [`${oldPath}/%`, userId], (err, subfolders) => {
        if (err) return;

        subfolders.forEach(subfolder => {
            const updatedPath = subfolder.path.replace(oldPath, newPath);
            db.run('UPDATE folders SET path = ? WHERE id = ?', [updatedPath, subfolder.id]);
        });
    });
};

const deleteFolder = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const db = database.getDb();

    // Check if folder exists and belongs to user
    db.get('SELECT * FROM folders WHERE id = ? AND user_id = ?', [id, userId], (err, folder) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Delete folder (CASCADE will handle subfolders and files)
        db.run('DELETE FROM folders WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete folder' });
            }

            res.json({ message: 'Folder deleted successfully' });
        });
    });
};

module.exports = {
    createFolder,
    getFolders,
    getFolderTree,
    renameFolder,
    deleteFolder
};