/**
 * Admin Dashboard Routes
 */

const express = require('express');
const { getDb } = require('../database/db');
const logger = require('../utils/logger');

const router = express.Router();

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const db = getDb();

    // User stats
    const userStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as totalUsers,
          SUM(CASE WHEN subscription = 'free' THEN 1 ELSE 0 END) as freeUsers,
          SUM(CASE WHEN subscription = 'pro' THEN 1 ELSE 0 END) as proUsers,
          SUM(CASE WHEN subscription = 'enterprise' THEN 1 ELSE 0 END) as enterpriseUsers,
          SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as newUsersToday
        FROM users
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Trade stats
    const tradeStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as totalTrades,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as openTrades,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closedTrades,
          SUM(profit_loss) as totalProfitLoss
        FROM trades
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Revenue stats (mock for now)
    const revenueStats = {
      monthlyRecurring: 0,
      totalRevenue: 0,
      activeSubscriptions: userStats.proUsers + userStats.enterpriseUsers
    };

    // Recent activity
    const recentActivity = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.username,
          'registered' as action,
          u.created_at as timestamp
        FROM users u
        ORDER BY u.created_at DESC
        LIMIT 10
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      stats: {
        users: userStats,
        trades: tradeStats,
        revenue: revenueStats
      },
      recentActivity
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get dashboard stats' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', subscription = '' } = req.query;
    const db = getDb();
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (subscription) {
      whereClause += ' AND subscription = ?';
      params.push(subscription);
    }

    const users = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id, username, email, role, subscription, 
          license_key, hardware_id, created_at, last_login,
          (SELECT COUNT(*) FROM trades WHERE user_id = users.id) as tradeCount
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), parseInt(offset)], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const total = await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) as count FROM users ${whereClause}`, params, (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
});

// Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const db = getDb();
    const user = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          id, username, email, role, subscription, 
          license_key, hardware_id, created_at, last_login
        FROM users
        WHERE id = ?
      `, [req.params.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's trades
    const trades = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM trades WHERE user_id = ? ORDER BY opened_at DESC LIMIT 50
      `, [req.params.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get user's settings
    const settings = await new Promise((resolve, reject) => {
      db.all(`
        SELECT category, key, value FROM settings WHERE user_id = ?
      `, [req.params.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      user: { ...user, trades, settings }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { role, subscription, subscriptionExpiry } = req.body;
    const db = getDb();

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE users 
        SET role = ?, subscription = ?, subscription_expiry = ?
        WHERE id = ?
      `, [role, subscription, subscriptionExpiry, req.params.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info(`User ${req.params.id} updated by admin ${req.user.id}`);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const db = getDb();

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info(`User ${req.params.id} deleted by admin ${req.user.id}`);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// Get API usage stats
router.get('/api-usage', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const db = getDb();

    // Mock API usage data (would be tracked in real implementation)
    const usageData = Array.from({ length: parseInt(days) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        requests: Math.floor(Math.random() * 1000) + 500,
        uniqueUsers: Math.floor(Math.random() * 100) + 50
      };
    }).reverse();

    res.json({
      success: true,
      usage: usageData,
      total: {
        requests: usageData.reduce((sum, d) => sum + d.requests, 0),
        uniqueUsers: usageData.reduce((sum, d) => sum + d.uniqueUsers, 0)
      }
    });
  } catch (error) {
    logger.error('API usage error:', error);
    res.status(500).json({ success: false, message: 'Failed to get API usage' });
  }
});

// Get subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const db = getDb();

    const subscriptions = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          subscription,
          COUNT(*) as count,
          SUM(CASE WHEN subscription_expiry > datetime('now') THEN 1 ELSE 0 END) as active
        FROM users
        GROUP BY subscription
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    logger.error('Subscriptions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get subscriptions' });
  }
});

// Create subscription plan
router.post('/subscriptions/plans', async (req, res) => {
  try {
    const { name, price, features, limits } = req.body;
    const db = getDb();

    const result = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO subscription_plans (name, price, features, limits, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [name, price, JSON.stringify(features), JSON.stringify(limits)], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    res.json({ success: true, planId: result });
  } catch (error) {
    logger.error('Create plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to create plan' });
  }
});

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    const db = getDb();

    const settings = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM system_settings', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({ success: true, settings });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get settings' });
  }
});

// Update system setting
router.put('/settings/:key', async (req, res) => {
  try {
    const { value } = req.body;
    const db = getDb();

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `, [req.params.key, value], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true, message: 'Setting updated' });
  } catch (error) {
    logger.error('Update setting error:', error);
    res.status(500).json({ success: false, message: 'Failed to update setting' });
  }
});

// Get active connections
router.get('/connections', async (req, res) => {
  try {
    const { server } = require('../server');
    
    res.json({
      success: true,
      connections: {
        total: server.clients?.size || 0,
        mt4: server.mt4Connections?.size || 0,
        mt5: server.mt5Connections?.size || 0,
        desktop: server.desktopConnections?.size || 0,
        mobile: server.mobileConnections?.size || 0
      }
    });
  } catch (error) {
    logger.error('Connections error:', error);
    res.status(500).json({ success: false, message: 'Failed to get connections' });
  }
});

module.exports = router;
