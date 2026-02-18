/**
 * News Routes
 */

const express = require('express');
const router = express.Router();
const newsService = require('../services/newsService');
const logger = require('../utils/logger');

// Get upcoming news with optional filtering
router.get('/upcoming', async (req, res) => {
  try {
    const { hours = 4, currencies, impact } = req.query;
    
    // Parse currencies array
    const currencyList = currencies ? currencies.split(',') : null;
    
    // Parse impact levels array
    const impactList = impact ? impact.split(',') : null;
    
    const news = await newsService.getUpcomingNews(parseInt(hours), currencyList, impactList);
    res.json({ success: true, news });
  } catch (error) {
    logger.error('Error fetching upcoming news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active news alert (nearest high impact) with filtering
router.get('/alert', async (req, res) => {
  try {
    const { currencies, impact } = req.query;
    
    // Parse currencies array
    const currencyList = currencies ? currencies.split(',') : null;
    
    // Parse impact levels array
    const impactList = impact ? impact.split(',') : ['high'];
    
    const alert = await newsService.getActiveNewsAlert(currencyList, impactList);
    res.json({ success: true, alert });
  } catch (error) {
    logger.error('Error fetching news alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get high impact events for currency
router.get('/high-impact/:currency', async (req, res) => {
  try {
    const { currency } = req.params;
    const events = await newsService.getHighImpactEvents(currency);
    res.json({ success: true, events });
  } catch (error) {
    logger.error('Error fetching high impact events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check news protection for symbol
router.get('/protection/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const protection = await newsService.checkNewsProtection(symbol);
    res.json({ success: true, protection });
  } catch (error) {
    logger.error('Error checking news protection:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
