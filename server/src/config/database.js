const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbPath = path.join(__dirname, '../../database.sqlite');
        
        // Create database directory if it doesn't exist
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        const schemaPath = path.join(__dirname, '../models/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute the entire schema as one statement
        this.db.exec(schema, (err) => {
            if (err) {
                console.error('Error creating tables:', err.message);
            } else {
                console.log('Database tables created successfully');
            }
        });
    }

    getDb() {
        return this.db;
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = new Database();