const { getDb } = require('./database');

const products = [
  { sku: 'ELEC-101', name: 'Logitech MX Master 3S Mouse',          category: 'Electronics', unit_price: 99.99,  quantity: 20, min_stock_level: 5 },
  { sku: 'ELEC-102', name: 'Dell UltraSharp 27" 4K Monitor',       category: 'Electronics', unit_price: 449.50, quantity: 3,  min_stock_level: 5 },
  { sku: 'ELEC-103', name: 'Mechanical Keyboard RGB',               category: 'Electronics', unit_price: 119.00, quantity: 0,  min_stock_level: 4 },
  { sku: 'AUDIO-201', name: 'Sony WH-1000XM5 Headphones',          category: 'Audio',       unit_price: 399.00, quantity: 20, min_stock_level: 4 },
  { sku: 'FURN-401',  name: 'Ergonomic Office Chair',               category: 'Furniture',   unit_price: 349.00, quantity: 8,  min_stock_level: 2 },
  { sku: 'STAT-302',  name: 'Gel Ink Rollerball Pen (Pack of 12)',  category: 'Stationery',  unit_price: 18.00,  quantity: 2,  min_stock_level: 8 },
];

function seed() {
  const db = getDb();

  const countRow = db.prepare('SELECT COUNT(*) as c FROM products').get();
  if (countRow.c > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  const insertProduct = db.prepare(
    'INSERT INTO products (sku, name, category, unit_price, quantity, min_stock_level) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertTx = db.prepare(
    'INSERT INTO stock_transactions (product_id, type, quantity, previous_quantity, new_quantity, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const doSeed = db.transaction(() => {
    for (const p of products) {
      const info = insertProduct.run(p.sku, p.name, p.category, p.unit_price, p.quantity, p.min_stock_level);
      if (p.quantity > 0) {
        insertTx.run(info.lastInsertRowid, 'IN', p.quantity, 0, p.quantity, 'Initial supplier delivery PO-2026-01', '2026-11-20T10:00:00Z');
      }
    }

    // Extra OUT movement for ELEC-101 (20 → 14)
    const elec101 = db.prepare("SELECT id FROM products WHERE sku = 'ELEC-101'").get();
    insertTx.run(elec101.id, 'OUT', 6, 20, 14, 'Customer order #10041', '2026-11-26T14:20:00Z');
    db.prepare('UPDATE products SET quantity = 14 WHERE id = ?').run(elec101.id);
  });

  doSeed();
  console.log('✅ Database seeded with sample data.');
}

module.exports = { seed };
