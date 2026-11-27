const express = require('express');
const { getProducts, createProduct, getProductById, updateProduct, deleteProduct } = require('../controllers/products.controller');

function productsRouter(db) {
  const router = express.Router();

  router.get('/',     getProducts(db));
  router.post('/',    createProduct(db));
  router.get('/:id',  getProductById(db));
  router.put('/:id',  updateProduct(db));
  router.delete('/:id', deleteProduct(db));

  return router;
}

module.exports = productsRouter;
