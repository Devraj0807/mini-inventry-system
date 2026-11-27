// Local state store with localStorage persistence

import { getStockStatus } from './types';

const PRODUCTS_KEY = 'inv_products';
const TRANSACTIONS_KEY = 'inv_transactions';

// ── Seed data (used only on first load) ─────────────────────────────────────
const SEED_PRODUCTS = [
  { id: 1, sku: 'ELEC-101', name: 'Logitech MX Master 3S Mouse', category: 'Electronics', unitPrice: 99.99, quantity: 14, minStockLevel: 5, createdAt: '2026-11-20T10:00:00Z', updatedAt: '2026-11-20T10:00:00Z' },
  { id: 2, sku: 'ELEC-102', name: 'Dell UltraSharp 27" 4K Monitor', category: 'Electronics', unitPrice: 449.50, quantity: 3, minStockLevel: 5, createdAt: '2026-11-20T10:00:00Z', updatedAt: '2026-11-20T10:00:00Z' },
  { id: 3, sku: 'ELEC-103', name: 'Mechanical Keyboard RGB', category: 'Electronics', unitPrice: 119.00, quantity: 0, minStockLevel: 4, createdAt: '2026-11-20T10:00:00Z', updatedAt: '2026-11-20T10:00:00Z' },
  { id: 4, sku: 'FURN-201', name: 'Ergonomic Mesh Office Chair', category: 'Furniture', unitPrice: 249.99, quantity: 8, minStockLevel: 3, createdAt: '2026-11-21T11:00:00Z', updatedAt: '2026-11-21T11:00:00Z' },
  { id: 5, sku: 'STAT-301', name: 'A5 Hardcover Dotted Notebook', category: 'Stationery', unitPrice: 12.50, quantity: 45, minStockLevel: 10, createdAt: '2026-11-22T09:00:00Z', updatedAt: '2026-11-22T09:00:00Z' },
  { id: 6, sku: 'STAT-302', name: 'Gel Ink Rollerball Pen (Pack of 12)', category: 'Stationery', unitPrice: 18.00, quantity: 2, minStockLevel: 8, createdAt: '2026-11-23T14:00:00Z', updatedAt: '2026-11-23T14:00:00Z' },
];

const SEED_TRANSACTIONS = [
  { id: 1, productId: 1, productName: 'Logitech MX Master 3S Mouse', type: 'IN', quantity: 20, previousQuantity: 0, newQuantity: 20, reason: 'Initial supplier delivery PO-2026-01', timestamp: '2026-11-20T10:00:00Z' },
  { id: 2, productId: 1, productName: 'Logitech MX Master 3S Mouse', type: 'OUT', quantity: 6, previousQuantity: 20, newQuantity: 14, reason: 'Customer order #10041', timestamp: '2026-11-26T14:20:00Z' },
  { id: 3, productId: 2, productName: 'Dell UltraSharp 27" 4K Monitor', type: 'IN', quantity: 5, previousQuantity: 0, newQuantity: 5, reason: 'Initial stock delivery', timestamp: '2026-11-20T10:00:00Z' },
  { id: 4, productId: 2, productName: 'Dell UltraSharp 27" 4K Monitor', type: 'OUT', quantity: 2, previousQuantity: 5, newQuantity: 3, reason: 'Floor display & customer pickup', timestamp: '2026-11-27T08:30:00Z' },
  { id: 5, productId: 3, productName: 'Mechanical Keyboard RGB', type: 'IN', quantity: 10, previousQuantity: 0, newQuantity: 10, reason: 'Initial delivery', timestamp: '2026-11-20T10:00:00Z' },
  { id: 6, productId: 3, productName: 'Mechanical Keyboard RGB', type: 'OUT', quantity: 10, previousQuantity: 10, newQuantity: 0, reason: 'Bulk clearance order #9822', timestamp: '2026-11-26T16:45:00Z' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
}

// ── Products ─────────────────────────────────────────────────────────────────
export function getProducts() {
  return load(PRODUCTS_KEY, SEED_PRODUCTS);
}

export function saveProducts(products) {
  save(PRODUCTS_KEY, products);
}

export function addProduct(data) {
  const products = getProducts();
  const newProduct = {
    id: nextId(products),
    ...data,
    quantity: data.initialQuantity ?? 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  delete newProduct.initialQuantity;
  const updated = [...products, newProduct];
  saveProducts(updated);

  if ((data.initialQuantity ?? 0) > 0) {
    addTransaction({
      productId: newProduct.id,
      productName: newProduct.name,
      type: 'IN',
      quantity: newProduct.quantity,
      previousQuantity: 0,
      newQuantity: newProduct.quantity,
      reason: 'Initial stock entry',
    });
  }

  return newProduct;
}

export function updateProduct(id, data) {
  const products = getProducts();
  const updated = products.map(p =>
    p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
  );
  saveProducts(updated);
  return updated.find(p => p.id === id);
}

export function deleteProduct(id) {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
  // also clean up transactions
  const txns = getTransactions().filter(t => t.productId !== id);
  save(TRANSACTIONS_KEY, txns);
}

// ── Transactions ─────────────────────────────────────────────────────────────
export function getTransactions() {
  return load(TRANSACTIONS_KEY, SEED_TRANSACTIONS);
}

export function addTransaction(data) {
  const txns = getTransactions();
  const newTxn = { id: nextId(txns), ...data, timestamp: new Date().toISOString() };
  save(TRANSACTIONS_KEY, [newTxn, ...txns]);
  return newTxn;
}

// ── Stock Movement (atomic) ───────────────────────────────────────────────────
export function adjustStock({ productId, type, quantity, reason }) {
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  const previousQuantity = product.quantity;
  let newQuantity;

  if (type === 'IN') {
    newQuantity = previousQuantity + quantity;
  } else {
    if (previousQuantity < quantity) {
      throw new Error(`Cannot deduct ${quantity} units. Only ${previousQuantity} available.`);
    }
    newQuantity = previousQuantity - quantity;
  }

  updateProduct(productId, { quantity: newQuantity });

  return addTransaction({
    productId,
    productName: product.name,
    type,
    quantity,
    previousQuantity,
    newQuantity,
    reason: reason || '',
  });
}

// ── Report Summary ────────────────────────────────────────────────────────────
export function getReportSummary() {
  const products = getProducts();
  const totalProducts = products.length;
  const totalUnitsInStock = products.reduce((s, p) => s + p.quantity, 0);
  const totalInventoryValuation = products.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
  const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel);
  const outOfStockItems = products.filter(p => p.quantity === 0);

  const today = new Date().toDateString();
  const transactions = getTransactions();
  const recentMovementsCountToday = transactions.filter(t =>
    new Date(t.timestamp).toDateString() === today
  ).length;

  return {
    totalProducts,
    totalUnitsInStock,
    totalInventoryValuation,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    recentMovementsCountToday,
    lowStockItems: products
      .filter(p => p.quantity <= p.minStockLevel)
      .map(p => ({ ...p, status: getStockStatus(p), deficit: p.minStockLevel - p.quantity }))
      .sort((a, b) => a.quantity - b.quantity),
  };
}
