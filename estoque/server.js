require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const { dataDirectory, ensureInitialAdmin, initializeDatabase } = require('./src/database');
const { requireAuthentication } = require('./src/middleware/require-auth');

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDirectory = path.join(__dirname, 'public');

function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Em produção, defina SESSION_SECRET no ambiente.');
  }

  fs.mkdirSync(dataDirectory, { recursive: true });
  const secretFile = path.join(dataDirectory, 'session-secret.txt');
  try { return fs.readFileSync(secretFile, 'utf8').trim(); }
  catch { /* Gera uma chave local na primeira execução. */ }

  const secret = crypto.randomBytes(48).toString('hex');
  try { fs.writeFileSync(secretFile, secret, { flag: 'wx', mode: 0o600 }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    return fs.readFileSync(secretFile, 'utf8').trim();
  }
  console.warn('SESSION_SECRET foi gerado e salvo localmente em data/.');
  return secret;
}

const sessionSecret = getSessionSecret();

class FileSessionStore extends session.Store {
  constructor(filePath) {
    super();
    this.filePath = filePath;
    try { this.sessions = JSON.parse(fs.readFileSync(filePath, 'utf8')); }
    catch { this.sessions = {}; }
  }

  save(callback) {
    try { fs.writeFileSync(this.filePath, JSON.stringify(this.sessions)); callback?.(null); }
    catch (error) { callback?.(error); }
  }

  get(id, callback) {
    const value = this.sessions[id];
    if (value?.cookie?.expires && new Date(value.cookie.expires) <= new Date()) {
      delete this.sessions[id]; this.save();
      return callback(null, null);
    }
    return callback(null, value || null);
  }

  set(id, value, callback) { this.sessions[id] = value; this.save(callback); }
  destroy(id, callback) { delete this.sessions[id]; this.save(callback); }
  touch(id, value, callback) { this.set(id, value, callback); }
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
app.use(session({
  store: new FileSessionStore(path.join(dataDirectory, 'sessions.json')),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

async function start() {
  await initializeDatabase();
  ensureInitialAdmin();

  app.use('/api', require('./src/routes/auth'));
  app.use('/api/products', requireAuthentication, require('./src/routes/products'));
  app.use('/api/movements', requireAuthentication, require('./src/routes/movements'));
  app.use('/api/settings', requireAuthentication, require('./src/routes/settings'));
  app.use('/api/users', requireAuthentication, require('./src/routes/users'));

  const requirePageAuthentication = (request, response, next) => {
    if (!request.session.user) return response.redirect('/entrar');
    const user = require('./src/database').database.prepare('SELECT active, auth_version FROM users WHERE id = ?').get(request.session.user.id);
    if (!user || !user.active || (request.session.user.authVersion || 0) !== user.auth_version) {
      request.session.destroy(() => response.redirect('/entrar'));
      return;
    }
    return next();
  };

  app.get('/entrar', (request, response) => response.sendFile(path.join(publicDirectory, 'login.html')));
  app.get('/login', (request, response) => response.redirect('/entrar'));
  app.get('/dashboard', requirePageAuthentication, (request, response) => response.sendFile(path.join(publicDirectory, 'pages', 'dashboard.html')));
  app.get('/estoque', requirePageAuthentication, (request, response) => response.sendFile(path.join(publicDirectory, 'pages', 'stock.html')));
  app.get('/movimentacoes', requirePageAuthentication, (request, response) => response.sendFile(path.join(publicDirectory, 'pages', 'history.html')));
  app.get('/configuracoes', requirePageAuthentication, (request, response) => response.sendFile(path.join(publicDirectory, 'pages', 'settings.html')));
  app.get('/pages/*', requirePageAuthentication, (request, response, next) => next());
  app.get('/criar-conta', (request, response) => response.sendFile(path.join(publicDirectory, 'signup.html')));
  app.use(express.static(publicDirectory));
  app.get('*', (request, response) => response.sendFile(path.join(publicDirectory, 'index.html')));
  app.listen(port, () => console.log(`Dindas Cake Estoque disponível em http://localhost:${port}`));
}

start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
