/**
 * Settings Store - Zustand
 * Manages app settings and preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NewsSettings {
  enabled: boolean;
  currencies: string[];
  impactLevels: ('low' | 'medium' | 'high')[];
  minutesBefore: number;
}

interface AutoBESettings {
  enabled: boolean;
  triggerPips: number;
  plusPips: number;
  slPosition: 'entry' | 'profit';
  protectPartial: boolean;
}

interface TargetSettings {
  enabled: boolean;
  mode: 'rr' | 'fixed' | 'pips';
  rr: number;
  money: number;
  pips: number;
  autoApply: boolean;
  minRR: number;
}

interface CustomCloseSettings {
  defaultPercent: number;
  presets: number[];
}

interface PropFirmSettings {
  enabled: boolean;
  dailyLossLimit: number;
  dailyLossPercent: number;
  preventNewTrades: boolean;
  closeOnLimit: boolean;
  newsBlock: boolean;
  includeFloating: boolean;
}

interface AISettings {
  enabled: boolean;
  model: 'balanced' | 'conservative' | 'aggressive' | 'scalper' | 'swing';
  autoReports: boolean;
  reportsThisWeek: number;
  lastReportDate: string | null;
}

interface DisplaySettings {
  showBalance: boolean;
  showPL: boolean;
  showPositions: boolean;
}

interface SettingsState {
  display: DisplaySettings;
  news: NewsSettings;
  autoBE: AutoBESettings;
  target: TargetSettings;
  customClose: CustomCloseSettings;
  propFirm: PropFirmSettings;
  ai: AISettings;
  
  // Actions
  updateDisplay: (settings: Partial<DisplaySettings>) => void;
  updateNews: (settings: Partial<NewsSettings>) => void;
  updateAutoBE: (settings: Partial<AutoBESettings>) => void;
  updateTarget: (settings: Partial<TargetSettings>) => void;
  updateCustomClose: (settings: Partial<CustomCloseSettings>) => void;
  updatePropFirm: (settings: Partial<PropFirmSettings>) => void;
  updateAI: (settings: Partial<AISettings>) => void;
  resetAllSettings: () => void;
}

const defaultSettings = {
  display: {
    showBalance: true,
    showPL: true,
    showPositions: true,
  },
  news: {
    enabled: true,
    currencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'],
    impactLevels: ['high', 'medium'] as ('low' | 'medium' | 'high')[],
    minutesBefore: 15,
  },
  autoBE: {
    enabled: false,
    triggerPips: 20,
    plusPips: 2,
    slPosition: 'entry' as const,
    protectPartial: true,
  },
  target: {
    enabled: false,
    mode: 'rr' as const,
    rr: 2,
    money: 100,
    pips: 40,
    autoApply: true,
    minRR: 1,
  },
  customClose: {
    defaultPercent: 50,
    presets: [25, 33, 50, 75],
  },
  propFirm: {
    enabled: false,
    dailyLossLimit: 500,
    dailyLossPercent: 4.5,
    preventNewTrades: true,
    closeOnLimit: false,
    newsBlock: true,
    includeFloating: true,
  },
  ai: {
    enabled: true,
    model: 'balanced' as const,
    autoReports: true,
    reportsThisWeek: 0,
    lastReportDate: null,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateDisplay: (settings) => {
        set((state) => ({ display: { ...state.display, ...settings } }));
      },

      updateNews: (settings) => {
        set((state) => ({ news: { ...state.news, ...settings } }));
      },

      updateAutoBE: (settings) => {
        set((state) => ({ autoBE: { ...state.autoBE, ...settings } }));
      },

      updateTarget: (settings) => {
        set((state) => ({ target: { ...state.target, ...settings } }));
      },

      updateCustomClose: (settings) => {
        set((state) => ({ customClose: { ...state.customClose, ...settings } }));
      },

      updatePropFirm: (settings) => {
        set((state) => ({ propFirm: { ...state.propFirm, ...settings } }));
      },

      updateAI: (settings) => {
        set((state) => ({ ai: { ...state.ai, ...settings } }));
      },

      resetAllSettings: () => {
        set(defaultSettings);
      },
    }),
    {
      name: 'chartwise-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
