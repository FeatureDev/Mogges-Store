PRAGMA foreign_keys = ON;

-- =====================================================
-- DROP TABLES (ORDER IS IMPORTANT)
-- =====================================================
DROP TABLE IF EXISTS UserLikeMark;
DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS UserProfile;
DROP TABLE IF EXISTS Users;

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Email TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    Role TEXT NOT NULL
        CHECK (Role IN ('admin', 'user', 'employee'))
);

-- =====================================================
-- USER PROFILE (1–1 WITH USERS)
-- =====================================================
CREATE TABLE UserProfile (
    UserId INTEGER PRIMARY KEY,
    ApiKey TEXT,
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
        ON DELETE CASCADE
);

-- =====================================================
-- PRODUCTS
-- =====================================================
CREATE TABLE Products (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Description TEXT,
    Price REAL NOT NULL,
    Category TEXT,
    Stock INTEGER NOT NULL CHECK (Stock >= 0),
    Image TEXT
);

-- =====================================================
-- CORE PRODUCTS (INITIAL DATA)
-- =====================================================
INSERT INTO Products (Name, Description, Price, Category, Stock, Image) VALUES
('Elegant Sommarklänning', 'Lätt och luftig klänning perfekt för varma sommardagar', 599, 'Dam Mode', 15, 'picture/1.jpg'),
('Modern Herrjacka', 'Stilren jacka för både vardag och fest', 899, 'Herr Mode', 8, 'picture/2.jpg'),
('Designerväska', 'Exklusiv handväska i äkta läder', 1299, 'Accessoarer', 5, 'picture/3.jpg'),
('Klassisk Blus', 'Tidlös blus som passar till allt', 449, 'Dam Mode', 20, 'picture/4.jpg'),
('Sport Sneakers', 'Bekväma och moderna sneakers', 799, 'Skor', 12, 'picture/5.jpg'),
('Vinterkappa Dam', 'Varm och stilfull vinterkappa', 1599, 'Dam Mode', 6, 'picture/1.jpg'),
('Herrskjorta Premium', 'Högkvalitativ bomullsskjorta', 549, 'Herr Mode', 18, 'picture/2.jpg'),
('Solglasögon Designer', 'Trendiga solglasögon med UV-skydd', 399, 'Accessoarer', 25, 'picture/3.jpg');

-- =====================================================
-- USER LIKE MARK (BOOKMARK / INTEREST)
-- =====================================================
CREATE TABLE UserLikeMark (
    UserId INTEGER NOT NULL,
    ProductId INTEGER NOT NULL,
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (UserId, ProductId),

    FOREIGN KEY (UserId) REFERENCES Users(Id)
        ON DELETE CASCADE,

    FOREIGN KEY (ProductId) REFERENCES Products(Id)
        ON DELETE CASCADE
);

-- =====================================================
-- ORDERS
-- =====================================================
CREATE TABLE Orders (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER NOT NULL,
    Status TEXT NOT NULL
        CHECK (Status IN ('pending', 'paid', 'shipped', 'cancelled')),
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
        ON DELETE CASCADE
);

-- =====================================================
-- ORDER ITEMS
-- =====================================================
CREATE TABLE OrderItems (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    OrderId INTEGER NOT NULL,
    ProductId INTEGER NOT NULL,
    Quantity INTEGER NOT NULL CHECK (Quantity > 0),
    Price REAL NOT NULL,

    FOREIGN KEY (OrderId) REFERENCES Orders(Id)
        ON DELETE CASCADE,

    FOREIGN KEY (ProductId) REFERENCES Products(Id)
);

-- =====================================================
-- INDEXES (PERFORMANCE)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(Email);
CREATE INDEX IF NOT EXISTS idx_products_category ON Products(Category);
CREATE INDEX IF NOT EXISTS idx_orders_user ON Orders(UserId);
CREATE INDEX IF NOT EXISTS idx_orderitems_order ON OrderItems(OrderId);
CREATE INDEX IF NOT EXISTS idx_userlikemark_user ON UserLikeMark(UserId);
CREATE INDEX IF NOT EXISTS idx_userlikemark_product ON UserLikeMark(ProductId);

-- =====================================================
-- INITIAL ADMIN USER
-- =====================================================
INSERT INTO Users (Email, Password, Role)
VALUES (
    'morganlindbom@yahoo.com',
    '$2a$10$nZF66bBRj3jwEeIwU1BRaeruDur2o1exnfnw3LY2w4DeioKLIbffm',
    'admin'
);

INSERT INTO UserProfile (UserId)
VALUES (last_insert_rowid());
