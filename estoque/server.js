require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const { dataDirectory, ensureInitialAdmin, initializeDatabase } = require('./src/database');
const { requireAuthentication } = require('./src/middleware/require-auth');

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDirectory = path.join(__dirname, 'public');

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
  secret: process.env.SESSION_SECRET || 'missing-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

async function start() {
  if (!process.env.SESSION_SECRET) throw new Error('Configure SESSION_SECRET no arquivo .env.');
  await initializeDatabase();
  ensureInitialAdmin();

  app.use('/api', require('./src/routes/auth'));
  app.use('/api/products', requireAuthentication, require('./src/routes/products'));
  app.use('/api/movements', requireAuthentication, require('./src/routes/movements'));
  app.use('/api/settings', requireAuthentication, require('./src/routes/settings'));

  app.get('/dashboard', (request, response) => response.sendFile(path.join(publicDirectory, 'pages', 'dashboard.html')));
  app.get('/estoque', (request, response) => response.sendFile(path.join(publicDirectory, 'pages', 'stock.html')));
  app.get('/movimentacoes', (request, response) => response.sendFile(path.join(publicDirectory, 'pages', 'history.html')));
  app.get('/configuracoes', (request, response) => response.sendFile(path.join(publicDirectory, 'pages', 'settings.html')));
  app.use(express.static(publicDirectory));
  app.get('*', (request, response) => response.sendFile(path.join(publicDirectory, 'index.html')));
  app.listen(port, () => console.log(`Dindas Cake Estoque disponível em http://localhost:${port}`));
}

start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
