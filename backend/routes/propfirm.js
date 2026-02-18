/**
 * Prop Firm Routes
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');
const logger = require('../utils/logger');

// Prop firm providers
const PROP_FIRM_PROVIDERS = {
  ftmo: {
    name: 'FTMO',
    dailyLossLimit: 1000,
    maxDrawdown: 5000,
    profitTarget: 10000,
    timeLimit: 30,
    minTradingDays: 4
  },
  myforexfunds: {
    name: 'My Forex Funds',
    dailyLossLimit: 1500,
    maxDrawdown: 7500,
    profitTarget: 8000,
    timeLimit: 60,
    minTradingDays: 5
  },
  the5ers: {
    name: 'The5ers',
    dailyLossLimit: 500,
    maxDrawdown: 2500,
    profitTarget: 5000,
    timeLimit: 90,
    minTradingDays: 3
  },
  custom: {
    name: 'Custom Rules',
    dailyLossLimit: 1000,
    maxDrawdown: 5000,
    profitTarget: 10000,
    timeLimit: 30,
    minTradingDays: 0
  }
};

// Get prop firm settings
router.get('/settings', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const settings = await new Promise((resolve, reject) => {
      db.get(
        'SELECT value FROM settings WHERE user_id = ? AND category = ? AND key = ?',
        [userId, 'propFirm', 'config'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? JSON.parse(row.value) : null);
        }
      );
    });

    res.json({
      success: true,
      settings: settings || getDefaultPropFirmSettings(),
      providers: PROP_FIRM_PROVIDERS
    });
  } catch (error) {
    logger.error('Get prop firm settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update prop firm settings
router.put('/settings', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const settings = req.body;

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO settings (user_id, category, key, value) 
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, category, key) 
         DO UPDATE SET value = excluded.value`,
        [userId, 'propFirm', 'config', JSON.stringify(settings)],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logger.info(`Prop firm settings updated for user ${userId}`);
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    logger.error('Update prop firm settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get prop firm status
router.get('/status', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    // Get today's trades
    const todayTrades = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM trades 
         WHERE user_id = ? 
         AND DATE(opened_at) = DATE('now')
         ORDER BY opened_at DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Calculate daily stats
    const dailyPL = todayTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
    const dailyTrades = todayTrades.length;

    // Get prop firm settings
    const settings = await new Promise((resolve, reject) => {
      db.get(
        'SELECT value FROM settings WHERE user_id = ? AND category = ? AND key = ?',
        [userId, 'propFirm', 'config'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? JSON.parse(row.value) : getDefaultPropFirmSettings());
        }
      );
    });

    const provider = PROP_FIRM_PROVIDERS[settings.provider] || PROP_FIRM_PROVIDERS.custom;

    // Calculate status
    const status = {
      enabled: settings.enabled,
      provider: settings.provider,
      dailyPL,
      dailyTrades,
      dailyLossLimit: settings.dailyLossLimit || provider.dailyLossLimit,
      maxDrawdown: settings.maxDrawdown || provider.maxDrawdown,
      profitTarget: settings.profitTarget || provider.profitTarget,
      timeLimit: settings.timeLimit || provider.timeLimit,
      isCompliant: true,
      warnings: []
    };

    // Check compliance
    if (dailyPL < -status.dailyLossLimit) {
      status.isCompliant = false;
      status.warnings.push(`Daily loss limit exceeded: $${Math.abs(dailyPL).toFixed(2)}`);
    }

    if (dailyPL < -status.dailyLossLimit * 0.8) {
      status.warnings.push(`Approaching daily loss limit: ${((Math.abs(dailyPL) / status.dailyLossLimit) * 100).toFixed(0)}%`);
    }

    res.json({ success: true, status });
  } catch (error) {
    logger.error('Get prop firm status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available providers
router.get('/providers', (req, res) => {
  res.json({
    success: true,
    providers: PROP_FIRM_PROVIDERS
  });
});

// Get default prop firm settings
function getDefaultPropFirmSettings() {
  return {
    enabled: false,
    provider: 'custom',
    dailyLossLimit: 1000,
    maxDrawdown: 5000,
    profitTarget: 10000,
    timeLimit: 30,
    minTradingDays: 0,
    rules: []
  };
}

module.exports = router;
