/**
 * ChartWise Database Module v2.0
 * SQLite for local data storage
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

const DB_PATH = path.join(__dirname, 'chartwise.db');

let db = null;

function initDatabase() {
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      logger.error('Database connection error:', err);
      return;
    }
    logger.info('Connected to SQLite database');
    createTables();
  });
}

function createTables() {
  // Users table - enhanced with subscription info
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      license_key TEXT UNIQUE,
      hardware_id TEXT,
      role TEXT DEFAULT 'user',
      subscription TEXT DEFAULT 'free',
      subscription_expiry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Trades table
  db.run(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket INTEGER,
      user_id INTEGER,
      symbol TEXT NOT NULL,
      order_type TEXT NOT NULL,
      lot_size REAL NOT NULL,
      entry_price REAL NOT NULL,
      stop_loss REAL,
      take_profit REAL,
      close_price REAL,
      profit_loss REAL,
      risk_percent REAL,
      magic_number INTEGER,
      status TEXT DEFAULT 'open',
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Trade history table
  db.run(`
    CREATE TABLE IF NOT EXISTS trade_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trade_id INTEGER,
      action TEXT NOT NULL,
      price REAL,
      lot_size REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trade_id) REFERENCES trades(id)
    )
  `);

  // Settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, category, key)
    )
  `);

  // AI suggestions table
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      suggestion TEXT NOT NULL,
      context TEXT,
      was_accepted BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // News events table
  db.run(`
    CREATE TABLE IF NOT EXISTS news_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency TEXT NOT NULL,
      event_name TEXT NOT NULL,
      impact TEXT NOT NULL,
      event_time DATETIME NOT NULL,
      actual_value TEXT,
      forecast_value TEXT,
      previous_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Performance metrics table
  db.run(`
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      date DATE NOT NULL,
      total_trades INTEGER DEFAULT 0,
      winning_trades INTEGER DEFAULT 0,
      losing_trades INTEGER DEFAULT 0,
      total_profit REAL DEFAULT 0,
      total_loss REAL DEFAULT 0,
      win_rate REAL DEFAULT 0,
      profit_factor REAL DEFAULT 0,
      average_rr REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, date)
    )
  `);

  // Subscription plans table
  db.run(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      features TEXT,
      limits TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // System settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // API usage tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      response_time INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Prop firm challenge tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS prop_firm_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      provider TEXT NOT NULL,
      account_size REAL,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME,
      status TEXT DEFAULT 'active',
      daily_loss_limit REAL,
      max_drawdown REAL,
      profit_target REAL,
      current_profit REAL DEFAULT 0,
      max_drawdown_reached REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // MT connection logs
  db.run(`
    CREATE TABLE IF NOT EXISTS mt_connection_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      version TEXT NOT NULL,
      action TEXT NOT NULL,
      account_info TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  logger.info('Database tables created successfully');
}

function getDb() {
  return db;
}

// Trade operations
function saveTrade(trade) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO trades (ticket, user_id, symbol, order_type, lot_size, entry_price, stop_loss, take_profit, risk_percent, magic_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(sql, [
      trade.ticket,
      trade.userId,
      trade.symbol,
      trade.orderType,
      trade.lotSize,
      trade.entryPrice,
      trade.stopLoss,
      trade.takeProfit,
      trade.riskPercent,
      trade.magicNumber
    ], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function updateTrade(ticket, updates) {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const sql = `UPDATE trades SET ${fields} WHERE ticket = ?`;
    db.run(sql, [...values, ticket], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

function getOpenTrades(userId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM trades WHERE user_id = ? AND status = "open"';
    db.all(sql, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getTradeHistory(userId, limit = 100) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM trades 
      WHERE user_id = ? AND status = 'closed' 
      ORDER BY closed_at DESC 
      LIMIT ?
    `;
    db.all(sql, [userId, limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Settings operations
function getSettings(userId, category) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT key, value FROM settings WHERE user_id = ? AND category = ?';
    db.all(sql, [userId, category], (err, rows) => {
      if (err) reject(err);
      else {
        const settings = {};
        rows.forEach(row => {
          try {
            settings[row.key] = JSON.parse(row.value);
          } catch {
            settings[row.key] = row.value;
          }
        });
        resolve(settings);
      }
    });
  });
}

function saveSetting(userId, category, key, value) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO settings (user_id, category, key, value)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, category, key) 
      DO UPDATE SET value = excluded.value
    `;
    db.run(sql, [userId, category, key, JSON.stringify(value)], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

// Performance operations
function getPerformanceMetrics(userId, startDate, endDate) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM performance_metrics 
      WHERE user_id = ? AND date BETWEEN ? AND ?
      ORDER BY date DESC
    `;
    db.all(sql, [userId, startDate, endDate], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function updatePerformanceMetrics(userId, date, metrics) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO performance_metrics 
        (user_id, date, total_trades, winning_trades, losing_trades, total_profit, total_loss, win_rate, profit_factor, average_rr)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date)
      DO UPDATE SET
        total_trades = excluded.total_trades,
        winning_trades = excluded.winning_trades,
        losing_trades = excluded.losing_trades,
        total_profit = excluded.total_profit,
        total_loss = excluded.total_loss,
        win_rate = excluded.win_rate,
        profit_factor = excluded.profit_factor,
        average_rr = excluded.average_rr
    `;
    db.run(sql, [
      userId, date,
      metrics.totalTrades,
      metrics.winningTrades,
      metrics.losingTrades,
      metrics.totalProfit,
      metrics.totalLoss,
      metrics.winRate,
      metrics.profitFactor,
      metrics.averageRR
    ], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

module.exports = {
  initDatabase,
  getDb,
  saveTrade,
  updateTrade,
  getOpenTrades,
  getTradeHistory,
  getSettings,
  saveSetting,
  getPerformanceMetrics,
  updatePerformanceMetrics
};
