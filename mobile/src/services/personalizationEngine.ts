export interface PersonalizationRecommendations {
  recommended_risk_per_trade: number;
  recommended_position_size: number;
  auto_breakeven_enabled: boolean;
  partial_tp_enabled: boolean;
  news_protection_enabled: boolean;
  ai_aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  trailing_stop_enabled: boolean;
  prop_firm_mode_enabled: boolean;
  default_take_profit_level: number;
  default_stop_loss_level: number;
  preferred_indicators: string[];
  notification_preferences: string[];
}

export const personalizationEngine = {
  generateRecommendations(responses: any): PersonalizationRecommendations {
    const { experience_level, risk_tolerance, primary_goal, trading_style, account_size_range, prop_firm_participation, daily_availability } = responses;

    // Base risk calculation
    const riskByTolerance: Record<string, number> = {
      conservative: 0.5,
      moderate: 1,
      aggressive: 2,
      very_aggressive: 3,
    };

    const riskByExperience: Record<string, number> = {
      beginner: 0.5,
      intermediate: 1,
      advanced: 1.5,
      professional: 2,
    };

    const baseRisk = Math.min(riskByTolerance[risk_tolerance] || 1, riskByExperience[experience_level] || 1);

    // Position size multiplier
    const positionSizeByAccount: Record<string, number> = {
      under_1k: 0.5,
      '1k_5k': 0.75,
      '5k_25k': 1,
      '25k_100k': 1.25,
      '100k_plus': 1.5,
    };

    // AI Aggressiveness
    const determineAIAggressiveness = (): 'conservative' | 'moderate' | 'aggressive' => {
      if (experience_level === 'professional' && risk_tolerance === 'very_aggressive') {
        return 'aggressive';
      }
      if (experience_level === 'beginner' || risk_tolerance === 'conservative') {
        return 'conservative';
      }
      return 'moderate';
    };

    // TP/SL defaults based on trading style
    const getTakeProfitLevel = (): number => {
      const levels: Record<string, number> = {
        scalper: 0.5,
        day_trader: 1,
        swing_trader: 2,
        position_trader: 3,
      };
      return levels[trading_style] || 1;
    };

    const getStopLossLevel = (): number => {
      const levels: Record<string, number> = {
        scalper: 0.5,
        day_trader: 1,
        swing_trader: 1.5,
        position_trader: 2,
      };
      return levels[trading_style] || 1;
    };

    // Determine which features to enable
    const enableAutoBreakeven = experience_level !== 'beginner' && risk_tolerance !== 'conservative';
    const enablePartialTP = trading_style !== 'scalper' && experience_level !== 'beginner';
    const enableTrailingStop = ['advanced', 'professional'].includes(experience_level);

    // News protection based on trading sessions
    const enableNewsProtection = responses.preferred_sessions.includes('european') || responses.preferred_sessions.includes('us');

    // Recommended indicators based on style
    const getPreferredIndicators = (): string[] => {
      const baseIndicators: Record<string, string[]> = {
        scalper: ['EMA', 'Stochastic', 'MACD'],
        day_trader: ['RSI', 'Bollinger Bands', 'ADX'],
        swing_trader: ['MACD', 'Stochastic', 'Moving Averages'],
        position_trader: ['EMA', 'RSI', 'ADX'],
      };
      return baseIndicators[trading_style] || ['EMA', 'RSI', 'MACD'];
    };

    // Notification preferences based on availability
    const getNotificationPreferences = (): string[] => {
      const prefs: string[] = [];
      if (daily_availability === 'full_time') {
        prefs.push('trade_signals', 'news_alerts', 'risk_warnings');
      } else if (daily_availability === 'part_time_morning') {
        prefs.push('morning_alerts', 'pre_market_analysis');
      } else if (daily_availability === 'part_time_evening') {
        prefs.push('evening_alerts', 'daily_summary');
      } else {
        prefs.push('weekend_education', 'weekly_summary');
      }
      return prefs;
    };

    return {
      recommended_risk_per_trade: baseRisk,
      recommended_position_size: positionSizeByAccount[account_size_range] || 1,
      auto_breakeven_enabled: enableAutoBreakeven,
      partial_tp_enabled: enablePartialTP,
      news_protection_enabled: enableNewsProtection,
      ai_aggressiveness: determineAIAggressiveness(),
      trailing_stop_enabled: enableTrailingStop,
      prop_firm_mode_enabled: prop_firm_participation === 'yes_specific' || prop_firm_participation === 'planning',
      default_take_profit_level: getTakeProfitLevel(),
      default_stop_loss_level: getStopLossLevel(),
      preferred_indicators: getPreferredIndicators(),
      notification_preferences: getNotificationPreferences(),
    };
  },

  generatePersonalizedMessage(experience_level: string, primary_goal: string): string {
    const messages: Record<string, Record<string, string>> = {
      beginner: {
        capital_protection: 'Welcome! We will focus on protecting your capital with conservative settings.',
        consistent_income: 'Great! We will guide you toward consistent, stable returns.',
        aggressive_growth: 'Exciting! We will help you grow while managing risks carefully.',
        prop_firm_challenge: 'Bold choice! We will prepare you for prop firm challenges with proper risk management.',
      },
      intermediate: {
        capital_protection: 'Welcome back! Your settings are optimized for steady, protected trading.',
        consistent_income: 'Perfect! We will maximize consistent income opportunities.',
        aggressive_growth: 'Great! We will help you scale with calculated risks.',
        prop_firm_challenge: 'Ready! Your account is configured for prop firm success.',
      },
      advanced: {
        capital_protection: 'Your settings reflect advanced capital preservation strategies.',
        consistent_income: 'Excellent! Advanced features enabled for optimal income generation.',
        aggressive_growth: 'Your profile is set for advanced growth strategies.',
        prop_firm_challenge: 'Ready for the challenge! Advanced features enabled.',
      },
      professional: {
        capital_protection: 'Professional-level capital protection strategies activated.',
        consistent_income: 'Professional settings for maximum consistent returns.',
        aggressive_growth: 'Professional growth mode - all advanced features available.',
        prop_firm_challenge: 'Professional account configured for top-tier performance.',
      },
    };

    return messages[experience_level]?.[primary_goal] || 'Welcome to ChartWise!';
  },

  calculateTradingProfile(responses: any): string {
    const { experience_level, trading_style, risk_tolerance } = responses;

    if (experience_level === 'professional') {
      return 'Elite Trader';
    }
    if (experience_level === 'advanced') {
      return 'Expert Trader';
    }
    if (experience_level === 'intermediate') {
      return 'Growing Trader';
    }
    return 'Emerging Trader';
  },
};
