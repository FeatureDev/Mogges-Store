const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('moggesstore.db', (err) => {
    if (err) {
        console.error('? Error opening database:', err);
        process.exit(1);
    }
    console.log('? Connected to database');
});

// Create Products table
db.serialize(() => {
    // Drop existing table to recreate with fresh data
    db.run('DROP TABLE IF EXISTS Products');
    
    db.run(`
        CREATE TABLE Products (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL,
            Description TEXT,
            Price REAL NOT NULL,
            Stock INTEGER NOT NULL DEFAULT 0,
            Category TEXT,
            Image TEXT
        )
    `, (err) => {
        if (err) {
            console.error('? Error creating table:', err);
            return;
        }
        console.log('? Products table created');
    });

    // Insert all products
    const products = [
        {
            name: "Elegant Sommarklanning",
            description: "Latt och luftig klanning perfekt for varma sommardagar",
            price: 599,
            category: "Dam Mode",
            stock: 15,
            image: "picture/1.jpg"
        },
        {
            name: "Modern Herrjacka",
            description: "Stilren jacka for bade vardag och fest",
            price: 899,
            category: "Herr Mode",
            stock: 8,
            image: "picture/2.jpg"
        },
        {
            name: "Designervaska",
            description: "Exklusiv handvaska i akta lader",
            price: 1299,
            category: "Accessoarer",
            stock: 5,
            image: "picture/3.jpg"
        },
        {
            name: "Klassisk Blus",
            description: "Tidlos blus som passar till allt",
            price: 449,
            category: "Dam Mode",
            stock: 20,
            image: "picture/4.jpg"
        },
        {
            name: "Sport Sneakers",
            description: "Bekvama och moderna sneakers",
            price: 799,
            category: "Skor",
            stock: 12,
            image: "picture/5.jpg"
        },
        {
            name: "Vinterkappa Dam",
            description: "Varm och stilfull vinterkappa",
            price: 1599,
            category: "Dam Mode",
            stock: 6,
            image: "picture/1.jpg"
        },
        {
            name: "Herrskjorta Premium",
            description: "Hogkvalitativ bomullsskjorta",
            price: 549,
            category: "Herr Mode",
            stock: 18,
            image: "picture/2.jpg"
        },
        {
            name: "Solglasogon Designer",
            description: "Trendiga solglasogon med UV-skydd",
            price: 399,
            category: "Accessoarer",
            stock: 25,
            image: "picture/3.jpg"
        }
    ];

    const stmt = db.prepare(`
        INSERT INTO Products (Name, Description, Price, Category, Stock, Image)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    products.forEach(product => {
        stmt.run(
            product.name,
            product.description,
            product.price,
            product.category,
            product.stock,
            product.image
        );
    });

    stmt.finalize((err) => {
        if (err) {
            console.error('? Error inserting products:', err);
            return;
        }
        console.log('? Inserted', products.length, 'products');
        
        // Verify data
        db.all('SELECT * FROM Products', (err, rows) => {
            if (err) {
                console.error('? Error reading products:', err);
                return;
            }
            console.log('\n?? Products in database:');
            rows.forEach(row => {
                console.log(`  - ${row.Name} (${row.Price} kr) - ${row.Category}`);
            });
            console.log('\n? Database initialized successfully!\n');
            db.close();
        });
    });
});
