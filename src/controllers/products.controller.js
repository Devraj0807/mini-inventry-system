const { z } = require('zod');

// ── helpers ───────────────────────────────────────────────────────────────────

function computeStatus(quantity, minStockLevel) {
  if (quantity <= 0)              return 'OUT_OF_STOCK';
  if (quantity <= minStockLevel)  return 'LOW_STOCK';
  return 'IN_STOCK';
}

function mapProduct(row) {
  return {
    id:            row.id,
    sku:           row.sku,
    name:          row.name,
    category:      row.category,
    unitPrice:     row.unit_price,
    quantity:      row.quantity,
    minStockLevel: row.min_stock_level,
    status:        computeStatus(row.quantity, row.min_stock_level),
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

function mapTx(row) {
  return {
    id:               row.id,
    type:             row.type,
    quantity:         row.quantity,
    previousQuantity: row.previous_quantity,
    newQuantity:      row.new_quantity,
    reason:           row.reason,
    timestamp:        row.timestamp,
  };
}

// ── schemas ───────────────────────────────────────────────────────────────────

const CreateProductSchema = z.object({
  sku:             z.string().min(1),
  name:            z.string().min(1),
  category:        z.string().min(1),
  unitPrice:       z.number().positive(),
  initialQuantity: z.number().int().min(0).default(0),
  minStockLevel:   z.number().int().min(0).default(0),
});

const UpdateProductSchema = z.object({
  name:          z.string().min(1).optional(),
  category:      z.string().min(1).optional(),
  unitPrice:     z.number().positive().optional(),
  minStockLevel: z.number().int().min(0).optional(),
});

// ── controllers ───────────────────────────────────────────────────────────────

function getProducts(db) {
  return (req, res) => {
    const { search, category, status } = req.query;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(sku) LIKE ?)';
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }
    if (category) {
      sql += ' AND LOWER(category) = ?';
      params.push(category.toLowerCase());
    }

    const rows = db.prepare(sql).all(...params);
    let products = rows.map(mapProduct);

    if (status && status !== 'all') {
      const statusMap = { in_stock: 'IN_STOCK', low_stock: 'LOW_STOCK', out_of_stock: 'OUT_OF_STOCK' };
      const target = statusMap[status];
      if (target) products = products.filter(p => p.status === target);
    }

    res.json({ success: true, count: products.length, data: products });
  };
}

function createProduct(db) {
  return (req, res) => {
    const parsed = CreateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });
    }

    const { sku, name, category, unitPrice, initialQuantity, minStockLevel } = parsed.data;

    const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE_SKU', message: `A product with SKU '${sku}' already exists.` } });
    }

    const doCreate = db.transaction(() => {
      const info = db.prepare(
        'INSERT INTO products (sku, name, category, unit_price, quantity, min_stock_level) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(sku, name, category, unitPrice, initialQuantity, minStockLevel);

      if (initialQuantity > 0) {
        db.prepare(
          'INSERT INTO stock_transactions (product_id, type, quantity, previous_quantity, new_quantity, reason) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(info.lastInsertRowid, 'IN', initialQuantity, 0, initialQuantity, 'Initial stock');
      }

      return db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
    });

    const row = doCreate();
    res.status(201).json({ success: true, data: mapProduct(row), message: 'Product created successfully' });
  };
}

function getProductById(db) {
  return (req, res) => {
    const { id } = req.params;
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id));
    if (!row) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Product #${id} not found.` } });
    }

    const movements = db.prepare(
      'SELECT * FROM stock_transactions WHERE product_id = ? ORDER BY id DESC LIMIT 10'
    ).all(Number(id));

    res.json({ success: true, data: { ...mapProduct(row), recentMovements: movements.map(mapTx) } });
  };
}

function updateProduct(db) {
  return (req, res) => {
    const { id } = req.params;
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id));
    if (!row) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Product #${id} not found.` } });
    }

    const parsed = UpdateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });
    }

    const d = parsed.data;
    db.prepare(`
      UPDATE products SET
        name            = ?,
        category        = ?,
        unit_price      = ?,
        min_stock_level = ?,
        updated_at      = datetime('now')
      WHERE id = ?
    `).run(
      d.name          ?? row.name,
      d.category      ?? row.category,
      d.unitPrice     ?? row.unit_price,
      d.minStockLevel ?? row.min_stock_level,
      Number(id)
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id));
    res.json({ success: true, data: mapProduct(updated), message: 'Product updated successfully' });
  };
}

function deleteProduct(db) {
  return (req, res) => {
    const { id } = req.params;
    const row = db.prepare('SELECT id FROM products WHERE id = ?').get(Number(id));
    if (!row) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Product #${id} not found.` } });
    }

    // Delete transactions first (no CASCADE in sql.js WASM by default)
    db.prepare('DELETE FROM stock_transactions WHERE product_id = ?').run(Number(id));
    db.prepare('DELETE FROM products WHERE id = ?').run(Number(id));
    res.json({ success: true, message: `Product #${id} and associated transaction history deleted successfully` });
  };
}

module.exports = { getProducts, createProduct, getProductById, updateProduct, deleteProduct };
