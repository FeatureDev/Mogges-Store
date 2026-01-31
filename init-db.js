import * as database from './database.js';
import bcrypt from 'bcryptjs';

async function initializeDatabase() {
    try {
        // Initialize database
        await database.initDatabase();
        console.log('?? Database initialized');
        
        // Drop existing tables
        database.run('DROP TABLE IF EXISTS Products');
        database.run('DROP TABLE IF EXISTS Users');
        console.log('???  Dropped existing tables');
        
        // Create Products table
        database.run(`
            CREATE TABLE Products (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                Description TEXT,
                Price REAL NOT NULL,
                Stock INTEGER NOT NULL DEFAULT 0,
                Category TEXT,
                Image TEXT
            )
        `);
        console.log('? Products table created');

        // Create Users table
        database.run(`
            CREATE TABLE Users (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Email TEXT UNIQUE NOT NULL,
                Password TEXT NOT NULL,
                Role TEXT NOT NULL DEFAULT 'user',
                CreatedAt TEXT NOT NULL
            )
        `);
        console.log('? Users table created');

        // Insert products
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

        products.forEach(product => {
            database.run(`
                INSERT INTO Products (Name, Description, Price, Category, Stock, Image)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                product.name,
                product.description,
                product.price,
                product.category,
                product.stock,
                product.image
            ]);
        });

        console.log('?? Inserted', products.length, 'products');

        // Insert default admin user
        const adminEmail = 'admin@moggesstore.se';
        const adminPassword = 'admin123';
        
        const hash = await bcrypt.hash(adminPassword, 10);
        
        database.run(`
            INSERT INTO Users (Email, Password, Role, CreatedAt)
            VALUES (?, ?, ?, ?)
        `, [adminEmail, hash, 'admin', new Date().toISOString()]);
        
        console.log('?? Admin user created');
        console.log('   Email:', adminEmail);
        console.log('   Password:', adminPassword);
        console.log('   ??  CHANGE THIS PASSWORD IN PRODUCTION!');
        
        // Verify data
        const productRows = database.all('SELECT * FROM Products');
        console.log('\n?? Products in database:');
        productRows.forEach(row => {
            console.log(`  - ${row.Name} (${row.Price} kr) - ${row.Category}`);
        });
        console.log('\n? Database initialized successfully!\n');
        
        database.close();
        process.exit(0);
        
    } catch (err) {
        console.error('? Error initializing database:', err);
        process.exit(1);
    }
}

// Run initialization
initializeDatabase();
