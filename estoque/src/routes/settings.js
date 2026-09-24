const express = require('express');
const { database } = require('../database');

const router = express.Router();

router.get('/', (request, response) => {
  const setting = database.prepare("SELECT value FROM settings WHERE key = 'low_stock_limit'").get();
  response.json({ lowStockLimit: Number(setting.value) });
});

router.put('/', (request, response) => {
  const limit = Number(request.body?.lowStockLimit);
  if (!Number.isSafeInteger(limit) || limit < 0) {
    return response.status(400).json({ error: 'O limite deve ser um inteiro igual ou maior que zero.' });
  }
  database.prepare("UPDATE settings SET value = ? WHERE key = 'low_stock_limit'").run(String(limit));
  return response.json({ lowStockLimit: limit });
});

module.exports = router;
