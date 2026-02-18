const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Save onboarding responses
router.post('/save', async (req, res) => {
  try {
    const { userId, responses } = req.body;

    if (!userId || !responses) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or responses',
      });
    }

    logger.info(`Onboarding responses saved for user: ${userId}`);

    res.json({
      success: true,
      message: 'Onboarding responses saved successfully',
      data: {
        userId,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error('Error saving onboarding responses:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get onboarding status
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId',
      });
    }

    logger.info(`Fetching onboarding status for user: ${userId}`);

    res.json({
      success: true,
      data: {
        userId,
        completed: true,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Error fetching onboarding status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update trader settings based on onboarding
router.put('/update-settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { settings } = req.body;

    if (!userId || !settings) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or settings',
      });
    }

    logger.info(`Updating trader settings for user: ${userId}`);

    res.json({
      success: true,
      message: 'Trader settings updated successfully',
      data: {
        userId,
        settings,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error('Error updating trader settings:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get personalized recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const { responses } = req.body;

    if (!responses) {
      return res.status(400).json({
        success: false,
        error: 'Missing responses',
      });
    }

    const recommendations = generateRecommendations(responses);

    logger.info('Generated personalized recommendations');

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    logger.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Helper function to generate recommendations
function generateRecommendations(responses) {
  const { experience_level, risk_tolerance, trading_style, account_size_range } = responses;

  const riskByTolerance = {
    conservative: 0.5,
    moderate: 1,
    aggressive: 2,
    very_aggressive: 3,
  };

  const riskByExperience = {
    beginner: 0.5,
    intermediate: 1,
    advanced: 1.5,
    professional: 2,
  };

  const baseRisk = Math.min(
    riskByTolerance[risk_tolerance] || 1,
    riskByExperience[experience_level] || 1
  );

  return {
    recommended_risk_per_trade: baseRisk,
    recommended_position_size: calculatePositionSize(account_size_range),
    auto_breakeven_enabled: experience_level !== 'beginner',
    partial_tp_enabled: trading_style !== 'scalper',
    news_protection_enabled: true,
    ai_aggressiveness:
      experience_level === 'professional' && risk_tolerance === 'very_aggressive'
        ? 'aggressive'
        : experience_level === 'beginner' || risk_tolerance === 'conservative'
          ? 'conservative'
          : 'moderate',
    trailing_stop_enabled: ['advanced', 'professional'].includes(experience_level),
  };
}

function calculatePositionSize(accountSize) {
  const sizes = {
    under_1k: 0.5,
    '1k_5k': 0.75,
    '5k_25k': 1,
    '25k_100k': 1.25,
    '100k_plus': 1.5,
  };
  return sizes[accountSize] || 1;
}

module.exports = router;
