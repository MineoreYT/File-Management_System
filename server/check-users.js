const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Checking users in database...\n');

db.all('SELECT id, username, email, created_at FROM users', (err, rows) => {
    if (err) {
        console.error('Error querying database:', err);
        return;
    }
    
    if (rows.length === 0) {
        console.log('No users found in database.');
    } else {
        console.log('Existing users:');
        console.table(rows);
    }
    
    db.close();
});