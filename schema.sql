-- ============================================================
--  Mini Inventory System — Database Schema (SQLite)
--  File   : schema.sql
--  Engine : SQLite 3.x
--  Run    : sqlite3 inventory.db < schema.sql
-- ============================================================

-- Enable FK enforcement (must be on for every connection)
PRAGMA foreign_keys = ON;
-- Use WAL mode for better concurrent read performance
PRAGMA journal_mode = WAL;

-- ============================================================
-- TABLE 1: products
--   Central catalogue; every SKU lives here.
--   quantity is kept in sync by the backend on every stock move.
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id              INTEGER  PRIMARY KEY AUTOINCREMENT,
    sku             TEXT     NOT NULL UNIQUE,                     -- e.g. ELEC-101
    name            TEXT     NOT NULL,                           -- e.g. Wireless Mouse
    category        TEXT     NOT NULL,                           -- e.g. Electronics
    unit_price      REAL     NOT NULL CHECK(unit_price >= 0),    -- selling / cost price
    quantity        INTEGER  NOT NULL DEFAULT 0
                             CHECK(quantity >= 0),               -- live stock balance
    min_stock_level INTEGER  NOT NULL DEFAULT 5
                             CHECK(min_stock_level >= 0),        -- low-stock alert threshold
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: stock_transactions  (immutable audit ledger)
--   Every IN / OUT movement is appended here.
--   Backend must derive new_quantity = previous_quantity ± quantity
--   before inserting; the CHECK constraint enforces correctness.
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_transactions (
    id                INTEGER  PRIMARY KEY AUTOINCREMENT,
    product_id        INTEGER  NOT NULL
                               REFERENCES products(id) ON DELETE CASCADE,
    type              TEXT     NOT NULL CHECK(type IN ('IN', 'OUT')),
    quantity          INTEGER  NOT NULL CHECK(quantity > 0),
    previous_quantity INTEGER  NOT NULL CHECK(previous_quantity >= 0),
    new_quantity      INTEGER  NOT NULL CHECK(new_quantity >= 0),
    reason            TEXT,                                       -- e.g. "Restock PO-001"
    timestamp         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Arithmetic integrity: balances must be self-consistent
    CHECK (
        (type = 'IN'  AND new_quantity = previous_quantity + quantity) OR
        (type = 'OUT' AND new_quantity = previous_quantity - quantity)
    )
);

-- ============================================================
-- INDEXES — optimise the queries the backend & frontend use most
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_sku        ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_quantity   ON products(quantity);         -- low-stock scan
CREATE INDEX IF NOT EXISTS idx_tx_product_id       ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_tx_timestamp        ON stock_transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tx_type             ON stock_transactions(type);   -- IN / OUT filter

-- ============================================================
-- TRIGGER — keep updated_at current automatically
--   Backend does NOT need to set this field manually.
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_products_updated_at
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    UPDATE products
    SET    updated_at = CURRENT_TIMESTAMP
    WHERE  id = OLD.id;
END;

-- ============================================================
-- VIEWS — pre-built queries for backend / reporting endpoints
-- ============================================================

-- v_low_stock  →  GET /api/reports/low-stock
CREATE VIEW IF NOT EXISTS v_low_stock AS
SELECT
    id,
    sku,
    name,
    category,
    quantity,
    min_stock_level,
    (min_stock_level - quantity) AS units_needed
FROM products
WHERE quantity <= min_stock_level
ORDER BY quantity ASC;

-- v_summary_kpis  →  GET /api/reports/summary
CREATE VIEW IF NOT EXISTS v_summary_kpis AS
SELECT
    COUNT(*)                                              AS total_skus,
    COALESCE(SUM(quantity), 0)                            AS total_units_in_stock,
    COALESCE(SUM(quantity * unit_price), 0.0)             AS total_inventory_valuation,
    COUNT(CASE WHEN quantity <= min_stock_level THEN 1 END) AS low_stock_count,
    COUNT(CASE WHEN quantity = 0 THEN 1 END)              AS out_of_stock_count
FROM products;

-- v_product_history  →  GET /api/products/:id/history
CREATE VIEW IF NOT EXISTS v_product_history AS
SELECT
    t.id            AS tx_id,
    t.product_id,
    p.sku,
    p.name,
    t.type,
    t.quantity      AS units_changed,
    t.previous_quantity,
    t.new_quantity,
    t.reason,
    t.timestamp
FROM stock_transactions t
JOIN products p ON p.id = t.product_id
ORDER BY t.timestamp DESC;