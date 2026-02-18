/**
 * Authentication Routes
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { getDb } = require('../database/db');
const logger = require('../utils/logger');

const router = express.Router();

// Register new user
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password } = req.body;
    const db = getDb();

    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate license key
    const licenseKey = generateLicenseKey();

    // Create user
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, email, password_hash, license_key, role, subscription, created_at) 
         VALUES (?, ?, ?, ?, 'user', 'free', datetime('now'))`,
        [username, email, passwordHash, licenseKey],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Create default settings
    await createDefaultSettings(result);

    const token = generateToken({ id: result, username, email, role: 'user', subscription: 'free' });

    logger.info(`User registered: ${username}`);

    res.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: result,
        username,
        email,
        licenseKey,
        subscription: 'free'
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDb();

    // Find user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET last_login = datetime("now") WHERE id = ?', [user.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const token = generateToken(user);

    logger.info(`User logged in: ${username}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        licenseKey: user.license_key
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Validate license
router.post('/license', authenticateToken, async (req, res) => {
  try {
    const { licenseKey, hardwareId } = req.body;
    const db = getDb();

    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE license_key = ?', [licenseKey], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.json({ success: false, valid: false, message: 'Invalid license key' });
    }

    // Check if license is already bound to different hardware
    if (user.hardware_id && user.hardware_id !== hardwareId) {
      return res.json({ success: false, valid: false, message: 'License already in use on another device' });
    }

    // Bind license to hardware if not already bound
    if (!user.hardware_id) {
      await new Promise((resolve, reject) => {
        db.run('UPDATE users SET hardware_id = ? WHERE id = ?', [hardwareId, user.id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    res.json({
      success: true,
      valid: true,
      message: 'License valid',
      subscription: user.subscription,
      expiryDate: user.subscription_expiry
    });
  } catch (error) {
    logger.error('License validation error:', error);
    res.status(500).json({ success: false, message: 'License validation failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, username, email, role, subscription, license_key, created_at, last_login FROM users WHERE id = ?', 
        [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({ success: true, user });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const token = generateToken(user);
    res.json({ success: true, token });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
});

// Helper functions
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'CW-';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) key += '-';
  }
  return key;
}

async function createDefaultSettings(userId) {
  const db = getDb();
  const defaultSettings = {
    ai: JSON.stringify({
      enabled: true,
      model: 'balanced',
      realTimeSuggestions: true,
      autoExecute: false,
      aggressiveness: 3
    }),
    risk: JSON.stringify({
      defaultRiskPercent: 2.0,
      maxOpenPositions: 5,
      dailyLossLimit: 500,
      maxCorrelationExposure: 0.7
    }),
    autoBreakeven: JSON.stringify({
      enabled: false,
      triggerPips: 20,
      plusPips: 5,
      protectPartial: true
    }),
    partialTP: JSON.stringify({
      enabled: true,
      levels: [
        { distance: 30, percent: 50 },
        { distance: 50, percent: 30 },
        { distance: 80, percent: 20 }
      ]
    }),
    news: JSON.stringify({
      enabled: true,
      autoProtect: true,
      minutesBefore: 15,
      closePercent: 50
    }),
    trailing: JSON.stringify({
      enabled: false,
      mode: 'fixed',
      distance: 25,
      adaptive: false
    }),
    propFirm: JSON.stringify({
      enabled: false,
      provider: 'custom',
      dailyLossLimit: 1000,
      maxDrawdown: 5000,
      profitTarget: 10000,
      timeLimit: 30,
      rules: []
    }),
    mtConnection: JSON.stringify({
      autoConnect: true,
      preferredVersion: 'auto',
      reconnectInterval: 5000
    })
  };

  for (const [category, value] of Object.entries(defaultSettings)) {
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO settings (user_id, category, key, value) VALUES (?, ?, ?, ?)',
        [userId, category, 'config', value],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

module.exports = router;
