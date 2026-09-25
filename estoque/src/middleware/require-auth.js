function requireAuthentication(request, response, next) {
  if (!request.session.user) {
    return response.status(401).json({ error: 'Faça login para continuar.' });
  }

  const { database } = require('../database');
  const user = database.prepare('SELECT active, auth_version FROM users WHERE id = ?').get(request.session.user.id);
  if (!user || !user.active || (request.session.user.authVersion || 0) !== user.auth_version) {
    request.session.destroy(() => {});
    return response.status(401).json({ error: 'Esta conta não tem mais acesso. Entre com um perfil ativo.' });
  }
  return next();
}

module.exports = { requireAuthentication };
