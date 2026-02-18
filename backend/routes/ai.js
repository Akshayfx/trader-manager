/**
 * AI Routes
 */

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

// Get AI suggestion
router.post('/suggest', async (req, res) => {
  try {
    const { type, context } = req.body;
    const suggestion = await aiService.getSuggestion(type, context);
    res.json({ success: true, suggestion });
  } catch (error) {
    logger.error('Error getting AI suggestion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate smart position size
router.post('/position-size', async (req, res) => {
  try {
    const { accountBalance, riskPercent, stopLossPips, symbol, marketConditions } = req.body;
    const result = await aiService.calculateSmartPositionSize({
      accountBalance,
      riskPercent,
      stopLossPips,
      symbol,
      marketConditions
    });
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Error calculating position size:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get exit zones prediction
router.post('/exit-zones', async (req, res) => {
  try {
    const { position, marketData } = req.body;
    const zones = await aiService.predictExitZones(position, marketData);
    res.json({ success: true, zones });
  } catch (error) {
    logger.error('Error predicting exit zones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze trade query
router.post('/analyze', async (req, res) => {
  try {
    const { query, tradingContext } = req.body;
    const analysis = await aiService.analyzeQuery(query, tradingContext);
    res.json({ success: true, analysis });
  } catch (error) {
    logger.error('Error analyzing query:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: {
      enabled: true,
      model: 'balanced',
      features: {
        copilot: true,
        smartSizing: true,
        newsProtection: true,
        exitPrediction: true,
        patternRecognition: true
      }
    }
  });
});

module.exports = router;
