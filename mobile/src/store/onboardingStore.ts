import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist } from 'zustand/middleware';

export interface OnboardingState {
  currentStep: number;
  responses: {
    experience_level: string;
    primary_goal: string;
    trading_style: string;
    preferred_sessions: string[];
    risk_tolerance: string;
    trade_duration: string;
    account_size_range: string;
    risk_per_trade: number;
    trading_instruments: string[];
    main_challenge: string;
    preferred_features: string[];
    prop_firm_participation: string;
    current_platform: string;
    daily_availability: string;
    automation_preference: string;
  };
  isCompleted: boolean;
  hasStarted: boolean;
  setCurrentStep: (step: number) => void;
  setResponse: (key: string, value: any) => void;
  setAllResponses: (responses: any) => void;
  completeOnboarding: () => void;
  startOnboarding: () => void;
  resetOnboarding: () => void;
  getProgress: () => number;
  canProceedToNext: () => boolean;
}

const initialResponses = {
  experience_level: '',
  primary_goal: '',
  trading_style: '',
  preferred_sessions: [],
  risk_tolerance: '',
  trade_duration: '',
  account_size_range: '',
  risk_per_trade: 1,
  trading_instruments: [],
  main_challenge: '',
  preferred_features: [],
  prop_firm_participation: '',
  current_platform: '',
  daily_availability: '',
  automation_preference: '',
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      responses: initialResponses,
      isCompleted: false,
      hasStarted: false,

      setCurrentStep: (step: number) => {
        if (step >= 0 && step <= 15) {
          set({ currentStep: step });
        }
      },

      setResponse: (key: string, value: any) => {
        set((state) => ({
          responses: {
            ...state.responses,
            [key]: value,
          },
        }));
      },

      setAllResponses: (responses: any) => {
        set({ responses });
      },

      startOnboarding: () => {
        set({ hasStarted: true, currentStep: 1 });
      },

      completeOnboarding: () => {
        set({ isCompleted: true, currentStep: 16 });
      },

      resetOnboarding: () => {
        set({
          currentStep: 0,
          responses: initialResponses,
          isCompleted: false,
          hasStarted: false,
        });
      },

      getProgress: () => {
        const { currentStep } = get();
        return Math.round((currentStep / 15) * 100);
      },

      canProceedToNext: () => {
        const { currentStep, responses } = get();

        const validations: Record<number, boolean> = {
          1: !!responses.experience_level,
          2: !!responses.primary_goal,
          3: !!responses.trading_style,
          4: responses.preferred_sessions.length > 0,
          5: !!responses.risk_tolerance,
          6: !!responses.trade_duration,
          7: !!responses.account_size_range,
          8: responses.risk_per_trade > 0,
          9: responses.trading_instruments.length > 0,
          10: !!responses.main_challenge,
          11: responses.preferred_features.length > 0,
          12: !!responses.prop_firm_participation,
          13: !!responses.current_platform,
          14: !!responses.daily_availability,
          15: !!responses.automation_preference,
        };

        return validations[currentStep] ?? true;
      },
    }),
    {
      name: 'onboarding-storage',
      storage: {
        getItem: async (name) => {
          const data = await AsyncStorage.getItem(name);
          return data ? JSON.parse(data) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
