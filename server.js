const express = require('express');
const path = require('path');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

const db = initializeDatabase();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET all products (with optional search and category filter)
app.get('/api/products', (req, res) => {
  const { search, category } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];
  const conditions = [];

  if (search) {
    conditions.push('(name LIKE ? OR sku LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category && category !== 'All') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY name ASC';

  const products = db.prepare(query).all(...params);
  res.json(products);
});

// GET categories
app.get('/api/categories', (req, res) => {
  const categories = db
    .prepare('SELECT DISTINCT category FROM products ORDER BY category ASC')
    .all()
    .map((r) => r.category);
  res.json(categories);
});

// POST add product
app.post('/api/products', (req, res) => {
  const { name, category, sku, price, quantity } = req.body;
  if (!name || !category || !sku || price == null || quantity == null) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Price must be a non-negative number.' });
  }
  if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative integer.' });
  }
  try {
    const result = db
      .prepare(
        'INSERT INTO products (name, category, sku, price, quantity) VALUES (?, ?, ?, ?, ?)'
      )
      .run(name.trim(), category.trim(), sku.trim().toUpperCase(), Number(price), Number(quantity));
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A product with this SKU already exists.' });
    }
    res.status(500).json({ error: 'Failed to add product.' });
  }
});

// PATCH update quantity
app.patch('/api/products/:id/quantity', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  if (quantity == null || !Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative integer.' });
  }
  const result = db
    .prepare('UPDATE products SET quantity = ? WHERE id = ?')
    .run(Number(quantity), id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json(product);
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Inventory app running at http://localhost:${PORT}`);
});
