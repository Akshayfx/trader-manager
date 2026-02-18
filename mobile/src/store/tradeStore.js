import { create } from 'zustand';

export const useTradeStore = create((set, get) => ({
  // Market data
  currentSymbol: 'EURUSD',
  currentPrice: 1.08500,
  pointValue: 0.00001,
  pipValue: 0.0001,
  
  // Trade plan
  tradePlan: {
    symbol: 'AUTO',
    direction: 'auto',
    entryType: 'market',
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    riskType: 'percent',
    riskPercent: 2,
    riskMoney: 100,
    slPips: 0,
    tpPips: 0,
    calculatedLotSize: 0,
  },
  
  // Account info
  accountBalance: 10000,
  openPL: 0,
  positionCount: 0,
  dailyLoss: 0,
  
  // Feature states
  autoBE: false,
  activePartialTP: false,
  partialTPMode: 'pips',
  
  // Partial TP levels
  partialTPLevels: [
    { id: 1, type: 'pips', value: 30, percent: 50, price: 0 },
    { id: 2, type: 'pips', value: 50, percent: 30, price: 0 },
    { id: 3, type: 'pips', value: 80, percent: 20, price: 0 },
  ],
  
  // Settings
  settings: {
    risk: {
      defaultRiskPercent: 2,
      defaultRiskMoney: 100,
      riskType: 'percent',
    },
    autoBreakeven: {
      enabled: false,
      triggerPips: 20,
      plusPips: 5,
    },
    customClose: {
      defaultPercent: 50,
    },
    news: {
      enabled: true,
      currencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'],
      impactLevels: ['high', 'medium'],
      minutesBefore: 15,
    },
    propFirm: {
      enabled: false,
      dailyLossPercent: 4.5,
      newsBlock: true,
    },
  },

  // Actions
  setTradePlan: (plan) => set((state) => ({
    tradePlan: { ...state.tradePlan, ...plan }
  })),
  
  setMarketData: (data) => set({
    currentSymbol: data.symbol || get().currentSymbol,
    currentPrice: data.bid || get().currentPrice,
    pointValue: data.point || get().pointValue,
    pipValue: data.pipSize || get().pipValue,
  }),
  
  setAccountData: (data) => set({
    accountBalance: data.balance || get().accountBalance,
    openPL: data.openPL !== undefined ? data.openPL : get().openPL,
    positionCount: data.positions !== undefined ? data.positions : get().positionCount,
  }),
  
  toggleAutoBE: () => set((state) => ({ autoBE: !state.autoBE })),
  
  togglePartialTP: () => set((state) => ({ activePartialTP: !state.activePartialTP })),
  
  setPartialTPMode: (mode) => set({ partialTPMode: mode }),
  
  updatePartialTPLevels: (levels) => set({ partialTPLevels: levels }),
  
  calculateLotSize: () => {
    const { tradePlan, accountBalance, currentSymbol } = get();
    const { slPips, riskType, riskPercent, riskMoney } = tradePlan;
    
    let riskAmount = riskType === 'percent' 
      ? accountBalance * (riskPercent / 100)
      : riskMoney;
    
    let lotSize = 0;
    if (slPips > 0) {
      const riskPerLot = slPips * 10;
      lotSize = riskAmount / riskPerLot;
      lotSize = Math.floor(lotSize * 100) / 100;
    }
    
    set((state) => ({
      tradePlan: { ...state.tradePlan, calculatedLotSize: lotSize }
    }));
    
    return lotSize;
  },
}));
