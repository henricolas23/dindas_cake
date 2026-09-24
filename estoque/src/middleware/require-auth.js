function requireAuthentication(request, response, next) {
  if (!request.session.user) {
    return response.status(401).json({ error: 'Faça login para continuar.' });
  }
  return next();
}

module.exports = { requireAuthentication };
