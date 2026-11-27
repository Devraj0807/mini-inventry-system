"""
build_db.py — Creates inventory.db from schema.sql + seed.sql
Run: python build_db.py
"""
import sqlite3
import os

BASE = os.path.dirname(os.path.abspath(__file__))
DB   = os.path.join(BASE, "inventory.db")

# Remove stale DB so we start clean
if os.path.exists(DB):
    os.remove(DB)
    print("Removed existing inventory.db")

con = sqlite3.connect(DB)
con.execute("PRAGMA foreign_keys = ON")

with open(os.path.join(BASE, "schema.sql"), encoding="utf-8") as f:
    con.executescript(f.read())
print("schema.sql applied OK")

with open(os.path.join(BASE, "seed.sql"), encoding="utf-8") as f:
    con.executescript(f.read())
print("seed.sql applied OK")

cur = con.cursor()

print("\n=== TABLES & VIEWS ===")
for row in cur.execute("SELECT type, name FROM sqlite_master WHERE type IN ('table','view','trigger') ORDER BY type, name"):
    print(f"  [{row[0]:7}] {row[1]}")

print("\n=== SUMMARY KPIs ===")
cur.execute("SELECT * FROM v_summary_kpis")
cols = [d[0] for d in cur.description]
for row in cur.fetchall():
    for k, v in zip(cols, row):
        print(f"  {k}: {v}")

print("\n=== LOW STOCK ALERT ===")
cur.execute("SELECT sku, name, quantity, min_stock_level, units_needed FROM v_low_stock")
for row in cur.fetchall():
    print(f"  {row[0]:10} | {row[1]:40} | qty={row[2]} threshold={row[3]} need={row[4]}")

print("\n=== ALL PRODUCTS ===")
cur.execute("SELECT id, sku, name, category, unit_price, quantity FROM products ORDER BY id")
for row in cur.fetchall():
    print(f"  {row[0]} | {row[1]:10} | {row[2]:40} | {row[3]:12} | ${row[4]:7.2f} | qty={row[5]}")

con.close()
print("\nDone — inventory.db created successfully.")
