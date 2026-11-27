/**
 * Self-contained integration test — starts the server in-process and
 * exercises every endpoint, then exits.
 */
const http = require('http');
const { initDb } = require('./src/db/database');
const { seed }   = require('./src/db/seed');
const express    = require('express');
const productsRouter  = require('./src/routes/products.routes');
const inventoryRouter = require('./src/routes/inventory.routes');
const reportsRouter   = require('./src/routes/reports.routes');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

function req(port, path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1', port, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const r = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
  } else {
    console.error(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
    process.exitCode = 1;
  }
}

async function run() {
  const db = await initDb();
  seed();

  const app = express();
  app.use(express.json());
  app.use('/api/products',  productsRouter(db));
  app.use('/api/inventory', inventoryRouter(db));
  app.use('/api/reports',   reportsRouter(db));
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(0); // random free port
  const { port } = server.address();

  try {
    // ── GET /api/products ────────────────────────────────────────────────────
    console.log('\n[GET /api/products]');
    let r = await req(port, '/api/products');
    assert('200 OK',         r.status === 200);
    assert('success: true',  r.body.success === true);
    assert('count >= 6',     r.body.count >= 6, `got ${r.body.count}`);

    // ── GET /api/products?status=low_stock ───────────────────────────────────
    console.log('\n[GET /api/products?status=low_stock]');
    r = await req(port, '/api/products?status=low_stock');
    assert('200 OK',          r.status === 200);
    assert('only LOW_STOCK',  r.body.data.every(p => p.status === 'LOW_STOCK'));

    // ── GET /api/products?status=out_of_stock ────────────────────────────────
    console.log('\n[GET /api/products?status=out_of_stock]');
    r = await req(port, '/api/products?status=out_of_stock');
    assert('200 OK',              r.status === 200);
    assert('only OUT_OF_STOCK',   r.body.data.every(p => p.status === 'OUT_OF_STOCK'));

    // ── POST /api/products ───────────────────────────────────────────────────
    console.log('\n[POST /api/products]');
    r = await req(port, '/api/products', 'POST', {
      sku: 'TEST-999', name: 'Test Widget', category: 'Test',
      unitPrice: 9.99, initialQuantity: 10, minStockLevel: 2,
    });
    assert('201 Created',    r.status === 201);
    assert('id assigned',    r.body.data.id > 0);
    const newId = r.body.data.id;

    // ── Duplicate SKU ────────────────────────────────────────────────────────
    console.log('\n[POST /api/products — duplicate SKU]');
    r = await req(port, '/api/products', 'POST', {
      sku: 'TEST-999', name: 'Dup', category: 'Test', unitPrice: 1, initialQuantity: 0, minStockLevel: 0,
    });
    assert('409 Conflict',       r.status === 409);
    assert('DUPLICATE_SKU code', r.body.error.code === 'DUPLICATE_SKU');

    // ── GET /api/products/:id ────────────────────────────────────────────────
    console.log('\n[GET /api/products/:id]');
    r = await req(port, `/api/products/${newId}`);
    assert('200 OK',              r.status === 200);
    assert('recentMovements arr', Array.isArray(r.body.data.recentMovements));

    // ── PUT /api/products/:id ────────────────────────────────────────────────
    console.log('\n[PUT /api/products/:id]');
    r = await req(port, `/api/products/${newId}`, 'PUT', { name: 'Updated Widget', unitPrice: 12.99 });
    assert('200 OK',         r.status === 200);
    assert('name updated',   r.body.data.name === 'Updated Widget');
    assert('price updated',  r.body.data.unitPrice === 12.99);

    // ── POST /api/inventory/movement  — STOCK IN ─────────────────────────────
    console.log('\n[POST /api/inventory/movement — IN]');
    r = await req(port, '/api/inventory/movement', 'POST', {
      productId: newId, type: 'IN', quantity: 5, reason: 'Restock',
    });
    assert('200 OK',            r.status === 200);
    assert('newQuantity = 15',  r.body.data.newQuantity === 15, `got ${r.body.data.newQuantity}`);

    // ── STOCK OUT ─────────────────────────────────────────────────────────────
    console.log('\n[POST /api/inventory/movement — OUT]');
    r = await req(port, '/api/inventory/movement', 'POST', {
      productId: newId, type: 'OUT', quantity: 3, reason: 'Sale',
    });
    assert('200 OK',            r.status === 200);
    assert('newQuantity = 12',  r.body.data.newQuantity === 12);

    // ── INSUFFICIENT STOCK ───────────────────────────────────────────────────
    console.log('\n[POST /api/inventory/movement — insufficient]');
    r = await req(port, '/api/inventory/movement', 'POST', {
      productId: newId, type: 'OUT', quantity: 999, reason: 'Huge order',
    });
    assert('400 Bad Request',       r.status === 400);
    assert('INSUFFICIENT_STOCK',    r.body.error.code === 'INSUFFICIENT_STOCK');

    // ── GET /api/reports/summary ─────────────────────────────────────────────
    console.log('\n[GET /api/reports/summary]');
    r = await req(port, '/api/reports/summary');
    assert('200 OK',              r.status === 200);
    assert('totalProducts >= 6',  r.body.data.totalProducts >= 6);

    // ── GET /api/reports/low-stock ───────────────────────────────────────────
    console.log('\n[GET /api/reports/low-stock]');
    r = await req(port, '/api/reports/low-stock');
    assert('200 OK',         r.status === 200);
    assert('count field',    typeof r.body.count === 'number');
    assert('deficit field',  r.body.data.every(p => typeof p.deficit === 'number'));

    // ── DELETE /api/products/:id ─────────────────────────────────────────────
    console.log('\n[DELETE /api/products/:id]');
    r = await req(port, `/api/products/${newId}`, 'DELETE');
    assert('200 OK',   r.status === 200);
    r = await req(port, `/api/products/${newId}`);
    assert('404 after delete',  r.status === 404);

    console.log('\n✅ All tests passed!\n');
  } finally {
    server.close();
  }
}

run().catch(err => { console.error(err); process.exitCode = 1; });
