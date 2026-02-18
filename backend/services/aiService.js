/**
 * AI Service
 * Handles AI-powered trading features
 */

const logger = require('../utils/logger');

// AI Configuration
const AI_CONFIG = {
  models: {
    conservative: { riskMultiplier: 0.7, volatilityThreshold: 1.2 },
    balanced: { riskMultiplier: 1.0, volatilityThreshold: 1.5 },
    aggressive: { riskMultiplier: 1.3, volatilityThreshold: 2.0 },
    scalper: { riskMultiplier: 0.8, volatilityThreshold: 1.0 },
    swing: { riskMultiplier: 1.1, volatilityThreshold: 1.8 }
  }
};

/**
 * Process AI query from user
 */
async function processQuery(query, tradingContext) {
  const intent = classifyIntent(query);
  
  switch (intent) {
    case 'exit_advice':
      return generateExitAdvice(tradingContext);
    case 'position_sizing':
      return generateSizingAdvice(tradingContext);
    case 'risk_check':
      return generateRiskAnalysis(tradingContext);
    case 'market_analysis':
      return generateMarketAnalysis(tradingContext);
    case 'hold_or_close':
      return generateHoldOrCloseAdvice(tradingContext);
    default:
      return {
        type: 'general',
        message: 'I can help you with trade management. Ask me about exits, position sizing, or risk analysis.',
        actions: []
      };
  }
}

/**
 * Classify user query intent
 */
function classifyIntent(query) {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('exit') || lowerQuery.includes('close') || lowerQuery.includes('take profit')) {
    return 'exit_advice';
  }
  if (lowerQuery.includes('size') || lowerQuery.includes('lot') || lowerQuery.includes('position')) {
    return 'position_sizing';
  }
  if (lowerQuery.includes('risk') || lowerQuery.includes('safe') || lowerQuery.includes('danger')) {
    return 'risk_check';
  }
  if (lowerQuery.includes('analysis') || lowerQuery.includes('market') || lowerQuery.includes('trend')) {
    return 'market_analysis';
  }
  if (lowerQuery.includes('hold') || lowerQuery.includes('keep') || lowerQuery.includes('stay')) {
    return 'hold_or_close';
  }
  
  return 'general';
}

/**
 * Generate exit advice for open positions
 */
function generateExitAdvice(context) {
  const { openPositions, marketData } = context;
  
  if (!openPositions || openPositions.length === 0) {
    return {
      type: 'exit_advice',
      message: 'No open positions to analyze.',
      actions: []
    };
  }
  
  const position = openPositions[0];
  const currentProfit = position.profitPips || 0;
  const isInProfit = currentProfit > 0;
  
  let message = '';
  let actions = [];
  
  if (isInProfit) {
    message = `Your ${position.symbol} position is at +${currentProfit} pips. `;
    
    if (currentProfit >= 30) {
      message += 'Consider taking partial profits or moving SL to breakeven.';
      actions = [
        { label: 'Partial TP (50%)', action: 'partial_tp', params: { percent: 50 } },
        { label: 'Move to BE', action: 'move_be' }
      ];
    } else {
      message += 'Position is in early profit. Consider holding for larger targets.';
      actions = [
        { label: 'Set Trailing Stop', action: 'trailing_stop' }
      ];
    }
  } else {
    message = `Your ${position.symbol} position is at ${currentProfit} pips. `;
    
    if (currentProfit <= -20) {
      message += 'Position is underwater. Consider cutting losses or reducing size.';
      actions = [
        { label: 'Close Position', action: 'close_trade' },
        { label: 'Hedge Position', action: 'hedge' }
      ];
    } else {
      message += 'Small drawdown within normal range. Monitor closely.';
    }
  }
  
  return {
    type: 'exit_advice',
    message,
    actions,
    position: position.symbol,
    profitPips: currentProfit
  };
}

/**
 * Generate position sizing advice
 */
function generateSizingAdvice(context) {
  const { accountBalance, riskPercent, stopLossPips, symbol } = context;
  
  const result = calculateSmartPositionSize({
    accountBalance,
    riskPercent,
    stopLossPips,
    symbol,
    marketConditions: context.marketConditions
  });
  
  return {
    type: 'position_sizing',
    message: `Recommended size: ${result.lotSize} lots (${result.riskPercent}% risk)`,
    details: result,
    actions: [
      { label: `Use ${result.lotSize} Lots`, action: 'set_lot_size', params: { lotSize: result.lotSize } },
      { label: 'Custom Size', action: 'custom_size' }
    ]
  };
}

/**
 * Generate risk analysis
 */
function generateRiskAnalysis(context) {
  const { openPositions, accountBalance } = context;
  
  const totalExposure = openPositions?.reduce((sum, pos) => sum + (pos.lotSize || 0), 0) || 0;
  const totalRisk = openPositions?.reduce((sum, pos) => sum + (pos.riskAmount || 0), 0) || 0;
  const riskPercent = accountBalance ? (totalRisk / accountBalance * 100) : 0;
  
  let riskLevel = 'low';
  let message = '';
  
  if (riskPercent > 5) {
    riskLevel = 'high';
    message = `⚠️ High risk exposure: ${riskPercent.toFixed(1)}% of account at risk.`;
  } else if (riskPercent > 3) {
    riskLevel = 'medium';
    message = `Risk exposure: ${riskPercent.toFixed(1)}% of account. Within acceptable range.`;
  } else {
    message = `Low risk exposure: ${riskPercent.toFixed(1)}% of account. Room for more trades.`;
  }
  
  return {
    type: 'risk_check',
    riskLevel,
    message,
    details: {
      totalExposure,
      totalRisk,
      riskPercent: riskPercent.toFixed(2),
      openPositions: openPositions?.length || 0
    },
    actions: riskLevel === 'high' ? [
      { label: 'Reduce Exposure', action: 'reduce_exposure' },
      { label: 'Close Some Trades', action: 'close_partial' }
    ] : []
  };
}

/**
 * Generate market analysis
 */
function generateMarketAnalysis(context) {
  const { symbol, marketData } = context;
  
  // Simplified analysis
  const volatility = marketData?.atr || 0;
  const trend = marketData?.trend || 'neutral';
  
  return {
    type: 'market_analysis',
    message: `${symbol} Analysis: ${trend.toUpperCase()} trend with ${volatility} pips ATR.`,
    details: {
      trend,
      volatility,
      recommendation: trend === 'up' ? 'Consider long setups' : trend === 'down' ? 'Consider short setups' : 'Wait for direction'
    },
    actions: []
  };
}

/**
 * Generate hold or close advice
 */
function generateHoldOrCloseAdvice(context) {
  const { position, marketData, newsEvents } = context;
  
  let recommendation = 'hold';
  let message = '';
  let actions = [];
  
  // Check for upcoming news
  const hasHighImpactNews = newsEvents?.some(e => e.impact === 'high' && e.minutesUntil < 30);
  
  if (hasHighImpactNews) {
    recommendation = 'caution';
    message = '⚠️ High-impact news approaching. Consider reducing exposure.';
    actions = [
      { label: 'Close 50%', action: 'partial_close', params: { percent: 50 } },
      { label: 'Move to BE', action: 'move_be' }
    ];
  } else if (position?.profitPips > 50) {
    recommendation = 'partial';
    message = 'Strong profit. Consider taking partial profits.';
    actions = [
      { label: 'Take 50% Profit', action: 'partial_tp', params: { percent: 50 } }
    ];
  } else {
    message = 'No immediate action needed. Continue monitoring.';
  }
  
  return {
    type: 'hold_or_close',
    recommendation,
    message,
    actions
  };
}

/**
 * Calculate smart position size with AI adjustments
 */
function calculateSmartPositionSize(params) {
  const { accountBalance, riskPercent, stopLossPips, symbol, marketConditions } = params;
  
  // Base calculation
  const riskAmount = accountBalance * (riskPercent / 100);
  
  // AI Adjustments
  let volatilityFactor = 1.0;
  let correlationFactor = 1.0;
  let newsFactor = 1.0;
  let performanceFactor = 1.0;
  
  // Volatility adjustment
  if (marketConditions) {
    const currentATR = marketConditions.atr || 0;
    const avgATR = marketConditions.avgAtr || currentATR;
    
    if (currentATR > avgATR * 1.5) {
      volatilityFactor = 0.7; // Reduce size in high volatility
    } else if (currentATR < avgATR * 0.7) {
      volatilityFactor = 1.2; // Increase size in low volatility
    }
    
    // Correlation risk
    if (marketConditions.correlatedPositions > 0) {
      correlationFactor = 1 - (marketConditions.correlatedPositions * 0.15);
      if (correlationFactor < 0.5) correlationFactor = 0.5;
    }
    
    // News proximity
    if (marketConditions.newsMinutesUntil < 30) {
      newsFactor = 0.7;
    } else if (marketConditions.newsMinutesUntil < 60) {
      newsFactor = 0.85;
    }
    
    // Historical performance
    if (marketConditions.winRate > 60) {
      performanceFactor = 1.1;
    } else if (marketConditions.winRate < 40) {
      performanceFactor = 0.8;
    }
  }
  
  // Combined adjustment
  const aiAdjustment = volatilityFactor * correlationFactor * newsFactor * performanceFactor;
  const adjustedRisk = riskAmount * aiAdjustment;
  
  // Calculate lot size (simplified - would use actual pip value)
  const pipValue = getPipValue(symbol);
  const lotSize = adjustedRisk / (stopLossPips * pipValue);
  
  // Round to valid lot size
  const roundedLot = Math.floor(lotSize * 100) / 100;
  const finalLot = Math.max(0.01, Math.min(roundedLot, 100));
  
  return {
    lotSize: finalLot.toFixed(2),
    riskAmount: adjustedRisk.toFixed(2),
    riskPercent: ((adjustedRisk / accountBalance) * 100).toFixed(2),
    adjustments: {
      volatilityFactor: volatilityFactor.toFixed(2),
      correlationFactor: correlationFactor.toFixed(2),
      newsFactor: newsFactor.toFixed(2),
      performanceFactor: performanceFactor.toFixed(2)
    },
    adjustmentReasons: getAdjustmentReasons(volatilityFactor, correlationFactor, newsFactor, performanceFactor)
  };
}

/**
 * Get pip value for symbol
 */
function getPipValue(symbol) {
  // Simplified pip values
  const pipValues = {
    'EURUSD': 10,
    'GBPUSD': 10,
    'USDJPY': 9.09,
    'USDCHF': 11.11,
    'AUDUSD': 10,
    'USDCAD': 7.69,
    'NZDUSD': 10,
    'XAUUSD': 10,
    'default': 10
  };
  
  return pipValues[symbol] || pipValues.default;
}

/**
 * Get adjustment reasons
 */
function getAdjustmentReasons(volatility, correlation, news, performance) {
  const reasons = [];
  
  if (volatility < 1) reasons.push('High volatility detected - reduced size');
  if (volatility > 1) reasons.push('Low volatility - increased size');
  if (correlation < 1) reasons.push('Correlated positions - reduced exposure');
  if (news < 1) reasons.push('News approaching - cautious sizing');
  if (performance > 1) reasons.push('Strong performance on this pair');
  if (performance < 1) reasons.push('Weak performance on this pair');
  
  return reasons;
}

/**
 * Predict exit zones using ML-like logic
 */
async function predictExitZones(position, marketData) {
  const { entryPrice, currentPrice, symbol } = position;
  const { supportLevels, resistanceLevels, atr } = marketData;
  
  const zones = [];
  
  // Zone 1: Near resistance (conservative)
  if (resistanceLevels && resistanceLevels.length > 0) {
    const nearestResistance = resistanceLevels[0];
    const distance = Math.abs(nearestResistance - currentPrice);
    const probability = Math.max(50, 100 - (distance / atr * 10));
    
    zones.push({
      price: nearestResistance,
      percent: 30,
      probability: Math.min(95, probability.toFixed(0)),
      type: 'resistance',
      label: 'TP1 - Resistance'
    });
  }
  
  // Zone 2: Extended target
  const extendedTarget = entryPrice + (atr * 2);
  zones.push({
    price: extendedTarget,
    percent: 40,
    probability: 50,
    type: 'extended',
    label: 'TP2 - Extended'
  });
  
  // Zone 3: Runner
  const runnerTarget = entryPrice + (atr * 3);
  zones.push({
    price: runnerTarget,
    percent: 30,
    probability: 25,
    type: 'runner',
    label: 'TP3 - Runner'
  });
  
  return {
    strategy: 'partial_exit',
    zones,
    recommendation: 'Close 30% at TP1, 40% at TP2, trail remaining 30%'
  };
}

/**
 * Get AI suggestion based on type
 */
async function getSuggestion(type, context) {
  switch (type) {
    case 'exit':
      return generateExitAdvice(context);
    case 'sizing':
      return generateSizingAdvice(context);
    case 'risk':
      return generateRiskAnalysis(context);
    default:
      return {
        type: 'general',
        message: 'How can I help with your trading today?',
        actions: []
      };
  }
}

/**
 * Analyze query for AI copilot
 */
async function analyzeQuery(query, tradingContext) {
  return processQuery(query, tradingContext);
}

module.exports = {
  processQuery,
  calculateSmartPositionSize,
  predictExitZones,
  getSuggestion,
  analyzeQuery,
  classifyIntent
};
