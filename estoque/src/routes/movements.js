const express = require('express');
const { database } = require('../database');

const router = express.Router();

router.get('/', (request, response) => {
  const { from, to } = request.query;
  const hasRange = from !== undefined || to !== undefined;
  const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  const isValidDateTime = (value) => {
    if (!dateTimePattern.test(value || '')) return false;
    const parsed = new Date(`${value.replace(' ', 'T')}Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 19).replace('T', ' ') === value;
  };
  if (hasRange && (!isValidDateTime(from) || !isValidDateTime(to) || from >= to)) {
    return response.status(400).json({ error: 'Informe um período válido para filtrar as movimentações.' });
  }

  const query = `
    SELECT movements.*, users.username
    FROM movements LEFT JOIN users ON users.id = movements.user_id
    ${hasRange ? 'WHERE movements.created_at >= ? AND movements.created_at < ?' : ''}
    ORDER BY movements.created_at DESC, movements.id DESC
  `;
  const movements = hasRange ? database.prepare(query).all(from, to) : database.prepare(query).all();
  return response.json(movements);
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
