const express = require('express');
const bcrypt = require('bcryptjs');
const { database } = require('../database');

const router = express.Router();

function startSession(request, response, user) {
  request.session.regenerate((error) => {
    if (error) return response.status(500).json({ error: 'Não foi possível iniciar a sessão.' });
    request.session.user = { id: user.id, username: user.username, authVersion: user.auth_version || 0 };
    request.session.save((saveError) => {
      if (saveError) return response.status(500).json({ error: 'Não foi possível iniciar a sessão.' });
      return response.json({ username: user.username });
    });
  });
}

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

router.get('/session', (request, response) => {
  response.json({ user: request.session.user || null });
});

router.post('/login', (request, response) => {
  const identifier = String(request.body?.identifier || request.body?.username || '').trim();
  const password = String(request.body?.password || '');
  const user = database.prepare(`SELECT * FROM users
    WHERE (username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE) AND active = 1`).get(identifier, identifier);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return response.status(401).json({ error: 'Usuário/e-mail ou senha incorretos.' });
  }
  return startSession(request, response, user);
});

router.post('/register', (request, response) => {
  const username = String(request.body?.username || '').trim();
  const email = String(request.body?.email || '').trim().toLowerCase();
  const password = String(request.body?.password || '');

  if (username.length < 3 || username.length > 32 || !/^[A-Za-z0-9._-]+$/.test(username)) {
    return response.status(400).json({ error: 'O usuário deve ter de 3 a 32 caracteres: letras sem acento, números, ponto, hífen ou sublinhado.' });
  }
  if (!isValidEmail(email)) return response.status(400).json({ error: 'Informe um e-mail válido.' });
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return response.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres e pode conter até 72 bytes.' });
  }
  if (database.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username)) {
    return response.status(409).json({ error: 'Esse nome de usuário já está em uso.' });
  }
  if (database.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email)) {
    return response.status(409).json({ error: 'Esse e-mail já está associado a uma conta.' });
  }

  try {
    const result = database.prepare(`INSERT INTO users(username, email, email_verified, password_hash)
      VALUES (?, ?, 1, ?)`).run(username, email, bcrypt.hashSync(password, 12));
    const user = database.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    return startSession(request, response, user);
  } catch (error) {
    if (/UNIQUE constraint failed/i.test(error.message)) {
      return response.status(409).json({ error: 'Esse usuário ou e-mail já está em uso.' });
    }
    return response.status(500).json({ error: 'Não foi possível criar a conta agora.' });
  }
});

router.post('/logout', (request, response) => {
  request.session.destroy((error) => {
    if (error) return response.status(500).json({ error: 'Não foi possível encerrar a sessão.' });
    response.clearCookie('connect.sid');
    return response.json({ ok: true });
  });
});

module.exports = router;
