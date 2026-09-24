const express = require('express');
const { database } = require('../database');

const router = express.Router();

function validateProduct(body) {
  const name = String(body.name || '').trim();
  const quantity = Number(body.quantity);
  if (!name) throw Object.assign(new Error('Informe o nome do produto.'), { status: 400 });
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw Object.assign(new Error('A quantidade deve ser um número inteiro igual ou maior que zero.'), { status: 400 });
  }
  return {
    name, quantity,
    description: String(body.description || '').trim(),
    category: String(body.category || '').trim(),
    active: body.active === false || body.active === 0 ? 0 : 1,
  };
}

function sendError(response, error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return response.status(409).json({ error: 'Já existe um produto com esse nome.' });
  }
  return response.status(error.status || 400).json({ error: error.message || 'Não foi possível concluir a operação.' });
}

router.get('/', (request, response) => {
  response.json(database.prepare('SELECT * FROM products ORDER BY name COLLATE NOCASE').all());
});

router.post('/', (request, response) => {
  try {
    const product = validateProduct(request.body);
    const result = database.prepare(`
      INSERT INTO products(name, quantity, description, category, active)
      VALUES (@name, @quantity, @description, @category, @active)
    `).run(product);
    if (product.quantity > 0) {
      database.prepare(`INSERT INTO movements(product_id, product_name, user_id, type, quantity)
        VALUES (?, ?, ?, 'entrada', ?)`).run(result.lastInsertRowid, product.name, request.session.user.id, product.quantity);
    }
    response.status(201).json(database.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) { sendError(response, error); }
});

router.put('/:id', (request, response) => {
  try {
    const id = Number(request.params.id);
    const current = database.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!current) return response.status(404).json({ error: 'Produto não encontrado.' });
    const product = validateProduct(request.body);
    const difference = product.quantity - current.quantity;
    const update = database.transaction(() => {
      database.prepare(`UPDATE products SET name = @name, quantity = @quantity,
        description = @description, category = @category, active = @active,
        updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run({ ...product, id });
      if (difference !== 0) {
        const movementType = difference > 0 ? 'entrada' : 'saida';
        database.prepare(`INSERT INTO movements(product_id, product_name, user_id, type, quantity)
          VALUES (?, ?, ?, ?, ?)`).run(id, product.name, request.session.user.id, movementType, Math.abs(difference));
      }
    });
    update();
    return response.json(database.prepare('SELECT * FROM products WHERE id = ?').get(id));
  } catch (error) { return sendError(response, error); }
});

router.delete('/:id', (request, response) => {
  const product = database.prepare('SELECT * FROM products WHERE id = ?').get(Number(request.params.id));
  if (!product) return response.status(404).json({ error: 'Produto não encontrado.' });
  const remove = database.transaction(() => {
    if (product.quantity > 0) {
      database.prepare(`INSERT INTO movements(product_id, product_name, user_id, type, quantity)
        VALUES (?, ?, ?, 'saida', ?)`).run(product.id, product.name, request.session.user.id, product.quantity);
    }
    database.prepare('DELETE FROM products WHERE id = ?').run(product.id);
  });
  remove();
  return response.json({ ok: true });
});

module.exports = router;
