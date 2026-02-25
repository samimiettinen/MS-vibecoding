const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'inventory.db');

function initializeDatabase() {
  const db = new DatabaseSync(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const count = db.prepare('SELECT COUNT(*) as cnt FROM products').get();
  if (count.cnt === 0) {
    const insert = db.prepare(
      'INSERT INTO products (name, category, sku, price, quantity) VALUES (?, ?, ?, ?, ?)'
    );

    const products = [
      ['Wireless Headphones', 'Electronics', 'ELEC-001', 79.99, 45],
      ['USB-C Charging Cable', 'Electronics', 'ELEC-002', 12.99, 120],
      ['Laptop Stand', 'Electronics', 'ELEC-003', 34.99, 30],
      ['Mechanical Keyboard', 'Electronics', 'ELEC-004', 129.99, 18],
      ['Bluetooth Mouse', 'Electronics', 'ELEC-005', 49.99, 25],
      ['Running Shoes', 'Footwear', 'FOOT-001', 89.99, 60],
      ['Casual Sneakers', 'Footwear', 'FOOT-002', 64.99, 40],
      ['Leather Boots', 'Footwear', 'FOOT-003', 149.99, 15],
      ['Cotton T-Shirt', 'Clothing', 'CLTH-001', 19.99, 200],
      ['Denim Jeans', 'Clothing', 'CLTH-002', 59.99, 75],
      ['Hoodie Sweatshirt', 'Clothing', 'CLTH-003', 44.99, 50],
      ['Winter Jacket', 'Clothing', 'CLTH-004', 119.99, 22],
      ['Yoga Mat', 'Sports', 'SPRT-001', 29.99, 35],
      ['Water Bottle', 'Sports', 'SPRT-002', 24.99, 80],
      ['Resistance Bands', 'Sports', 'SPRT-003', 18.99, 65],
      ['Coffee Maker', 'Kitchen', 'KTCH-001', 59.99, 20],
      ['Cutting Board', 'Kitchen', 'KTCH-002', 22.99, 45],
      ['Chef Knife', 'Kitchen', 'KTCH-003', 79.99, 28],
      ['Notebook Set', 'Stationery', 'STAT-001', 14.99, 150],
      ['Ballpoint Pens 10-pack', 'Stationery', 'STAT-002', 8.99, 300],
    ];

    const insertMany = () => {
      db.exec('BEGIN');
      try {
        for (const item of products) {
          insert.run(...item);
        }
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    };
    insertMany();

    console.log('Database seeded with 20 products.');
  }

  return db;
}

module.exports = { initializeDatabase };
