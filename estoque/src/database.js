const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');

const dataDirectory = path.join(__dirname, '..', 'data');
const databaseFile = path.join(dataDirectory, 'estoque.sqlite');
let database;
let sqlDatabase;
let transactionDepth = 0;

function persist() {
  if (transactionDepth === 0) fs.writeFileSync(databaseFile, Buffer.from(sqlDatabase.export()));
}

function normalizeParameters(parameters) {
  if (Array.isArray(parameters)) return parameters;
  if (parameters === null || parameters === undefined) return [];
  if (typeof parameters !== 'object') return [parameters];
  return Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key.startsWith('@') || key.startsWith('$') || key.startsWith(':') ? key : `@${key}`, value]));
}

function createAdapter(sqlDatabase) {
  return {
    pragma(statement) { sqlDatabase.run(`PRAGMA ${statement}`); },
    exec(statement) { sqlDatabase.exec(statement); persist(); },
    prepare(query) {
      return {
        get(...parameters) {
          const statement = sqlDatabase.prepare(query);
          try {
            statement.bind(normalizeParameters(parameters.length === 1 ? parameters[0] : parameters));
            return statement.step() ? statement.getAsObject() : undefined;
          } finally { statement.free(); }
        },
        all(...parameters) {
          const statement = sqlDatabase.prepare(query);
          const rows = [];
          try {
            statement.bind(normalizeParameters(parameters.length === 1 ? parameters[0] : parameters));
            while (statement.step()) rows.push(statement.getAsObject());
            return rows;
          } finally { statement.free(); }
        },
        run(...parameters) {
          sqlDatabase.run(query, normalizeParameters(parameters.length === 1 ? parameters[0] : parameters));
          const result = {
            changes: sqlDatabase.getRowsModified(),
            lastInsertRowid: sqlDatabase.exec('SELECT last_insert_rowid() AS id')[0]?.values[0][0] || 0,
          };
          persist();
          return result;
        },
      };
    },
    transaction(callback) {
      return (...args) => {
        sqlDatabase.run('BEGIN TRANSACTION'); transactionDepth += 1;
        try {
          const result = callback(...args);
          sqlDatabase.run('COMMIT');
          transactionDepth -= 1; persist();
          return result;
        } catch (error) {
          sqlDatabase.run('ROLLBACK'); transactionDepth -= 1;
          throw error;
        }
      };
    },
  };
}

async function initializeDatabase() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  const initSqlJs = require('sql.js');
  const wasmDirectory = path.dirname(require.resolve('sql.js'));
  const SQL = await initSqlJs({ locateFile: (file) => path.join(wasmDirectory, file) });
  const stored = fs.existsSync(databaseFile) ? fs.readFileSync(databaseFile) : undefined;
  sqlDatabase = stored ? new SQL.Database(stored) : new SQL.Database();
  database = createAdapter(sqlDatabase);
  database.pragma('foreign_keys = ON');
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      description TEXT DEFAULT '', category TEXT DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0), active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY, product_id INTEGER, product_name TEXT NOT NULL, user_id INTEGER,
      type TEXT NOT NULL CHECK (type IN ('entrada','saida','ajuste')),
      quantity INTEGER NOT NULL CHECK (quantity > 0), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT OR IGNORE INTO settings(key, value) VALUES ('low_stock_limit', '5');
  `);
}

function ensureInitialAdmin() {
  const username = process.env.ADMIN_USER?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) throw new Error('Configure ADMIN_USER e ADMIN_PASSWORD no arquivo .env.');
  const exists = database.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!exists) {
    database.prepare('INSERT INTO users(username, password_hash) VALUES (?, ?)')
      .run(username, bcrypt.hashSync(password, 12));
  }
}

module.exports = {
  dataDirectory,
  ensureInitialAdmin,
  initializeDatabase,
  get database() { return database; },
};
