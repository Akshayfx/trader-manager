/**
 * MetaTrader Connection Routes
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');
const logger = require('../utils/logger');

// Get MT connection status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get connection from active WebSocket clients
    const { clients } = require('../server');
    
    let mt4Connected = false;
    let mt5Connected = false;
    let mt4Info = null;
    let mt5Info = null;

    clients.forEach((client) => {
      if (client.userId === userId || client.userId === String(userId)) {
        if (client.type === 'mt4' && client.mtConnected) {
          mt4Connected = true;
          mt4Info = client.accountInfo;
        }
        if (client.type === 'mt5' && client.mtConnected) {
          mt5Connected = true;
          mt5Info = client.accountInfo;
        }
      }
    });

    // Get user's preferred settings
    const db = getDb();
    const settings = await new Promise((resolve, reject) => {
      db.get(
        'SELECT value FROM settings WHERE user_id = ? AND category = ? AND key = ?',
        [userId, 'mtConnection', 'config'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? JSON.parse(row.value) : null);
        }
      );
    });

    res.json({
      success: true,
      status: {
        mt4: {
          connected: mt4Connected,
          info: mt4Info
        },
        mt5: {
          connected: mt5Connected,
          info: mt5Info
        },
        anyConnected: mt4Connected || mt5Connected
      },
      settings: settings || {
        autoConnect: true,
        preferredVersion: 'auto',
        reconnectInterval: 5000
      }
    });
  } catch (error) {
    logger.error('Get MT status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update MT connection settings
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
        [userId, 'mtConnection', 'config', JSON.stringify(settings)],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logger.info(`MT connection settings updated for user ${userId}`);
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    logger.error('Update MT settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Connect to MT
router.post('/connect', async (req, res) => {
  try {
    const { version, accountInfo } = req.body;
    const userId = req.user.id;

    // This would be handled by the WebSocket connection
    // The EA would connect and send this info

    res.json({
      success: true,
      message: `Connection request sent to ${version}`,
      instructions: {
        mt4: 'Attach ChartWise_Manager EA to any chart in MT4',
        mt5: 'Attach ChartWise_Manager EA to any chart in MT5'
      }
    });
  } catch (error) {
    logger.error('MT connect error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Disconnect from MT
router.post('/disconnect', async (req, res) => {
  try {
    const { version } = req.body;
    
    // Broadcast disconnect to all clients
    const { broadcastToAll } = require('../server');
    broadcastToAll({
      type: 'mt_disconnect',
      data: { version }
    });

    res.json({ success: true, message: `Disconnect signal sent to ${version}` });
  } catch (error) {
    logger.error('MT disconnect error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
