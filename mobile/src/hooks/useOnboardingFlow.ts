import { useCallback } from 'react';
import { useOnboardingStore } from '../store/onboardingStore';
import { personalizationEngine } from '../services/personalizationEngine';
import { supabase } from '../services/api';

export const useOnboardingFlow = () => {
  const store = useOnboardingStore();

  const completeOnboardingAndSave = useCallback(
    async (onSuccess?: () => void) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const recommendations = personalizationEngine.generateRecommendations(store.responses);
        const profile = personalizationEngine.calculateTradingProfile(store.responses);

        await Promise.all([
          supabase.from('trader_profiles').upsert({
            user_id: user.id,
            experience_level: store.responses.experience_level,
            primary_goal: store.responses.primary_goal,
            trading_style: store.responses.trading_style,
            preferred_sessions: JSON.stringify(store.responses.preferred_sessions),
            risk_tolerance: store.responses.risk_tolerance,
            trade_duration: store.responses.trade_duration,
            account_size_range: store.responses.account_size_range,
            risk_per_trade: store.responses.risk_per_trade,
            trading_instruments: JSON.stringify(store.responses.trading_instruments),
            main_challenge: store.responses.main_challenge,
            preferred_features: JSON.stringify(store.responses.preferred_features),
            prop_firm_participation: store.responses.prop_firm_participation,
            current_platform: store.responses.current_platform,
            daily_availability: store.responses.daily_availability,
            automation_preference: store.responses.automation_preference,
          }),

          supabase.from('onboarding_responses').upsert({
            user_id: user.id,
            question_1_experience: store.responses.experience_level,
            question_2_goal: store.responses.primary_goal,
            question_3_style: store.responses.trading_style,
            question_4_sessions: JSON.stringify(store.responses.preferred_sessions),
            question_5_risk: store.responses.risk_tolerance,
            question_6_duration: store.responses.trade_duration,
            question_7_account_size: store.responses.account_size_range,
            question_8_risk_per_trade: store.responses.risk_per_trade,
            question_9_instruments: JSON.stringify(store.responses.trading_instruments),
            question_10_challenge: store.responses.main_challenge,
            question_11_features: JSON.stringify(store.responses.preferred_features),
            question_12_prop_firm: store.responses.prop_firm_participation,
            question_13_platform: store.responses.current_platform,
            question_14_availability: store.responses.daily_availability,
            question_15_automation: store.responses.automation_preference,
          }),

          supabase.from('trader_settings').upsert({
            user_id: user.id,
            recommended_risk_per_trade: recommendations.recommended_risk_per_trade,
            recommended_position_size: recommendations.recommended_position_size,
            auto_breakeven_enabled: recommendations.auto_breakeven_enabled,
            partial_tp_enabled: recommendations.partial_tp_enabled,
            news_protection_enabled: recommendations.news_protection_enabled,
            ai_aggressiveness: recommendations.ai_aggressiveness,
            trailing_stop_enabled: recommendations.trailing_stop_enabled,
            prop_firm_mode_enabled: recommendations.prop_firm_mode_enabled,
            default_take_profit_level: recommendations.default_take_profit_level,
            default_stop_loss_level: recommendations.default_stop_loss_level,
            preferred_indicators: JSON.stringify(recommendations.preferred_indicators),
            notification_preferences: JSON.stringify(recommendations.notification_preferences),
          }),
        ]);

        store.completeOnboarding();
        onSuccess?.();
      } catch (error) {
        console.error('Error completing onboarding:', error);
        throw error;
      }
    },
    [store]
  );

  const resetOnboarding = useCallback(() => {
    store.resetOnboarding();
  }, [store]);

  const getOnboardingStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return null;

      const { data } = await supabase
        .from('trader_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      return data;
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
      return null;
    }
  }, []);

  const loadOnboardingData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return null;

      const { data } = await supabase
        .from('onboarding_responses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        store.setAllResponses({
          experience_level: data.question_1_experience,
          primary_goal: data.question_2_goal,
          trading_style: data.question_3_style,
          preferred_sessions: JSON.parse(data.question_4_sessions || '[]'),
          risk_tolerance: data.question_5_risk,
          trade_duration: data.question_6_duration,
          account_size_range: data.question_7_account_size,
          risk_per_trade: data.question_8_risk_per_trade,
          trading_instruments: JSON.parse(data.question_9_instruments || '[]'),
          main_challenge: data.question_10_challenge,
          preferred_features: JSON.parse(data.question_11_features || '[]'),
          prop_firm_participation: data.question_12_prop_firm,
          current_platform: data.question_13_platform,
          daily_availability: data.question_14_availability,
          automation_preference: data.question_15_automation,
        });
        store.completeOnboarding();
      }

      return data;
    } catch (error) {
      console.error('Error loading onboarding data:', error);
      return null;
    }
  }, [store]);

  return {
    completeOnboardingAndSave,
    resetOnboarding,
    getOnboardingStatus,
    loadOnboardingData,
    isCompleted: store.isCompleted,
    currentStep: store.currentStep,
  };
};
