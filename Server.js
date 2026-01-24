'use strict';

const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const db = new sqlite3.Database('moggesstore.db', (err) => {
    if (err) {
        console.error('? Error connecting to database:', err);
        process.exit(1);
    }
    console.log('? Connected to database');
});

// Disable caching for development
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    // Only set text/html for HTML files
    if (req.path.endsWith('.html') || req.path === '/') {
        res.set('Content-Type', 'text/html; charset=utf-8');
    }
    next();
});

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, 'docs')));
app.use(express.json());

// API Routes
app.get('/api/products', (req, res) => {
    db.all('SELECT Id as id, Name as name, Description as description, Price as price, Category as category, Stock as stock, Image as image FROM Products', [], (err, rows) => {
        if (err) {
            console.error('? Error fetching products:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        res.json(rows);
    });
});

app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.get('SELECT Id as id, Name as name, Description as description, Price as price, Category as category, Stock as stock, Image as image FROM Products WHERE Id = ?', [id], (err, row) => {
        if (err) {
            console.error('? Error fetching product:', err);
            return res.status(500).json({ error: 'Failed to fetch product' });
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    });
});

// Route for main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`? Server is running on http://localhost:3000`);
    console.log('?? Mogges Store - Fashion E-commerce');
    console.log('???  Using SQLite Database');
    console.log('Press Ctrl+C to stop the server');
    
    // Open browser automatically
    const url = `http://localhost:${PORT}`;
    
    // Wait a moment for server to be fully ready
    setTimeout(() => {
        exec(`start ${url}`, (error) => {
            if (error) {
                console.log('??  Could not open browser automatically. Please open manually:', url);
            } else {
                console.log('?? Opening browser...');
            }
        });
    }, 500);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n?? Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('? Error closing database:', err);
        } else {
            console.log('? Database connection closed');
        }
        process.exit(0);
    });
});
