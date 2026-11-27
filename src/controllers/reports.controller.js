function getSummary(db) {
  return (req, res) => {
    const totalProducts           = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
    const totalUnitsInStock       = db.prepare('SELECT COALESCE(SUM(quantity), 0) as s FROM products').get().s;
    const totalInventoryValuation = db.prepare('SELECT COALESCE(SUM(unit_price * quantity), 0) as v FROM products').get().v;
    const lowStockCount           = db.prepare('SELECT COUNT(*) as c FROM products WHERE quantity > 0 AND quantity <= min_stock_level').get().c;
    const outOfStockCount         = db.prepare('SELECT COUNT(*) as c FROM products WHERE quantity = 0').get().c;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const recentMovementsCountToday = db
      .prepare('SELECT COUNT(*) as c FROM stock_transactions WHERE timestamp >= ?')
      .get(todayStart.toISOString()).c;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalUnitsInStock,
        totalInventoryValuation: Math.round(totalInventoryValuation * 100) / 100,
        lowStockCount,
        outOfStockCount,
        recentMovementsCountToday,
      },
    });
  };
}

function getLowStock(db) {
  return (req, res) => {
    const rows = db.prepare(
      'SELECT *, (min_stock_level - quantity) AS deficit FROM products WHERE quantity <= min_stock_level ORDER BY deficit DESC'
    ).all();

    const data = rows.map(r => ({
      id:            r.id,
      sku:           r.sku,
      name:          r.name,
      category:      r.category,
      unitPrice:     r.unit_price,
      quantity:      r.quantity,
      minStockLevel: r.min_stock_level,
      deficit:       r.deficit,
      status:        r.quantity <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
    }));

    res.json({ success: true, count: data.length, data });
  };
}

module.exports = { getSummary, getLowStock };
