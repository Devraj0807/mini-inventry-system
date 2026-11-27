// Shared data types and constants for the Mini Inventory System

/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {string} sku
 * @property {string} name
 * @property {string} category
 * @property {number} unitPrice
 * @property {number} quantity
 * @property {number} minStockLevel
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} StockTransaction
 * @property {number} id
 * @property {number} productId
 * @property {string} productName
 * @property {'IN'|'OUT'} type
 * @property {number} quantity
 * @property {number} previousQuantity
 * @property {number} newQuantity
 * @property {string} reason
 * @property {string} timestamp
 */

export const CATEGORIES = ['Electronics', 'Furniture', 'Stationery', 'Audio', 'Clothing', 'Tools', 'Other'];

/**
 * Returns 'IN_STOCK', 'LOW_STOCK', or 'OUT_OF_STOCK'
 * @param {Product} product
 * @returns {string}
 */
export function getStockStatus(product) {
  if (product.quantity === 0) return 'OUT_OF_STOCK';
  if (product.quantity <= product.minStockLevel) return 'LOW_STOCK';
  return 'IN_STOCK';
}
