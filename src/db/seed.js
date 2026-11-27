const { getDb } = require('./database');

// Real Indian market products with actual MRP prices (Nov 2026)
const products = [
  // Electronics
  { sku: 'ELEC-101', name: 'HP 15s Intel Core i5 Laptop (8GB/512GB SSD)', category: 'Electronics', unit_price: 54990, quantity: 12, min_stock_level: 3 },
  { sku: 'ELEC-102', name: 'Samsung Galaxy Tab A9+ (8GB/128GB)',           category: 'Electronics', unit_price: 27999, quantity: 2,  min_stock_level: 4 },
  { sku: 'ELEC-103', name: 'Canon PIXMA G3010 Wireless Ink Tank Printer',  category: 'Electronics', unit_price: 13495, quantity: 0,  min_stock_level: 2 },
  { sku: 'ELEC-104', name: 'Realme Buds Air 5 Pro TWS Earbuds',            category: 'Electronics', unit_price: 3999,  quantity: 35, min_stock_level: 10 },

  // Audio
  { sku: 'AUDIO-201', name: 'Sony WH-1000XM5 Wireless Headphones',         category: 'Audio',       unit_price: 24990, quantity: 7,  min_stock_level: 3 },
  { sku: 'AUDIO-202', name: 'JBL Go 4 Portable Bluetooth Speaker',          category: 'Audio',       unit_price: 2999,  quantity: 3,  min_stock_level: 6 },

  // Furniture
  { sku: 'FURN-301', name: 'Green Soul Monster Ultimate Gaming Chair',      category: 'Furniture',   unit_price: 19999, quantity: 5,  min_stock_level: 2 },
  { sku: 'FURN-302', name: 'Durian ALEX Engineered Wood Study Table',       category: 'Furniture',   unit_price: 8499,  quantity: 9,  min_stock_level: 2 },

  // Stationery
  { sku: 'STAT-401', name: 'Classmate Premium A4 Notebook (Pack of 6)',     category: 'Stationery',  unit_price: 349,   quantity: 2,  min_stock_level: 20 },
  { sku: 'STAT-402', name: 'Faber-Castell Grip 2011 Ball Pen (Box of 10)',  category: 'Stationery',  unit_price: 480,   quantity: 42, min_stock_level: 15 },
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
        insertTx.run(info.lastInsertRowid, 'IN', p.quantity, 0, p.quantity, 'Initial stock — PO-2026-NOV-01', '2026-11-01T09:00:00Z');
      }
    }

    // Simulate realistic stock movements

    // ELEC-101: Laptop — sold 3 units to a corporate client
    const laptop = db.prepare("SELECT id FROM products WHERE sku = 'ELEC-101'").get();
    insertTx.run(laptop.id, 'OUT', 3, 12, 9, 'Corporate sale — Infosys BPO order #C-4421', '2026-11-15T11:30:00Z');
    db.prepare("UPDATE products SET quantity = 9 WHERE id = ?").run(laptop.id);

    // AUDIO-202: JBL Speaker — restocked 10, then sold 8 (now only 3 left → LOW STOCK)
    const jbl = db.prepare("SELECT id FROM products WHERE sku = 'AUDIO-202'").get();
    insertTx.run(jbl.id, 'IN',  10, 0,  10, 'Supplier restock — Vijay Sales PO-2026-NOV-07', '2026-11-07T10:00:00Z');
    insertTx.run(jbl.id, 'OUT', 7,  10, 3,  'Retail sale batch — Flipkart order #FK-88201',  '2026-11-22T16:45:00Z');
    db.prepare("UPDATE products SET quantity = 3 WHERE id = ?").run(jbl.id);

    // STAT-401: Notebook — sold 50, now critically low (qty=2 < min=20)
    const notebook = db.prepare("SELECT id FROM products WHERE sku = 'STAT-401'").get();
    insertTx.run(notebook.id, 'OUT', 48, 50, 2, 'School bulk order — DPS Noida #SCH-2026-114', '2026-11-25T09:15:00Z');
    db.prepare("UPDATE products SET quantity = 2 WHERE id = ?").run(notebook.id);
  });

  doSeed();
  console.log('✅ Database seeded with real Indian market data.');
}

module.exports = { seed };
