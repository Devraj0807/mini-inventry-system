const { z } = require('zod');

const MovementSchema = z.object({
  productId: z.number().int().positive(),
  type:      z.enum(['IN', 'OUT']),
  quantity:  z.number().int().positive(),
  reason:    z.string().optional(),
});

function stockMovement(db) {
  return (req, res) => {
    const parsed = MovementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } });
    }

    const { productId, type, quantity, reason } = parsed.data;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Product #${productId} not found.` } });
    }

    if (type === 'OUT' && product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        error: {
          code:               'INSUFFICIENT_STOCK',
          message:            `Cannot deduct ${quantity} units. Only ${product.quantity} units available in stock.`,
          currentStock:       product.quantity,
          requestedDeduction: quantity,
        },
      });
    }

    const previousQuantity = product.quantity;
    const newQuantity      = type === 'IN' ? previousQuantity + quantity : previousQuantity - quantity;
    const minStock         = product.min_stock_level;

    const doMove = db.transaction(() => {
      db.prepare("UPDATE products SET quantity = ?, updated_at = datetime('now') WHERE id = ?")
        .run(newQuantity, productId);

      const info = db.prepare(
        'INSERT INTO stock_transactions (product_id, type, quantity, previous_quantity, new_quantity, reason) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(productId, type, quantity, previousQuantity, newQuantity, reason ?? null);

      return info.lastInsertRowid;
    });

    const transactionId = doMove();
    const isLowStock    = newQuantity > 0 && newQuantity <= minStock;
    const quantityKey   = type === 'IN' ? 'quantityAdded' : 'quantityDeducted';

    res.json({
      success: true,
      data: {
        transactionId,
        productId,
        productName: product.name,
        type,
        [quantityKey]:    quantity,
        previousQuantity,
        newQuantity,
        isLowStock,
        timestamp: new Date().toISOString(),
      },
      message: 'Stock adjusted successfully',
    });
  };
}

module.exports = { stockMovement };
