/**
 * ChartWise Mobile - Zustand Store v3.0
 * State management with theme support
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStore = create(
  persist(
    (set, get) => ({
      // Auth state
      isLoggedIn: false,
      user: null,
      token: null,
      
      // Connection state
      isConnected: false,
      mtConnected: false,
      mtVersion: null,
      socket: null,
      
      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      
      // Settings
      settings: {
        display: {
          showBalance: true,
          showPL: true,
          showPositions: true,
        },
        theme: 'dark',
        ai: {
          enabled: true,
          model: 'balanced',
          realTimeSuggestions: true,
          autoExecute: false,
          conditions: [],
        },
        risk: {
          defaultRiskPercent: 2,
          maxOpenPositions: 5,
          dailyLossLimit: 500,
        },
        autoBreakeven: {
          enabled: false,
          triggerPips: 20,
          plusPips: 5,
          protectPartial: true,
        },
        partialTP: {
          enabled: true,
          levels: [
            { pips: 30, percent: 50 },
            { pips: 50, percent: 30 },
            { pips: 80, percent: 20 },
          ],
        },
        customClose: {
          presets: [25, 33, 50, 75],
        },
        news: {
          enabled: true,
          autoProtect: true,
          minutesBefore: 15,
          closePercent: 50,
          currencies: ['USD', 'EUR', 'GBP'],
          impactLevels: ['high', 'medium'],
        },
        propFirm: {
          enabled: false,
          provider: 'custom',
          accountType: 'challenge',
          dailyLossLimit: 500,
          maxDrawdown: 1000,
          profitTarget: 1000,
          autoClose: true,
          newsBlock: true,
          maxHoldTime: 0,
          weekendClose: false,
        },
        mtConnection: {
          autoConnect: true,
          preferredVersion: 'auto',
          magicKey: 'CHARTWISE_001',
          reconnectInterval: 5000,
        },
      },
      
      // Actions
      setLoggedIn: (value) => set({ isLoggedIn: value }),
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setConnected: (value) => set({ isConnected: value }),
      setMTConnected: (value) => set({ mtConnected: value }),
      setSocket: (socket) => set({ socket }),
      
      setSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings } 
      })),
      
      updateSettings: (category, key, value) => set((state) => ({
        settings: {
          ...state.settings,
          [category]: {
            ...state.settings[category],
            [key]: value,
          },
        },
      })),
      
      // Trade state
      tradePlan: {
        symbol: 'AUTO',
        direction: 'buy',
        entryType: 'market',
        entryPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        riskPercent: 2,
        lotSize: 0,
      },
      setTradePlan: (plan) => set({ tradePlan: plan }),
      
      // Partial TP levels
      partialTPLevels: [
        { id: 1, pips: 30, percent: 50 },
        { id: 2, pips: 50, percent: 30 },
        { id: 3, pips: 80, percent: 20 },
      ],
      setPartialTPLevels: (levels) => set({ partialTPLevels: levels }),
      addPartialTPLevel: () => set((state) => {
        const newId = Math.max(...state.partialTPLevels.map(l => l.id), 0) + 1;
        return {
          partialTPLevels: [...state.partialTPLevels, { id: newId, pips: 40, percent: 25 }],
        };
      }),
      removePartialTPLevel: (id) => set((state) => ({
        partialTPLevels: state.partialTPLevels.filter(l => l.id !== id),
      })),
      
      // Account info
      accountBalance: 0,
      openPL: 0,
      positionCount: 0,
      setAccountInfo: (info) => set({ 
        accountBalance: info.balance,
        openPL: info.openPL,
        positionCount: info.positions,
      }),
      
      // News
      newsAlert: null,
      setNewsAlert: (alert) => set({ newsAlert: alert }),
      
      // Lock state
      isLocked: true,
      setIsLocked: (value) => set({ isLocked: value }),
      toggleLock: () => set((state) => ({ isLocked: !state.isLocked })),
      
      // Auto BE
      autoBE: false,
      setAutoBE: (value) => set({ autoBE: value }),
      toggleAutoBE: () => set((state) => ({ autoBE: !state.autoBE })),
    }),
    {
      name: 'chartwise-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
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
