const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('moggesstore.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('? Connected to database');
});

// Create Products table
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Products (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL,
            Description TEXT,
            Price REAL NOT NULL,
            Stock INTEGER NOT NULL DEFAULT 0,
            Category TEXT,
            CreatedAt TEXT NOT NULL,
            UpdatedAt TEXT
        )
    `);

    // Check if products already exist
    db.get('SELECT COUNT(*) as count FROM Products', [], (err, row) => {
        if (err) {
            console.error('Error checking products:', err);
            db.close();
            process.exit(1);
        }

        if (row.count === 0) {
            console.log('?? Seeding database with products...');
            
            const products = [
                ['Smartphone Pro X', 'Senaste modellen med fantastisk kamera och prestanda', 8999.00, 25, 'Electronics', new Date().toISOString()],
                ['Tradlos Horlurar', 'Noise-cancelling och lang batteritid', 1499.00, 50, 'Electronics', new Date().toISOString()],
                ['Laptop Ultra', 'Kraftfull laptop for arbete och lek', 12999.00, 15, 'Electronics', new Date().toISOString()],
                ['Smart Klocka', 'Folj din halsa och fitness', 2499.00, 30, 'Electronics', new Date().toISOString()],
                ['T-shirt Premium', 'Bekvm bomullst-shirt i hog kvalitet', 299.00, 100, 'Clothing', new Date().toISOString()],
                ['Jeans Classic', 'Klassiska jeans som passar alla', 699.00, 75, 'Clothing', new Date().toISOString()],
                ['Programmeringens Konst', 'Larbok for seriosa programmerare', 549.00, 20, 'Books', new Date().toISOString()],
                ['Yogamatta Pro', 'Halkfri och bekvm yogamatta', 399.00, 40, 'Sports', new Date().toISOString()],
                ['Kaffemaskin Deluxe', 'Brygg perfekt kaffe varje gang', 1899.00, 12, 'Home', new Date().toISOString()],
                ['Tradgardsset', 'Komplett set for tradgardsskotsel', 899.00, 8, 'Garden', new Date().toISOString()]
            ];

            const stmt = db.prepare(`
                INSERT INTO Products (Name, Description, Price, Stock, Category, CreatedAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            products.forEach(product => {
                stmt.run(product, (err) => {
                    if (err) {
                        console.error('Error inserting product:', err);
                    }
                });
            });

            stmt.finalize((err) => {
                if (err) {
                    console.error('Error finalizing statement:', err);
                } else {
                    console.log('? Database seeded successfully!');
                }
                closeDatabase();
            });
        } else {
            console.log('? Database already contains products');
            closeDatabase();
        }
    });
});

function closeDatabase() {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('?? Database initialization complete!');
        }
    });
}

