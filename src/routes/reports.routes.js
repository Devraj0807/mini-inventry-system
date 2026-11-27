const express = require('express');
const { getSummary, getLowStock } = require('../controllers/reports.controller');

function reportsRouter(db) {
  const router = express.Router();
  router.get('/summary',   getSummary(db));
  router.get('/low-stock', getLowStock(db));
  return router;
}

module.exports = reportsRouter;
