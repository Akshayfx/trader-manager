/**
 * Trading Store - Zustand
 * Manages trading state, positions, and calculations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent } from '../services/analytics';

export interface TradePlan {
  symbol: string;
  direction: 'buy' | 'sell' | 'auto';
  entryType: 'market' | 'pending';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskType: 'percent' | 'money';
  riskPercent: number;
  riskMoney: number;
  lotSize: number;
  slPips: number;
  tpPips: number;
}

export interface PartialTPLevel {
  id: number;
  type: 'pips' | 'price';
  value: number;
  price: number;
  percent: number;
  triggered: boolean;
}

export interface Position {
  id: string;
  symbol: string;
  direction: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  lotSize: number;
  stopLoss: number;
  takeProfit: number;
  openTime: string;
  profit: number;
  profitPips: number;
}

interface TradingState {
  // Connection
  isConnected: boolean;
  mtVersion: 'mt4' | 'mt5' | null;
  magicKey: string;
  
  // Account
  accountBalance: number;
  openPL: number;
  positionCount: number;
  
  // Market Data
  currentSymbol: string;
  currentPrice: number;
  
  // Trade Plan
  tradePlan: TradePlan;
  
  // Features State
  autoBE: boolean;
  partialTP: boolean;
  targetDefault: boolean;
  
  // Partial TP Levels
  partialTPLevels: PartialTPLevel[];
  
  // Positions
  positions: Position[];
  
  // Prop Firm
  propFirmEnabled: boolean;
  dailyLoss: number;
  dailyLossLimit: number;
  
  // Actions
  setConnected: (connected: boolean, version?: 'mt4' | 'mt5') => void;
  setMagicKey: (key: string) => void;
  updateAccount: (balance: number, pl: number, positions: number) => void;
  updateMarketData: (symbol: string, price: number) => void;
  updateTradePlan: (plan: Partial<TradePlan>) => void;
  toggleAutoBE: () => void;
  togglePartialTP: () => void;
  toggleTargetDefault: () => void;
  updatePartialTPLevels: (levels: PartialTPLevel[]) => void;
  setPositions: (positions: Position[]) => void;
  closePosition: (id: string) => void;
  closeAllPositions: () => void;
  closePartialPosition: (id: string, percent: number) => void;
  moveSLToBE: (id: string) => void;
  setPropFirmEnabled: (enabled: boolean) => void;
  updateDailyLoss: (loss: number) => void;
  resetDailyLoss: () => void;
}

const defaultTradePlan: TradePlan = {
  symbol: 'EURUSD',
  direction: 'auto',
  entryType: 'market',
  entryPrice: 0,
  stopLoss: 0,
  takeProfit: 0,
  riskType: 'percent',
  riskPercent: 2,
  riskMoney: 100,
  lotSize: 0.01,
  slPips: 0,
  tpPips: 0,
};

const defaultPartialTPLevels: PartialTPLevel[] = [
  { id: 1, type: 'pips', value: 30, price: 0, percent: 50, triggered: false },
  { id: 2, type: 'pips', value: 50, price: 0, percent: 30, triggered: false },
  { id: 3, type: 'pips', value: 80, price: 0, percent: 20, triggered: false },
];

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      mtVersion: null,
      magicKey: 'CHARTWISE_001',
      accountBalance: 10000,
      openPL: 0,
      positionCount: 0,
      currentSymbol: 'EURUSD',
      currentPrice: 1.08500,
      tradePlan: defaultTradePlan,
      autoBE: false,
      partialTP: false,
      targetDefault: false,
      partialTPLevels: defaultPartialTPLevels,
      positions: [],
      propFirmEnabled: false,
      dailyLoss: 0,
      dailyLossLimit: 500,

      setConnected: (connected, version) => {
        set({ isConnected: connected, mtVersion: version || null });
        trackEvent(connected ? 'mt_connected' : 'mt_disconnected', { version });
      },

      setMagicKey: (key) => set({ magicKey: key }),

      updateAccount: (balance, pl, positions) => {
        set({ accountBalance: balance, openPL: pl, positionCount: positions });
      },

      updateMarketData: (symbol, price) => {
        set({ currentSymbol: symbol, currentPrice: price });
      },

      updateTradePlan: (plan) => {
        set((state) => ({
          tradePlan: { ...state.tradePlan, ...plan },
        }));
      },

      toggleAutoBE: () => {
        const newState = !get().autoBE;
        set({ autoBE: newState });
        trackEvent(newState ? 'autobe_enabled' : 'autobe_disabled');
      },

      togglePartialTP: () => {
        const newState = !get().partialTP;
        set({ partialTP: newState });
        trackEvent(newState ? 'partialtp_enabled' : 'partialtp_disabled');
      },

      toggleTargetDefault: () => {
        const newState = !get().targetDefault;
        set({ targetDefault: newState });
        trackEvent(newState ? 'target_default_enabled' : 'target_default_disabled');
      },

      updatePartialTPLevels: (levels) => {
        set({ partialTPLevels: levels });
      },

      setPositions: (positions) => set({ positions }),

      closePosition: (id) => {
        const position = get().positions.find(p => p.id === id);
        if (position) {
          trackEvent('position_closed', { 
            symbol: position.symbol, 
            profit: position.profit 
          });
        }
        set((state) => ({
          positions: state.positions.filter(p => p.id !== id),
        }));
      },

      closeAllPositions: () => {
        trackEvent('close_all_positions', { count: get().positions.length });
        set({ positions: [] });
      },

      closePartialPosition: (id, percent) => {
        trackEvent('partial_close', { positionId: id, percent });
        // Implementation would communicate with MT4/MT5
      },

      moveSLToBE: (id) => {
        trackEvent('sl_to_be', { positionId: id });
        set((state) => ({
          positions: state.positions.map(p =>
            p.id === id ? { ...p, stopLoss: p.entryPrice } : p
          ),
        }));
      },

      setPropFirmEnabled: (enabled) => {
        set({ propFirmEnabled: enabled });
        trackEvent(enabled ? 'propfirm_enabled' : 'propfirm_disabled');
      },

      updateDailyLoss: (loss) => {
        set({ dailyLoss: loss });
      },

      resetDailyLoss: () => {
        set({ dailyLoss: 0 });
      },
    }),
    {
      name: 'chartwise-trading-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        magicKey: state.magicKey,
        tradePlan: state.tradePlan,
        autoBE: state.autoBE,
        partialTP: state.partialTP,
        targetDefault: state.targetDefault,
        partialTPLevels: state.partialTPLevels,
        propFirmEnabled: state.propFirmEnabled,
        dailyLossLimit: state.dailyLossLimit,
      }),
    }
  )
);
