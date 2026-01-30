'use strict';

const initSqlJs = require('sql.js');
const fs = require('fs');

let SQL;
let db;

const DB_PATH = 'moggesstore.db';

// Initialize sql.js and load/create database
async function initDatabase() {
    SQL = await initSqlJs();
    
    try {
        // Try to load existing database
        if (fs.existsSync(DB_PATH)) {
            const fileBuffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(fileBuffer);
            console.log('?? Loaded existing database');
        } else {
            // Create new database
            db = new SQL.Database();
            console.log('?? Created new database');
        }
    } catch (err) {
        console.error('? Error initializing database:', err);
        throw err;
    }
}

// Save database to file
function saveDatabase() {
    try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    } catch (err) {
        console.error('? Error saving database:', err);
        throw err;
    }
}

// Wrapper functions to mimic sqlite3 API
function all(query, params = []) {
    try {
        const stmt = db.prepare(query);
        stmt.bind(params);
        
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        
        return results;
    } catch (err) {
        console.error('? Error in all():', err);
        throw err;
    }
}

function get(query, params = []) {
    try {
        const stmt = db.prepare(query);
        stmt.bind(params);
        
        let result = null;
        if (stmt.step()) {
            result = stmt.getAsObject();
        }
        stmt.free();
        
        return result;
    } catch (err) {
        console.error('? Error in get():', err);
        throw err;
    }
}

function run(query, params = []) {
    try {
        db.run(query, params);
        saveDatabase();
        
        // Return changes count and lastID
        const changes = db.getRowsModified();
        const lastID = all('SELECT last_insert_rowid() as id')[0]?.id || 0;
        
        return { changes, lastID };
    } catch (err) {
        console.error('? Error in run():', err);
        throw err;
    }
}

function close() {
    if (db) {
        saveDatabase();
        db.close();
        console.log('?? Database connection closed');
    }
}

module.exports = {
    initDatabase,
    saveDatabase,
    all,
    get,
    run,
    close
};
