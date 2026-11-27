const express = require('express');
const { initDb } = require('./db/database');
const { seed }   = require('./db/seed');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const productsRouter  = require('./routes/products.routes');
const inventoryRouter = require('./routes/inventory.routes');
const reportsRouter   = require('./routes/reports.routes');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  // 1. Init DB (creates / loads the SQLite file)
  const db = await initDb();

  // 2. Seed sample data on first run
  seed();

  // 3. Build Express app
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()}  ${req.method.padEnd(6)} ${req.path}`);
    next();
  });

  // ── Routes ────────────────────────────────────────────────────────────────
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Mini Inventory System API',
      version: '1.0.0',
      endpoints: {
        products:  '/api/products',
        inventory: '/api/inventory/movement',
        reports:   '/api/reports/summary  |  /api/reports/low-stock',
      },
    });
  });

  app.use('/api/products',  productsRouter(db));
  app.use('/api/inventory', inventoryRouter(db));
  app.use('/api/reports',   reportsRouter(db));

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`\n🚀  Mini Inventory API  →  http://localhost:${PORT}`);
    console.log(`    Press Ctrl+C to stop.\n`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
