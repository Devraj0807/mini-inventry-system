-- ============================================================
--  Mini Inventory System — Seed / Demo Data
--  File   : seed.sql
--  Usage  : sqlite3 inventory.db < seed.sql
--           (run AFTER schema.sql)
--  Purpose: Realistic sample rows that exercise every UI state:
--           in-stock, low-stock, and out-of-stock.
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- PRODUCTS  (6 rows across 3 categories)
-- ============================================================
INSERT INTO products (sku, name, category, unit_price, quantity, min_stock_level) VALUES
-- Electronics — mixed stock levels
('ELEC-101', 'Logitech MX Master 3S Mouse',       'Electronics', 99.99,  14, 5),
('ELEC-102', 'Dell UltraSharp 27" 4K Monitor',    'Electronics', 449.50,  3, 5),   -- low stock
('ELEC-103', 'Mechanical Keyboard RGB',            'Electronics', 119.00,  0, 4),   -- out of stock
-- Furniture
('FURN-201', 'Ergonomic Mesh Office Chair',        'Furniture',   249.99,  8, 3),
-- Stationery — one healthy, one low
('STAT-301', 'A5 Hardcover Dotted Notebook',       'Stationery',  12.50,  45, 10),
('STAT-302', 'Gel Ink Rollerball Pen (Pack of 12)','Stationery',  18.00,   2, 8);   -- low stock

-- ============================================================
-- STOCK TRANSACTIONS  (audit trail for all 6 products)
-- ============================================================
INSERT INTO stock_transactions (product_id, type, quantity, previous_quantity, new_quantity, reason) VALUES
-- ELEC-101 : MX Master Mouse
(1, 'IN',  20,  0, 20, 'Initial supplier delivery — PO-2026-01'),
(1, 'OUT',  6, 20, 14, 'Customer order #10041'),
-- ELEC-102 : 4K Monitor
(2, 'IN',   5,  0,  5, 'Initial stock delivery'),
(2, 'OUT',  2,  5,  3, 'Floor display & customer pickup'),
-- ELEC-103 : Mechanical Keyboard
(3, 'IN',  10,  0, 10, 'Initial delivery'),
(3, 'OUT', 10, 10,  0, 'Bulk clearance order #9822'),
-- FURN-201 : Office Chair
(4, 'IN',  10,  0, 10, 'Warehouse transfer from main store'),
(4, 'OUT',  2, 10,  8, 'Retail showroom orders'),
-- STAT-301 : Notebook
(5, 'IN',  50,  0, 50, 'Supplier shipment batch 4'),
(5, 'OUT',  5, 50, 45, 'Online store retail sale'),
-- STAT-302 : Pen Pack
(6, 'IN',  10,  0, 10, 'Supplier stock shipment'),
(6, 'OUT',  8, 10,  2, 'Back-to-school promo bulk order');
