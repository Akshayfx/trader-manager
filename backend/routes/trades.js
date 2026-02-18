/**
 * Trade Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const logger = require('../utils/logger');

// Get all open trades
router.get('/open', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const trades = await db.getOpenTrades(userId);
    res.json({ success: true, trades });
  } catch (error) {
    logger.error('Error fetching open trades:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trade history
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const limit = parseInt(req.query.limit) || 100;
    const trades = await db.getTradeHistory(userId, limit);
    res.json({ success: true, trades });
  } catch (error) {
    logger.error('Error fetching trade history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save new trade
router.post('/', async (req, res) => {
  try {
    const trade = req.body;
    const tradeId = await db.saveTrade(trade);
    res.json({ success: true, tradeId });
  } catch (error) {
    logger.error('Error saving trade:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update trade
router.put('/:ticket', async (req, res) => {
  try {
    const { ticket } = req.params;
    const updates = req.body;
    const changes = await db.updateTrade(ticket, updates);
    res.json({ success: true, changes });
  } catch (error) {
    logger.error('Error updating trade:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trade statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const days = parseInt(req.query.days) || 30;
    
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const metrics = await db.getPerformanceMetrics(userId, startDate, endDate);
    
    // Calculate summary
    const summary = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      winRate: 0,
      profitFactor: 0,
      netProfit: 0
    };
    
    metrics.forEach(m => {
      summary.totalTrades += m.total_trades;
      summary.winningTrades += m.winning_trades;
      summary.losingTrades += m.losing_trades;
      summary.totalProfit += m.total_profit;
      summary.totalLoss += m.total_loss;
    });
    
    if (summary.totalTrades > 0) {
      summary.winRate = (summary.winningTrades / summary.totalTrades * 100).toFixed(2);
    }
    
    if (summary.totalLoss > 0) {
      summary.profitFactor = (summary.totalProfit / summary.totalLoss).toFixed(2);
    }
    
    summary.netProfit = (summary.totalProfit - summary.totalLoss).toFixed(2);
    
    res.json({ success: true, summary, daily: metrics });
  } catch (error) {
    logger.error('Error fetching trade stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
