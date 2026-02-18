/**
 * Settings Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const logger = require('../utils/logger');

// Get all settings for a category
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.query.userId || 1;
    const settings = await db.getSettings(userId, category);
    res.json({ success: true, settings });
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save setting
router.post('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.body.userId || 1;
    const { key, value } = req.body;
    
    await db.saveSetting(userId, category, key, value);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving setting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get default settings
router.get('/defaults/all', (req, res) => {
  const defaults = {
    ai: {
      enabled: true,
      model: 'balanced',
      realTimeSuggestions: true,
      autoExecute: false,
      aggressiveness: 3
    },
    risk: {
      defaultRiskPercent: 2.0,
      maxOpenPositions: 5,
      dailyLossLimit: 500,
      maxCorrelationExposure: 0.7
    },
    autoBreakeven: {
      enabled: false,
      triggerPips: 20,
      plusPips: 5,
      protectPartial: true
    },
    partialTP: {
      enabled: true,
      levels: [
        { distance: 30, percent: 50 },
        { distance: 50, percent: 30 },
        { distance: 80, percent: 20 }
      ]
    },
    news: {
      enabled: true,
      autoProtect: true,
      minutesBefore: 15,
      closePercent: 50
    },
    trailing: {
      enabled: false,
      mode: 'fixed',
      distance: 25,
      adaptive: false
    }
  };
  
  res.json({ success: true, defaults });
});

module.exports = router;
