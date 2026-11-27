const express = require('express');
const { stockMovement } = require('../controllers/inventory.controller');

function inventoryRouter(db) {
  const router = express.Router();
  router.post('/movement', stockMovement(db));
  return router;
}

module.exports = inventoryRouter;
