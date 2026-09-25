const express = require('express');
const bcrypt = require('bcryptjs');
const { database } = require('../database');

const router = express.Router();

function listUsers() {
  return database.prepare('SELECT id, username, email, active, created_at FROM users ORDER BY username COLLATE NOCASE').all();
}

router.get('/', (request, response) => response.json(listUsers()));

router.put('/:id', (request, response) => {
  const id = Number(request.params.id);
  const current = database.prepare('SELECT id, email, email_verified FROM users WHERE id = ?').get(id);
  if (!current) return response.status(404).json({ error: 'Perfil não encontrado.' });

  const username = String(request.body?.username || '').trim();
  const email = request.body?.email === undefined
    ? current.email
    : (String(request.body.email || '').trim().toLowerCase() || null);
  const active = request.body?.active === true;
  const password = String(request.body?.password || '');

  if (username.length < 3 || username.length > 32 || !/^[A-Za-z0-9._-]+$/.test(username)) {
    return response.status(400).json({ error: 'Use de 3 a 32 caracteres: letras sem acento, números, ponto, hífen ou sublinhado.' });
  }
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) {
    return response.status(400).json({ error: 'Informe um e-mail válido para recuperação de acesso.' });
  }
  if (password && (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72)) {
    return response.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres e pode conter até 72 bytes.' });
  }
  if (id === request.session.user.id && !active) {
    return response.status(400).json({ error: 'Você não pode suspender o perfil que está usando agora.' });
  }
  if (!active) {
    const activeCount = database.prepare('SELECT COUNT(*) AS count FROM users WHERE active = 1').get().count;
    if (activeCount <= 1) return response.status(400).json({ error: 'Mantenha pelo menos um perfil ativo no sistema.' });
  }

  try {
    if (password) {
      database.prepare(`UPDATE users SET username = ?, email = ?, email_verified = ?, active = ?,
        password_hash = ?, auth_version = auth_version + 1 WHERE id = ?`)
        .run(username, email, email ? 1 : 0, active ? 1 : 0, bcrypt.hashSync(password, 12), id);
    } else {
      const emailVerified = email ? (email === current.email ? current.email_verified : 1) : 0;
      database.prepare('UPDATE users SET username = ?, email = ?, email_verified = ?, active = ? WHERE id = ?')
        .run(username, email, emailVerified, active ? 1 : 0, id);
    }
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint failed/i.test(error.message)) {
      return response.status(409).json({ error: 'Esse nome de usuário já está em uso.' });
    }
    return response.status(500).json({ error: 'Não foi possível atualizar o perfil.' });
  }

  if (id === request.session.user.id) request.session.user.username = username;
  return response.json(listUsers());
});

module.exports = router;
