const express = require('express');
const bcrypt = require('bcryptjs');
const { database } = require('../database');

const router = express.Router();

router.get('/session', (request, response) => {
  response.json({ user: request.session.user || null });
});

router.post('/login', (request, response) => {
  const username = String(request.body?.username || '').trim();
  const password = String(request.body?.password || '');
  const user = database.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return response.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  request.session.regenerate((error) => {
    if (error) return response.status(500).json({ error: 'Não foi possível iniciar a sessão.' });
    request.session.user = { id: user.id, username: user.username };
    request.session.save((saveError) => {
      if (saveError) return response.status(500).json({ error: 'Não foi possível iniciar a sessão.' });
      return response.json({ username: user.username });
    });
  });
});

router.post('/logout', (request, response) => {
  request.session.destroy((error) => {
    if (error) return response.status(500).json({ error: 'Não foi possível encerrar a sessão.' });
    response.clearCookie('connect.sid');
    return response.json({ ok: true });
  });
});

module.exports = router;
