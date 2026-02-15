-- schema.sql
-- Database schema for Mogges Store (Cloudflare D1)

DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Products;

CREATE TABLE Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Email TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    Role TEXT NOT NULL
);

CREATE TABLE Products (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Description TEXT,
    Price REAL NOT NULL,
    Category TEXT,
    Stock INTEGER NOT NULL,
    Image TEXT
);
