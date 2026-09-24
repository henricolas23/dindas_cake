const express = require('express');
const { database } = require('../database');

const router = express.Router();

router.get('/', (request, response) => {
  const movements = database.prepare(`
    SELECT movements.*, users.username
    FROM movements LEFT JOIN users ON users.id = movements.user_id
    ORDER BY movements.created_at DESC, movements.id DESC LIMIT 200
  `).all();
  response.json(movements);
});

router.post('/:productId', (request, response) => {
  const productId = Number(request.params.productId);
  const { type } = request.body || {};
  const quantity = Number(request.body?.quantity);
  if (!['entrada', 'saida'].includes(type) || !Number.isSafeInteger(quantity) || quantity < 1) {
    return response.status(400).json({ error: 'Informe entrada ou saída e uma quantidade inteira maior que zero.' });
  }

  const product = database.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return response.status(404).json({ error: 'Produto não encontrado.' });
  if (type === 'saida' && quantity > product.quantity) {
    return response.status(400).json({ error: 'A saída não pode ser maior que o estoque disponível.' });
  }

  const update = database.transaction(() => {
    const change = type === 'entrada' ? quantity : -quantity;
    database.prepare('UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(change, productId);
    database.prepare(`INSERT INTO movements(product_id, product_name, user_id, type, quantity)
      VALUES (?, ?, ?, ?, ?)`).run(productId, product.name, request.session.user.id, type, quantity);
  });
  update();
  return response.json(database.prepare('SELECT * FROM products WHERE id = ?').get(productId));
});

module.exports = router;
