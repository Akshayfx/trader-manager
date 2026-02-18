import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useOnboardingStore } from '../store/onboardingStore';
import { personalizationEngine } from '../services/personalizationEngine';
import { OnboardingWelcome } from '../components/onboarding/OnboardingWelcome';
import { QuestionCard } from '../components/onboarding/QuestionCard';
import { OnboardingComplete } from '../components/onboarding/OnboardingComplete';
import { supabase } from '../services/api';

const ONBOARDING_QUESTIONS = [
  {
    id: 1,
    key: 'experience_level',
    title: 'What is your trading experience level?',
    subtitle: 'This helps us calibrate recommendations for your skill level',
    options: [
      { id: 'beginner', label: 'Beginner', description: 'Less than 1 year of trading' },
      { id: 'intermediate', label: 'Intermediate', description: '1-3 years of trading' },
      { id: 'advanced', label: 'Advanced', description: '3-7 years of trading' },
      { id: 'professional', label: 'Professional', description: '7+ years, trading full-time' },
    ],
    isMultiSelect: false,
  },
  {
    id: 2,
    key: 'primary_goal',
    title: 'What is your primary trading goal?',
    subtitle: 'Your goal shapes your risk management and strategy',
    options: [
      { id: 'capital_protection', label: 'Capital Protection', description: 'Preserve what I have' },
      { id: 'consistent_income', label: 'Consistent Income', description: 'Build steady returns' },
      { id: 'aggressive_growth', label: 'Aggressive Growth', description: 'Maximum capital growth' },
      { id: 'prop_firm_challenge', label: 'Prop Firm Challenge', description: 'Pass prop trading challenges' },
    ],
    isMultiSelect: false,
  },
  {
    id: 3,
    key: 'trading_style',
    title: 'What is your preferred trading style?',
    subtitle: 'Different styles require different tools and setups',
    options: [
      { id: 'scalper', label: 'Scalper', description: 'Hold trades 30 sec - 5 min' },
      { id: 'day_trader', label: 'Day Trader', description: 'Hold trades hours, close by day end' },
      { id: 'swing_trader', label: 'Swing Trader', description: 'Hold trades days to weeks' },
      { id: 'position_trader', label: 'Position Trader', description: 'Hold trades weeks to months' },
    ],
    isMultiSelect: false,
  },
  {
    id: 4,
    key: 'preferred_sessions',
    title: 'Which trading sessions do you prefer?',
    subtitle: 'Select all sessions where you typically trade',
    options: [
      { id: 'asian', label: 'Asian Session', description: 'Tokyo, Hong Kong, Sydney' },
      { id: 'european', label: 'European Session', description: 'London, Frankfurt, Paris' },
      { id: 'us', label: 'US Session', description: 'New York trading hours' },
      { id: 'overnight', label: 'Overnight', description: 'After-hours trading' },
    ],
    isMultiSelect: true,
  },
  {
    id: 5,
    key: 'risk_tolerance',
    title: 'What is your risk tolerance?',
    subtitle: 'Determines your position sizing and stop loss placement',
    options: [
      { id: 'conservative', label: 'Conservative', description: 'Sleep well at night priority' },
      { id: 'moderate', label: 'Moderate', description: 'Balance growth and security' },
      { id: 'aggressive', label: 'Aggressive', description: 'Willing to risk for bigger gains' },
      { id: 'very_aggressive', label: 'Very Aggressive', description: 'Maximize growth potential' },
    ],
    isMultiSelect: false,
  },
  {
    id: 6,
    key: 'trade_duration',
    title: 'What is your average trade duration?',
    subtitle: 'Helps optimize technical indicators and setups',
    options: [
      { id: 'minutes', label: 'Minutes', description: '5-30 minutes per trade' },
      { id: 'hours', label: 'Hours', description: '1-8 hours per trade' },
      { id: 'days', label: 'Days', description: '1-5 days per trade' },
      { id: 'weeks', label: 'Weeks+', description: 'Multiple weeks per trade' },
    ],
    isMultiSelect: false,
  },
  {
    id: 7,
    key: 'account_size_range',
    title: 'What is your current account size?',
    subtitle: 'Used for appropriate position sizing recommendations',
    options: [
      { id: 'under_1k', label: 'Under $1,000', description: 'Starting out' },
      { id: '1k_5k', label: '$1,000 - $5,000', description: 'Building foundation' },
      { id: '5k_25k', label: '$5,000 - $25,000', description: 'Growing account' },
      { id: '25k_100k', label: '$25,000 - $100,000', description: 'Established trader' },
      { id: '100k_plus', label: '$100,000+', description: 'Professional level' },
    ],
    isMultiSelect: false,
  },
  {
    id: 8,
    key: 'risk_per_trade',
    title: 'What risk per trade percentage do you prefer?',
    subtitle: 'Recommended: 1-2% for most traders',
    options: [
      { id: '0.5', label: '0.5%', description: 'Ultra conservative' },
      { id: '1', label: '1.0%', description: 'Recommended for most' },
      { id: '2', label: '2.0%', description: 'Moderate risk' },
      { id: '3', label: '3.0%', description: 'High risk' },
      { id: '5', label: '5.0%+', description: 'Very high risk' },
    ],
    isMultiSelect: false,
  },
  {
    id: 9,
    key: 'trading_instruments',
    title: 'What instruments do you focus on?',
    subtitle: 'Select all that interest you',
    options: [
      { id: 'majors', label: 'Major Currency Pairs', description: 'EUR/USD, GBP/USD, etc.' },
      { id: 'minors', label: 'Minor Pairs', description: 'EUR/GBP, AUD/USD, etc.' },
      { id: 'exotics', label: 'Exotic Pairs', description: 'Emerging market currencies' },
      { id: 'gold', label: 'Gold & Metals', description: 'GOLD, SILVER, etc.' },
      { id: 'indices', label: 'Indices', description: 'SP500, DAX, FTSE, etc.' },
      { id: 'crypto', label: 'Crypto', description: 'Bitcoin, Ethereum, etc.' },
    ],
    isMultiSelect: true,
  },
  {
    id: 10,
    key: 'main_challenge',
    title: 'What is your biggest trading challenge?',
    subtitle: 'We can provide targeted support for this',
    options: [
      { id: 'emotional_control', label: 'Emotional Control', description: 'Managing fear and greed' },
      { id: 'risk_management', label: 'Risk Management', description: 'Sizing and stops' },
      { id: 'strategy_execution', label: 'Strategy Execution', description: 'Following my plan' },
      { id: 'position_sizing', label: 'Position Sizing', description: 'How much to trade' },
      { id: 'timing_entries', label: 'Timing Entries', description: 'Finding good entries' },
    ],
    isMultiSelect: false,
  },
  {
    id: 11,
    key: 'preferred_features',
    title: 'Which features interest you most?',
    subtitle: 'Select all that apply',
    options: [
      { id: 'auto_be', label: 'Auto Breakeven', description: 'Automatically move stops to breakeven' },
      { id: 'partial_tp', label: 'Partial Take Profit', description: 'Close partial positions at levels' },
      { id: 'news', label: 'News Protection', description: 'Avoid major economic news' },
      { id: 'ai', label: 'AI Analysis', description: 'Get AI-powered trade analysis' },
      { id: 'trailing', label: 'Trailing Stops', description: 'Lock in profits as price moves' },
      { id: 'alerts', label: 'Smart Alerts', description: 'Customized notifications' },
    ],
    isMultiSelect: true,
  },
  {
    id: 12,
    key: 'prop_firm_participation',
    title: 'Are you interested in prop firm trading?',
    subtitle: 'Helps optimize settings for prop firm challenges',
    options: [
      { id: 'yes_specific', label: 'Yes, Already with a Firm', description: 'Part of a prop firm' },
      { id: 'planning', label: 'Planning to Join', description: 'Want to prepare for it' },
      { id: 'not_interested', label: 'Not Interested', description: 'Focus on personal account' },
    ],
    isMultiSelect: false,
  },
  {
    id: 13,
    key: 'current_platform',
    title: 'What trading platform do you use?',
    subtitle: 'We support MT4, MT5, and others',
    options: [
      { id: 'mt4', label: 'MT4', description: 'MetaTrader 4' },
      { id: 'mt5', label: 'MT5', description: 'MetaTrader 5' },
      { id: 'both', label: 'Both MT4 & MT5', description: 'Use both platforms' },
      { id: 'planning', label: 'Planning to Use', description: 'Will set up soon' },
    ],
    isMultiSelect: false,
  },
  {
    id: 14,
    key: 'daily_availability',
    title: 'How much time can you dedicate to trading daily?',
    subtitle: 'Determines notification frequency and feature recommendations',
    options: [
      { id: 'full_time', label: 'Full-Time', description: 'Monitor most of the day' },
      { id: 'part_time_morning', label: 'Part-Time Morning', description: 'Trade early sessions' },
      { id: 'part_time_evening', label: 'Part-Time Evening', description: 'Trade after hours' },
      { id: 'weekend_only', label: 'Weekend Only', description: 'Weekend preparation and analysis' },
    ],
    isMultiSelect: false,
  },
  {
    id: 15,
    key: 'automation_preference',
    title: 'What level of automation do you prefer?',
    subtitle: 'How much do you want ChartWise to automate?',
    options: [
      { id: 'manual', label: 'Fully Manual', description: 'I make all decisions' },
      { id: 'semi_automated', label: 'Semi-Automated', description: 'Assist with decisions' },
      { id: 'highly_automated', label: 'Highly Automated', description: 'Automate most tasks' },
    ],
    isMultiSelect: false,
  },
];

export const TraderOnboardingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const store = useOnboardingStore();
  const [showWelcome, setShowWelcome] = useState(!store.hasStarted);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [profile, setProfile] = useState('');
  const [saving, setSaving] = useState(false);

  const currentQuestion = ONBOARDING_QUESTIONS[store.currentStep - 1];
  const progress = (store.currentStep / 15) * 100;

  const handleSelectOption = (optionId: string) => {
    if (currentQuestion) {
      store.setResponse(currentQuestion.key, optionId);
    }
  };

  const handleSelectMultiple = (optionId: string) => {
    if (currentQuestion) {
      const current = store.responses[currentQuestion.key as keyof typeof store.responses] || [];
      const updated = Array.isArray(current)
        ? current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
        : [optionId];
      store.setResponse(currentQuestion.key, updated);
    }
  };

  const handleNext = () => {
    if (store.canProceedToNext()) {
      if (store.currentStep < 15) {
        store.setCurrentStep(store.currentStep + 1);
      } else {
        completeOnboarding();
      }
    }
  };

  const handlePrevious = () => {
    if (store.currentStep > 1) {
      store.setCurrentStep(store.currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      const recs = personalizationEngine.generateRecommendations(store.responses);
      const prof = personalizationEngine.calculateTradingProfile(store.responses);
      const msg = personalizationEngine.generatePersonalizedMessage(
        store.responses.experience_level,
        store.responses.primary_goal
      );

      setRecommendations(recs);
      setProfile(prof);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Save trader profile
        await supabase.from('trader_profiles').upsert({
          user_id: user.id,
          ...store.responses,
        });

        // Save onboarding responses
        await supabase.from('onboarding_responses').upsert({
          user_id: user.id,
          ...Object.entries(store.responses).reduce((acc, [key, val], idx) => {
            acc[`question_${idx + 1}_${key}`] = val;
            return acc;
          }, {} as any),
        });

        // Save trader settings
        await supabase.from('trader_settings').upsert({
          user_id: user.id,
          ...recs,
        });
      }

      store.completeOnboarding();
    } catch (error) {
      console.error('Error saving onboarding:', error);
    } finally {
      setSaving(false);
    }
  };

  if (saving || recommendations) {
    if (saving) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#00d4ff" />
        </View>
      );
    }

    return (
      <OnboardingComplete
        profile={profile}
        message={personalizationEngine.generatePersonalizedMessage(
          store.responses.experience_level,
          store.responses.primary_goal
        )}
        recommendations={recommendations}
        onContinue={onComplete}
      />
    );
  }

  if (showWelcome) {
    return (
      <OnboardingWelcome
        onStart={() => {
          store.startOnboarding();
          setShowWelcome(false);
        }}
        onSkip={() => {
          store.completeOnboarding();
          onComplete();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <QuestionCard
        title={currentQuestion?.title || ''}
        subtitle={currentQuestion?.subtitle}
        options={currentQuestion?.options || []}
        selectedOptions={
          currentQuestion?.isMultiSelect
            ? store.responses[currentQuestion.key as keyof typeof store.responses] || []
            : store.responses[currentQuestion.key as keyof typeof store.responses] || ''
        }
        onSelect={handleSelectOption}
        onSelectMultiple={handleSelectMultiple}
        isMultiSelect={currentQuestion?.isMultiSelect}
        canProceed={store.canProceedToNext()}
        onNext={handleNext}
        onPrevious={store.currentStep > 1 ? handlePrevious : undefined}
        progress={progress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
