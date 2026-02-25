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
      ['Mac mini M4 (16GB / 256GB)', 'Mac Mini', 'MM-BASE-001', 699.00, 24],
      ['Mac mini M4 (16GB / 512GB)', 'Mac Mini', 'MM-BASE-002', 899.00, 18],
      ['Mac mini M4 (24GB / 512GB)', 'Mac Mini', 'MM-OPENCLAW-001', 1099.00, 12],
      ['Mac mini M4 Pro (24GB / 1TB)', 'Mac Mini', 'MM-PRO-001', 1599.00, 8],
      ['Mac mini M4 Pro (48GB / 1TB)', 'Mac Mini', 'MM-PRO-002', 1999.00, 5],
      ['OpenClaw Ready Bundle (M4 24GB)', 'OpenClaw Bundle', 'OC-BUNDLE-001', 1299.00, 10],
      ['OpenClaw Team Bundle (3x M4)', 'OpenClaw Bundle', 'OC-BUNDLE-002', 3599.00, 4],
      ['OpenClaw CI Bundle (M4 Pro)', 'OpenClaw Bundle', 'OC-BUNDLE-003', 4899.00, 3],
      ['Thunderbolt 4 Dock', 'Accessories', 'ACC-TB4-001', 279.00, 22],
      ['USB-C to Ethernet Adapter', 'Accessories', 'ACC-NET-001', 39.00, 60],
      ['Magic Keyboard with Touch ID', 'Accessories', 'ACC-KB-001', 199.00, 16],
      ['Magic Trackpad', 'Accessories', 'ACC-TP-001', 149.00, 20],
      ['HDMI 2.1 Cable (2m)', 'Accessories', 'ACC-HDMI-001', 24.00, 90],
      ['External NVMe SSD 2TB', 'Storage', 'STO-NVME-001', 239.00, 27],
      ['External NVMe SSD 4TB', 'Storage', 'STO-NVME-002', 429.00, 14],
      ['10GbE Switch (8-port)', 'Networking', 'NET-10G-001', 549.00, 7],
      ['Wi-Fi 6E Mesh Router', 'Networking', 'NET-WIFI-001', 329.00, 11],
      ['AppleCare+ for Mac mini (3 years)', 'Service', 'SRV-ACARE-001', 99.00, 40],
      ['OpenClaw Provisioning Service', 'Service', 'SRV-OPENCLAW-001', 149.00, 26],
      ['Priority Deployment Support (Monthly)', 'Service', 'SRV-SUP-001', 299.00, 15],
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
