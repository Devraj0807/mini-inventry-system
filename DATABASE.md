# Mini Inventory System — Database Layer

> **Stack:** SQLite 3.x · **File:** `inventory.db`
> This README is for the whole team — backend devs connect to `inventory.db`; frontend devs consume the REST API endpoints listed below.

---

## Quick Start

```bash
# 1 — Generate a fresh database (schema + seed data)
python build_db.py

# Or with sqlite3 CLI if installed:
sqlite3 inventory.db < schema.sql
sqlite3 inventory.db < seed.sql
```

The file `inventory.db` will appear in the project root. **Never commit `inventory.db` to git** — it's auto-generated.

---

## File Map

| File | Purpose |
|------|---------|
| `schema.sql` | DDL — tables, indexes, trigger, views |
| `seed.sql` | Sample data (6 products, 12 transactions) |
| `build_db.py` | Python helper: recreates `inventory.db` from scratch & verifies it |
| `inventory.db` | ⚠️ Generated — add to `.gitignore` |

---

## Schema Overview

```
products  ──< stock_transactions
(catalogue)   (immutable audit ledger)
```

### `products`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `sku` | TEXT UNIQUE | e.g. `ELEC-101` |
| `name` | TEXT | Product display name |
| `category` | TEXT | Electronics / Furniture / Stationery … |
| `unit_price` | REAL | ≥ 0 |
| `quantity` | INTEGER | Live stock balance, ≥ 0 |
| `min_stock_level` | INTEGER | Low-stock alert threshold (default 5) |
| `created_at` | DATETIME | Set on insert |
| `updated_at` | DATETIME | Auto-updated by trigger on every UPDATE |

### `stock_transactions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `product_id` | INTEGER FK | → `products(id)` ON DELETE CASCADE |
| `type` | TEXT | `'IN'` or `'OUT'` only |
| `quantity` | INTEGER | Units moved, > 0 |
| `previous_quantity` | INTEGER | Balance **before** this move |
| `new_quantity` | INTEGER | Balance **after** this move |
| `reason` | TEXT | Optional note / PO reference |
| `timestamp` | DATETIME | Auto-set to `CURRENT_TIMESTAMP` |

> **Integrity rule (enforced by CHECK):**
> `IN`  → `new_quantity = previous_quantity + quantity`
> `OUT` → `new_quantity = previous_quantity - quantity`

---

## Pre-built Views (use these in your queries)

| View | Maps to API endpoint |
|------|---------------------|
| `v_low_stock` | `GET /api/reports/low-stock` |
| `v_summary_kpis` | `GET /api/reports/summary` |
| `v_product_history` | `GET /api/products/:id/history` |

### `v_summary_kpis` columns
`total_skus`, `total_units_in_stock`, `total_inventory_valuation`, `low_stock_count`, `out_of_stock_count`

### `v_low_stock` columns
`id`, `sku`, `name`, `category`, `quantity`, `min_stock_level`, `units_needed`

### `v_product_history` columns
`tx_id`, `product_id`, `sku`, `name`, `type`, `units_changed`, `previous_quantity`, `new_quantity`, `reason`, `timestamp`

---

## Backend Integration Notes

### Connecting (Node.js / better-sqlite3)
```js
const Database = require('better-sqlite3');
const db = new Database('./inventory.db');
db.pragma('foreign_keys = ON');   // must be set per connection
```

### Connecting (Python / sqlite3)
```python
import sqlite3
con = sqlite3.connect("inventory.db")
con.execute("PRAGMA foreign_keys = ON")
con.row_factory = sqlite3.Row  # named-column access
```

### Adding a Stock Movement (backend pattern)
```js
// 1. Fetch current quantity
const product = db.prepare('SELECT quantity FROM products WHERE id = ?').get(productId);

// 2. Calculate new balance
const prevQty = product.quantity;
const newQty  = type === 'IN' ? prevQty + qty : prevQty - qty;
if (newQty < 0) throw new Error('Insufficient stock');

// 3. Run both writes in a transaction
const move = db.transaction((p) => {
  db.prepare(`UPDATE products SET quantity = ? WHERE id = ?`).run(p.newQty, p.productId);
  db.prepare(`
    INSERT INTO stock_transactions
      (product_id, type, quantity, previous_quantity, new_quantity, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(p.productId, p.type, p.qty, p.prevQty, p.newQty, p.reason);
});
move({ productId, type, qty, prevQty, newQty, reason });
```

---

## Seed Data Summary

| SKU | Name | Qty | Status |
|-----|------|-----|--------|
| ELEC-101 | Logitech MX Master 3S Mouse | 14 | ✅ In stock |
| ELEC-102 | Dell UltraSharp 27" 4K Monitor | 3 | ⚠️ Low stock |
| ELEC-103 | Mechanical Keyboard RGB | 0 | 🔴 Out of stock |
| FURN-201 | Ergonomic Mesh Office Chair | 8 | ✅ In stock |
| STAT-301 | A5 Hardcover Dotted Notebook | 45 | ✅ In stock |
| STAT-302 | Gel Ink Rollerball Pen (Pack of 12) | 2 | ⚠️ Low stock |

**KPIs from seed data:** 6 SKUs · 72 units · \$5,346.78 valuation · 3 low-stock · 1 out-of-stock

---

## `.gitignore` Entry

Add this to your project root `.gitignore`:

```
inventory.db
inventory.db-shm
inventory.db-wal
```
