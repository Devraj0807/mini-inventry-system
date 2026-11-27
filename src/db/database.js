const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

const DB_PATH = path.join(__dirname, '../../inventory.db');

let _sqlDb = null;
let db     = null;
let _inTx  = false; // track whether we're inside a transaction

// ── Persist to disk ───────────────────────────────────────────────────────────
function persist() {
  if (!_sqlDb || _inTx) return; // never export while a transaction is open
  const data = _sqlDb.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ── Statement factory ─────────────────────────────────────────────────────────
function makeStmt(sqlDb, sql) {
  return {
    run(...params) {
      sqlDb.run(sql, params.length ? params : undefined);
      if (!_inTx) persist();

      const rows = sqlDb.exec('SELECT last_insert_rowid() as id');
      const lastId = rows.length ? rows[0].values[0][0] : null;
      return { lastInsertRowid: lastId };
    },

    get(...params) {
      const stmt = sqlDb.prepare(sql);
      stmt.bind(params.length ? params : []);
      let row;
      if (stmt.step()) row = stmt.getAsObject();
      stmt.free();
      return row;
    },

    all(...params) {
      const result = [];
      const stmt = sqlDb.prepare(sql);
      stmt.bind(params.length ? params : []);
      while (stmt.step()) result.push(stmt.getAsObject());
      stmt.free();
      return result;
    },
  };
}

// ── DB wrapper ────────────────────────────────────────────────────────────────
function wrapDb(sqlDb) {
  return {
    prepare(sql) {
      return makeStmt(sqlDb, sql);
    },

    exec(sql) {
      sqlDb.run(sql);
      if (!_inTx) persist();
    },

    transaction(fn) {
      return () => {
        _inTx = true;
        sqlDb.run('BEGIN');
        try {
          const result = fn();
          sqlDb.run('COMMIT');
          _inTx = false;
          persist();
          return result;
        } catch (e) {
          sqlDb.run('ROLLBACK');
          _inTx = false;
          throw e;
        }
      };
    },
  };
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    _sqlDb = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    _sqlDb = new SQL.Database();
  }

  _sqlDb.run(`
    CREATE TABLE IF NOT EXISTS products (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      sku             TEXT    NOT NULL UNIQUE,
      name            TEXT    NOT NULL,
      category        TEXT    NOT NULL,
      unit_price      REAL    NOT NULL,
      quantity        INTEGER NOT NULL DEFAULT 0,
      min_stock_level INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  _sqlDb.run(`
    CREATE TABLE IF NOT EXISTS stock_transactions (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id        INTEGER NOT NULL,
      type              TEXT    NOT NULL,
      quantity          INTEGER NOT NULL,
      previous_quantity INTEGER NOT NULL,
      new_quantity      INTEGER NOT NULL,
      reason            TEXT,
      timestamp         TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  persist();
  db = wrapDb(_sqlDb);
  return db;
}

function getDb() {
  if (!db) throw new Error('DB not initialised yet. Call initDb() first.');
  return db;
}

module.exports = { initDb, getDb };
