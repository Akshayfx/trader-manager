# ChartWise AI Features Documentation

## Overview

ChartWise integrates advanced AI capabilities to assist traders with intelligent decision-making, risk management, and trade execution. This document details all AI features and their implementation.

## 🤖 AI Copilot

### Description
An intelligent chat assistant embedded in the tool that provides context-aware trading advice based on current positions, market conditions, and trader's history.

### Capabilities

#### 1. Position Analysis
- Analyzes open trades vs. current market structure
- Identifies support/resistance proximity
- Calculates risk/reward at current levels

#### 2. Market Context Understanding
- Monitors economic calendar
- Tracks correlation between open positions
- Identifies volatility regime changes

#### 3. Personalized Recommendations
- Learns from trader's past exits (early vs. late)
- Adapts to risk tolerance preferences
- Suggests based on win/loss patterns

### Sample Queries & Responses

**Query: "Should I close EUR/USD?"**
```
🤖 Analysis:
• Price at resistance (1.0850)
• NFP data in 23 minutes
• Your position: +45 pips

Recommendation: Close 50% now, trail remaining with 20-pip SL

[Execute Suggestion] [Dismiss]
```

**Query: "What's my best exit strategy?"**
```
🤖 Analyzing EUR/USD Long from 1.0805...

Technical Analysis:
✓ Trend: Uptrend intact (20/50 EMA bullish)
✓ Momentum: Strong (RSI 64)
⚠ Price: Near resistance zone (1.0850-1.0860)

AI Exit Zones:
1. Partial TP1: 1.0850 (30% position) - 78% probability
2. Partial TP2: 1.0875 (40% position) - 52% probability
3. Runner: Trail with 25-pip stop (30%)

[Apply Strategy] [Adjust Levels]
```

## 📊 Smart Risk Calculator

### Description
AI-powered position sizing that adapts to current market volatility, correlation risk, and trader's performance patterns.

### Calculation Logic

```javascript
function calculateSmartPositionSize({
  accountBalance,
  baseRiskPercent,
  stopLossPips,
  pair,
  marketConditions,
  openPositions
}) {
  // Base calculation
  const riskAmount = accountBalance * (baseRiskPercent / 100);
  
  // AI Adjustments
  const volatilityFactor = getVolatilityAdjustment(pair);
  // Returns 0.5 to 1.5
  
  const correlationFactor = getCorrelationRisk(pair, openPositions);
  // Returns 0.6 to 1.0
  
  const newsFactor = getUpcomingNewsRisk(pair);
  // Returns 0.7 to 1.0
  
  const performanceFactor = getTraderPerformanceFactor(pair);
  // Returns 0.8 to 1.2
  
  // Combined adjustment
  const aiAdjustment = 
    volatilityFactor * 
    correlationFactor * 
    newsFactor * 
    performanceFactor;
  
  const adjustedRisk = riskAmount * aiAdjustment;
  
  // Calculate lot size
  const pipValue = getPipValue(pair, accountCurrency);
  const lotSize = adjustedRisk / (stopLossPips * pipValue);
  
  return {
    lotSize: roundToValidLot(lotSize),
    riskAmount: adjustedRisk,
    riskPercent: (adjustedRisk / accountBalance) * 100,
    adjustmentReasons: getAdjustmentExplanation(...)
  };
}
```

### Adjustment Factors

#### 1. Volatility Adjustment
```
ATR (Average True Range) Analysis:
- Current ATR vs 20-day average
- If ATR > 150% of average → Reduce position by 30%
- If ATR < 70% of average → Increase position by 20%

Example:
EUR/USD normally: ATR = 80 pips
Today: ATR = 140 pips (175% of normal)
Action: Reduce position size to 0.7x
```

#### 2. Correlation Risk
```
Checks all open positions for correlation:
- EUR/USD + GBP/USD open → 0.85 correlation → Reduce by 20%
- USD/JPY + USD/CHF open → 0.75 correlation → Reduce by 15%
- Maximum 3 correlated positions allowed

Formula:
correlation_factor = 1 - (avg_correlation * num_correlated_pairs * 0.1)
```

#### 3. News Proximity
```
Within 30 mins of High Impact news → Reduce by 30%
Within 1 hour of High Impact news → Reduce by 15%
Within 2 hours of Medium Impact → Reduce by 10%

Auto-cancels new trades 5 minutes before major news.
```

#### 4. Historical Performance
```
Tracks last 30 trades on each pair:
- Win rate > 60% on EUR/USD → Increase by 10%
- Win rate < 40% on GBP/JPY → Reduce by 20%
- Average R:R achieved → Adjusts expectations
```

## 🎯 Predictive Exit Zones

### Description
Machine learning model that suggests optimal take-profit levels based on price action patterns, market structure, and historical exit performance.

### ML Model Training Data

```javascript
const trainingFeatures = {
  entry_price: float,
  current_price: float,
  distance_to_resistance: float,  // pips
  distance_to_support: float,
  atr_multiple: float,  // how many ATRs moved
  trend_strength: float,  // ADX, EMA alignment
  time_in_trade: int,  // minutes
  session: string,  // London, NY, Asian
  day_of_week: string,
  volatility_regime: string,  // low, medium, high
  recent_candle_pattern: string,
  rsi_value: float,
  distance_from_ma: float
};

const trainingLabels = {
  optimal_tp1: float,
  optimal_tp2: float,
  max_favorable_excursion: float,
  actual_exit: float,
  exit_quality_score: float  // 0-10 rating
};
```

### Prediction Algorithm

```javascript
function predictExitZones(position, marketData) {
  // Extract features from current position
  const features = extractPositionFeatures(position, marketData);
  
  // Get ML predictions
  const modelOutput = trainedModel.predict(features);
  
  // Find nearby support/resistance levels
  const keyLevels = identifySRLevels(marketData);
  
  // Align ML predictions with technical levels
  const alignedZones = alignPredictionsToLevels(modelOutput, keyLevels);
  
  // Calculate probabilities
  for (const zone of alignedZones) {
    zone.probability = calculateHitProbability(
      currentPrice=position.currentPrice,
      targetPrice=zone.price,
      features=features
    );
  }
  
  // Generate execution strategy
  return createPartialTPStrategy(alignedZones, position.lots);
}
```

### Example Output

```
Position: EUR/USD Long @ 1.0805
Current: 1.0842 (+37 pips, +$185)

🤖 AI Exit Analysis
┌─────────────────────────────────┐
│ Suggested Exit Strategy:        │
│                                 │
│ Zone 1: 1.0850 (Resistance)     │
│ ├─ Close: 30% of position       │
│ ├─ Probability: 78% chance hit  │
│ └─ Historical: Usually reverses │
│                                 │
│ Zone 2: 1.0875 (Next Level)     │
│ ├─ Close: 40% of position       │
│ ├─ Probability: 52% chance hit  │
│ └─ Risk/Reward: 1.8:1 from here │
│                                 │
│ Zone 3: 1.0920 (Major Resist.)  │
│ ├─ Trail: Remaining 30%         │
│ ├─ Probability: 25% chance hit  │
│ └─ Stop: 25-pip trailing        │
│                                 │
│ [Apply Strategy] [Customize]    │
└─────────────────────────────────┘
```

## 📰 News-Aware Automation

### Description
Automatically monitors economic calendar and adjusts trade management parameters before, during, and after high-impact events.

### Auto-Adjustment Rules

#### Pre-News Actions (30 mins before)
```javascript
const highImpactRules = {
  tightenStops: {
    enabled: true,
    action: 'move_to_breakeven_plus',
    plusPips: 10
  },
  partialClose: {
    enabled: true,
    percentage: 50,
    minProfitPips: 15
  },
  disableNewTrades: {
    enabled: true,
    minutesBefore: 15
  },
  cancelPending: {
    enabled: true,
    minutesBefore: 10
  }
};
```

#### News Calendar Integration
```javascript
class NewsMonitor {
  constructor() {
    this.calendarApi = EconomicCalendarAPI();
    this.monitoredCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];
  }
  
  getUpcomingEvents(hoursAhead = 4) {
    return this.calendarApi.fetchEvents({
      currencies: this.monitoredCurrencies,
      impact: ['HIGH', 'MEDIUM'],
      timeframeHours: hoursAhead
    });
  }
  
  checkPositionExposure(event, openPositions) {
    const affectedPairs = [];
    
    for (const position of openPositions) {
      if (position.symbol.includes(event.currency)) {
        affectedPairs.push({
          position: position,
          exposureType: 'direct',
          riskLevel: event.impact
        });
      }
    }
    
    return affectedPairs;
  }
}
```

### User Notification System

```
[15 mins before FOMC]
🔔 Notification:
"High Impact USD event in 15 minutes
3 positions affected: EUR/USD, GBP/USD, USD/JPY
AI Protection activated automatically"

[Event occurs]
🔔 Live Update:
"FOMC Minutes released - Market moving
Current volatility: +180% vs average
Your positions safe (stops at BE+10)"

[15 mins after event]
🔔 Summary:
"Event impact subsiding
Volatility returning to normal
Trading re-enabled
Session P&L: +$245 (Protected from spike)"
```

## 🔄 Adaptive Trailing Stop

### Description
Intelligent trailing stop that adjusts trail distance based on volatility, trend strength, and price action patterns.

### Adaptive Logic

```javascript
function calculateAdaptiveTrailDistance(position, baseTrailPips, marketData) {
  const currentATR = marketData.atr14;
  const avgATR = marketData.atr20Average;
  
  // Volatility adjustment
  let volatilityMultiplier = 1.0;
  if (currentATR > avgATR * 1.3) {
    volatilityMultiplier = 1.3; // Widen trail
  } else if (currentATR < avgATR * 0.7) {
    volatilityMultiplier = 0.8; // Tighten trail
  }
  
  // Trend strength adjustment
  const adx = marketData.adx;
  let trendMultiplier = 1.0;
  if (adx > 40) {
    trendMultiplier = 1.2; // Strong trend - wider trail
  } else if (adx < 20) {
    trendMultiplier = 0.9; // Weak trend - tighter trail
  }
  
  // Time-based adjustment
  const timeInTradeHours = position.durationHours;
  const timeMultiplier = timeInTradeHours > 12 ? 0.85 : 1.0;
  
  // Support/Resistance proximity
  const nearestSR = findNearestSupportResistance(position.currentPrice, marketData);
  let srAdjustment = 0;
  if (Math.abs(position.currentPrice - nearestSR) < baseTrailPips * 1.5) {
    srAdjustment = -5; // Tighten by 5 pips
  }
  
  // Calculate final trail distance
  const adaptiveTrail = (
    baseTrailPips * 
    volatilityMultiplier * 
    trendMultiplier * 
    timeMultiplier
  ) + srAdjustment;
  
  return Math.max(adaptiveTrail, baseTrailPips * 0.7);
}
```

### Trail Modes Available

1. **Fixed Trail** - Standard: X pips from current price
2. **ATR-Based Trail** - Trail = ATR * multiplier (e.g., 2.5 × ATR)
3. **Candle-Based Trail** - Trail below previous candle low (for longs)
4. **Parabolic SAR Trail** - Uses SAR indicator dots as trail levels
5. **AI Adaptive Trail** - Combines all above intelligently

## 🔍 Pattern Recognition for Exits

### Description
Detects reversal patterns and warns trader about potential exit opportunities.

### Detected Patterns

```javascript
const reversalPatterns = {
  bullishReversal: [
    'double_bottom',
    'bullish_engulfing',
    'morning_star',
    'hammer',
    'inverse_head_shoulders'
  ],
  bearishReversal: [
    'double_top',
    'bearish_engulfing',
    'evening_star',
    'shooting_star',
    'head_shoulders'
  ],
  exhaustion: [
    'rising_wedge',
    'falling_wedge',
    'triple_top',
    'triple_bottom'
  ]
};
```

### Alert Interface

```
🔔 Pattern Alert
┌─────────────────────────────────┐
│ EUR/USD (Your Long Position)    │
│                                 │
│ ⚠️ Bearish Pattern Detected:    │
│ "Evening Star" on H1 chart      │
│                                 │
│ Confidence: 78%                 │
│ Historical Win Rate: 65%        │
│                                 │
│ Your position: +42 pips profit  │
│                                 │
│ 🤖 Suggestion:                  │
│ Consider partial exit (50%)     │
│ Trail remainder with 20-pip SL  │
│                                 │
│ [Execute] [Ignore] [More Info]  │
└─────────────────────────────────┘
```

## 🎛️ AI Settings

### Configuration Options

```javascript
const aiSettings = {
  // Core Settings
  enabled: true,
  model: 'balanced', // conservative | balanced | aggressive | scalper | swing
  realTimeSuggestions: true,
  autoExecute: false, // PRO feature
  
  // Suggestion Settings
  aggressiveness: 3, // 1-5 scale
  minConfidence: 70, // Minimum confidence % for suggestions
  
  // Learning Settings
  learnFromHistory: true,
  adaptationRate: 0.1, // How quickly AI adapts to patterns
  
  // Notification Settings
  notifyOnSuggestion: true,
  notifyOnPattern: true,
  notifyOnNews: true
};
```

### AI Models

| Model | Description | Risk Multiplier | Best For |
|-------|-------------|-----------------|----------|
| Conservative | Lower risk, more cautious | 0.7 | Beginners |
| Balanced | Recommended default | 1.0 | Most traders |
| Aggressive | Higher risk tolerance | 1.3 | Experienced traders |
| Scalper | Optimized for quick trades | 0.8 | Scalpers |
| Swing | For longer-term positions | 1.1 | Swing traders |

## 📈 Performance Tracking

### AI Learning Metrics

The AI tracks and learns from:

1. **Exit Timing** - Early vs late exits
2. **Position Sizing** - Optimal risk per trade
3. **Pair Performance** - Win rates by currency pair
4. **Session Performance** - Best trading times
5. **News Impact** - How news affects your trades
6. **Pattern Success** - Which patterns work for you

### Improvement Suggestions

```
📊 AI Performance Report (Weekly)

Your Trading Analysis:
• Win Rate: 58% (+3% from last week)
• Avg R:R: 1.6:1
• Best Pair: EUR/USD (67% win rate)
• Worst Pair: GBP/JPY (42% win rate)

🤖 AI Recommendations:
1. Consider reducing size on GBP/JPY by 20%
2. Your exits on EUR/USD are typically early
   → Suggestion: Hold 30% longer
3. Best performance during London session
   → Focus trading hours: 8AM-12PM GMT

[View Detailed Report] [Apply Suggestions]
```

## 🔒 Safety Features

### AI Safeguards

1. **Maximum Risk Limit** - AI never suggests >5% risk per trade
2. **Correlation Cap** - Limits exposure to correlated pairs
3. **News Blackout** - No new trades 5 mins before high-impact news
4. **Drawdown Protection** - Auto-pause after 10% drawdown
5. **Manual Override** - All AI suggestions require confirmation (unless auto-execute enabled)

### Audit Trail

All AI decisions are logged:
- Timestamp
- Market conditions
- Suggestion made
- User action taken
- Outcome

This enables continuous improvement and transparency.

---

**Note:** AI features are designed to assist, not replace, trader judgment. Always verify AI suggestions against your own analysis.
