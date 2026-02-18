/**
 * ChartWise Desktop App - Renderer Process v3.0
 * Smartphone-like layout with trade calculator, partial TP, and theme support
 */

const { ipcRenderer } = require('electron');

const API_BASE_URL = 'http://localhost:3001/api';

// App State
const state = {
  isLoggedIn: false,
  user: null,
  token: null,
  isLocked: true,
  isConnected: false,
  mtConnected: false,
  mtVersion: null,
  autoBE: false,
  theme: 'dark',
  accountBalance: 10000,
  openPL: 0,
  positionCount: 0,
  dailyLoss: 0,  // Track daily loss for prop firm mode
  
  // Current market data from MT4
  currentSymbol: 'EURUSD',
  currentPrice: 1.08500,
  pointValue: 0.00001,
  pipValue: 0.0001,
  tickValue: 1,  // Value per tick in account currency
  contractSize: 100000,  // Standard lot size
  
  // Trade calculator state (Magic Keys style)
  tradePlan: {
    symbol: 'AUTO',
    direction: 'auto',  // 'auto' = detect from SL position, 'buy', 'sell'
    entryType: 'market',
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    riskType: 'percent',  // 'percent' or 'money'
    riskPercent: 2,
    riskMoney: 100,
    slPips: 0,
    tpPips: 0,
    calculatedLotSize: 0
  },
  
  // Partial TP levels - can be price or pips based
  partialTPLevels: [
    { id: 1, type: 'pips', value: 30, percent: 50, price: 0 },
    { id: 2, type: 'pips', value: 50, percent: 30, price: 0 },
    { id: 3, type: 'pips', value: 80, percent: 20, price: 0 }
  ],
  
  // Active partial TP mode
  activePartialTP: false,
  partialTPMode: 'pips',  // 'pips' or 'price'
  
  // Custom close
  customCloseDefault: 50,  // Default % to close on single click
  
  // Target default
  targetDefault: {
    enabled: false,
    type: 'rr',  // 'rr' or 'money'
    rr: 2,
    money: 200
  },
  
  // Long press tracking
  longPressTimer: null,
  longPressDuration: 800,  // ms
  
  settings: {
    display: {
      showBalance: true,
      showPL: true,
      showPositions: true
    },
    theme: 'dark',
    ai: { 
      enabled: true,
      model: 'balanced', 
      autoReports: true,
      userBehaviorAnalysis: true,
      reportsThisWeek: 0,
      lastReportDate: null,
      weeklyReportDay: 0,  // Sunday
      monthlyReportDay: 1  // 1st of month
    },
    risk: { 
      defaultRiskPercent: 2, 
      defaultRiskMoney: 100,
      riskType: 'percent',
      maxOpenPositions: 5, 
      dailyLossLimit: 500 
    },
    autoBreakeven: { 
      enabled: false, 
      triggerPips: 20, 
      plusPips: 2, 
      slPosition: 'entry',  // 'entry' or 'profit'
      protectPartial: true 
    },
    partialTP: { 
      enabled: true,
      mode: 'pips',
      defaultLevels: [
        { type: 'pips', value: 30, percent: 50 },
        { type: 'pips', value: 50, percent: 30 },
        { type: 'pips', value: 80, percent: 20 }
      ]
    },
    customClose: {
      defaultPercent: 50,
      presets: [25, 33, 50, 75]
    },
    targetDefault: {
      enabled: false,
      mode: 'rr',  // 'rr', 'fixed', or 'pips'
      rr: 2,
      money: 100,
      pips: 40,
      autoApply: true,
      minRR: 1
    },
    news: { 
      enabled: true, 
      autoProtect: true, 
      minutesBefore: 15, 
      closePercent: 50,
      currencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'],
      impactLevels: ['high', 'medium']
    },
    propFirm: { 
      enabled: false, 
      dailyLossLimit: 500, 
      dailyLossPercent: 4.5,
      preventNewTrades: true,
      closeOpenTrades: false,
      newsBlock: true,
      includeFloating: true
    },
    mtConnection: { 
      autoConnect: true, 
      preferredVersion: 'auto', 
      magicKey: 'CHARTWISE_001',
      reconnectInterval: 5000,
      fixedLotSize: 0.0,
      fixedSL: 0
    }
  },
  
  // AI Trade Reports
  aiReports: [],
  currentReport: null,
  
  // User trading behavior (for AI analysis)
  userBehavior: {
    avgSLPips: 20,
    avgTPPips: 40,
    avgRR: 2,
    preferredPairs: [],
    tradeCount: 0,
    winRate: 0,
    avgTradeDuration: 0
  },
  
  newsAlert: null,
  newsCountdownInterval: null,
  aiConditions: []
};

// DOM Elements cache
const elements = {};

// Initialize DOM elements cache
function cacheElements() {
  const ids = [
    'loginScreen', 'mainApp', 'loginForm', 'loginUsername', 'loginPassword', 'loginError', 'registerBtn', 'googleLoginBtn',
    'connectionStatus', 'mtStatus', 'mtIndicator', 'lockIconSmall', 'accountInfoCompact',
    'balanceItem', 'plItem', 'positionsItem', 'accountBalance', 'openPL', 'positionCount',
    'planTradeBtn', 'sellTradeBtn', 'buyTradeBtn', 'partialTPBtn', 'customCloseBtn', 'closeHalfBtn',
    'slToBeBtn', 'autoBeBtn', 'autoBeIndicator', 'aiSettingsBtn', 'closeFullBtn', 'targetDefaultBtn',
    'displayLotSizeInput', 'lotSizeDisplay',
    'minimizeBtn', 'closeBtn', 'settingsBtn', 'themeBtn',
    'newsPanel', 'newsTitle', 'newsImpact', 'newsCountdown',
    'userInfo', 'logoutBtn', 'helpBtn',
    'settingsModal', 'closeSettings', 'cancelSettings', 'saveSettings',
    'showBalance', 'showPL', 'showPositions', 'themeSelect',
    'mtSettingsStatus', 'connectMT4Btn', 'connectMT5Btn', 'disconnectMTBtn', 'mtMagicKey', 'mtAutoConnect',
    'aiSettingsModal', 'closeAISettings', 'cancelAISettings', 'saveAISettings',
    'propFirmEnabled', 'propDailyLossLimit', 'propDailyLossPercent', 'propPreventNewTrades', 'propCloseOnLimit', 'propNewsBlock', 'propIncludeFloating',
    'todayLoss', 'remainingLimit', 'propStatusText',
    'confirmModal', 'confirmTitle', 'confirmMessage', 'cancelAction', 'confirmAction',
    // Plan Trade Modal
    'planTradeModal', 'closePlanTrade', 'cancelPlanTrade', 'confirmPlanTrade',
    'calcSymbolDisplay', 'currentPriceDisplay', 'calcBuyBtn', 'calcSellBtn',
    'marketEntryBtn', 'pendingEntryBtn', 'entryPriceInput',
    'calcSLInput', 'calcTPInput', 'calcRiskInput', 'slPipsDisplay', 'tpPipsDisplay',
    'calcLotSize', 'calcRiskAmount', 'calcRRRatio',
    'setSLPipsBtn', 'setTPPipsBtn', 'setRRBtn',
    'riskPercentBtn', 'riskMoneyBtn', 'riskInputLabel',
    'ptpModePips', 'ptpModePrice',
    // Open Trade Modal
    'openTradeModal', 'closeOpenTrade', 'cancelOpenTrade', 'executeTradeBtn',
    'execSymbol', 'execDirection', 'execEntry', 'execSL', 'execTP', 'execLotSize', 'execRisk',
    // Partial TP Modal
    'partialTPModal', 'closePartialTP', 'cancelPartialTP', 'savePartialTP',
    'tpLevelsContainer', 'addTPLevelBtn', 'ptpLinesDisplay',
    // Custom Close Modal
    'customCloseModal', 'closeCustomClose', 'customClosePercent', 'customCloseExecute',
    // AI Report
    'generateReportBtn', 'nextReportDate', 'reportUsage', 'aiWinRate', 'aiBestPair', 'aiAvgRR', 'aiTotalTrades',
    'insightsList', 'previousReportsList', 'aiAutoReports'
  ];
  
  ids.forEach(id => {
    elements[id] = document.getElementById(id);
  });
  
  elements.tabBtns = document.querySelectorAll('.tab-btn');
  elements.tabContents = document.querySelectorAll('.tab-content');
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  loadTheme();
  checkSavedLogin();
  initializeEventListeners();
  updateTradeCalculator();
  renderPartialTPLevels();
  checkWeeklyReset();
  updateToggleGlowEffects();
  
  // Load saved AI reports
  const savedReports = localStorage.getItem('chartwise_ai_reports');
  if (savedReports) {
    state.aiReports = JSON.parse(savedReports);
  }
  
  // Load saved AI settings
  const savedAISettings = localStorage.getItem('chartwise_ai_settings');
  if (savedAISettings) {
    state.settings.ai = { ...state.settings.ai, ...JSON.parse(savedAISettings) };
  }
});

function initializeEventListeners() {
  // Login
  elements.loginForm?.addEventListener('submit', handleLogin);
  elements.registerBtn?.addEventListener('click', () => showNotification('Register', 'Registration coming soon'));
  elements.googleLoginBtn?.addEventListener('click', handleGoogleLogin);
  
  // Lock/Unlock
  elements.lockIconSmall?.addEventListener('click', toggleLock);
  
  // Main buttons - with long press support
  elements.planTradeBtn?.addEventListener('click', () => showModal('planTradeModal'));
  
  // Buy/Sell Trade buttons - execute directly with editable lot size
  elements.sellTradeBtn?.addEventListener('click', () => executeBuySellTrade('sell'));
  elements.buyTradeBtn?.addEventListener('click', () => executeBuySellTrade('buy'));
  
  // Editable lot size
  elements.displayLotSizeInput?.addEventListener('change', handleLotSizeChange);
  elements.displayLotSizeInput?.addEventListener('input', handleLotSizeInput);
  
  // Partial TP: Click = toggle, Long Press = settings
  addClickAndLongPress(elements.partialTPBtn, handlePartialTPClick, handlePartialTPLongPress);
  
  // Custom Close: Click = default close, Long Press = quick presets
  addClickAndLongPress(elements.customCloseBtn, handleCustomCloseClick, handleCustomCloseLongPress);
  
  elements.closeHalfBtn?.addEventListener('click', () => sendCommand('close_half'));
  elements.slToBeBtn?.addEventListener('click', () => sendCommand('sl_to_be'));
  
  // Auto BE: Click = toggle, Long Press = settings
  addClickAndLongPress(elements.autoBeBtn, handleAutoBEClick, handleAutoBELongPress);
  
  // Target Default button
  addClickAndLongPress(elements.targetDefaultBtn, handleTargetDefaultClick, handleTargetDefaultLongPress);
  
  elements.aiSettingsBtn?.addEventListener('click', () => {
    updateAIReportUI();
    showModal('aiSettingsModal');
  });
  elements.closeFullBtn?.addEventListener('click', () => confirmAction('Close All', 'Close ALL positions?', () => sendCommand('close_all')));
  
  // Window controls
  elements.minimizeBtn?.addEventListener('click', () => ipcRenderer.send('minimize-window'));
  elements.closeBtn?.addEventListener('click', () => ipcRenderer.send('close-window'));
  elements.settingsBtn?.addEventListener('click', () => showModal('settingsModal'));
  elements.themeBtn?.addEventListener('click', toggleTheme);
  
  // MT Status click - open MT tab in settings
  elements.mtStatus?.addEventListener('click', () => {
    showModal('settingsModal');
    switchTab('mt');
  });
  
  // Footer
  elements.logoutBtn?.addEventListener('click', handleLogout);
  elements.helpBtn?.addEventListener('click', () => sendCommand('help'));
  
  // Settings modal
  elements.closeSettings?.addEventListener('click', () => hideModal('settingsModal'));
  elements.cancelSettings?.addEventListener('click', () => hideModal('settingsModal'));
  elements.saveSettings?.addEventListener('click', saveSettings);
  
  // Display settings
  elements.showBalance?.addEventListener('change', updateDisplayVisibility);
  elements.showPL?.addEventListener('change', updateDisplayVisibility);
  elements.showPositions?.addEventListener('change', updateDisplayVisibility);
  elements.themeSelect?.addEventListener('change', (e) => setTheme(e.target.value));
  
  // AI Settings modal
  elements.closeAISettings?.addEventListener('click', () => hideModal('aiSettingsModal'));
  elements.cancelAISettings?.addEventListener('click', () => hideModal('aiSettingsModal'));
  elements.generateReportBtn?.addEventListener('click', generateAIReport);
  
  // Target Settings - mode toggle
  const targetMode = document.getElementById('targetMode');
  targetMode?.addEventListener('change', handleTargetModeChange);
  
  // Settings tabs
  elements.tabBtns?.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // MT Connection
  elements.connectMT4Btn?.addEventListener('click', () => connectMT('mt4'));
  elements.connectMT5Btn?.addEventListener('click', () => connectMT('mt5'));
  elements.disconnectMTBtn?.addEventListener('click', disconnectMT);
  
  // Confirm modal
  elements.cancelAction?.addEventListener('click', () => hideModal('confirmModal'));
  
  // Plan Trade Modal
  elements.closePlanTrade?.addEventListener('click', () => {
    hideModal('planTradeModal');
    clearVisualLines();
  });
  elements.cancelPlanTrade?.addEventListener('click', () => {
    hideModal('planTradeModal');
    clearVisualLines();
  });
  elements.confirmPlanTrade?.addEventListener('click', openTradeFromPlan);
  
  elements.marketEntryBtn?.addEventListener('click', () => setEntryType('market'));
  elements.pendingEntryBtn?.addEventListener('click', () => setEntryType('pending'));
  
  // Risk type toggle
  elements.riskPercentBtn?.addEventListener('click', () => setRiskType('percent'));
  elements.riskMoneyBtn?.addEventListener('click', () => setRiskType('money'));
  
  // Calculator inputs
  elements.calcSLInput?.addEventListener('input', updateCalculatorFromSL);
  elements.calcTPInput?.addEventListener('input', updateCalculatorFromTP);
  elements.calcRiskInput?.addEventListener('input', updateTradeCalculator);
  elements.entryPriceInput?.addEventListener('input', updateTradeCalculator);
  
  // Quick set buttons
  elements.setSLPipsBtn?.addEventListener('click', () => quickSetSL(20));
  elements.setTPPipsBtn?.addEventListener('click', () => quickSetTP(40));
  elements.setRRBtn?.addEventListener('click', () => quickSetRR(2));
  
  // PTP Mode toggle
  elements.ptpModePips?.addEventListener('click', () => setPartialTPMode('pips'));
  elements.ptpModePrice?.addEventListener('click', () => setPartialTPMode('price'));
  
  // Open Trade Modal
  elements.closeOpenTrade?.addEventListener('click', () => hideModal('openTradeModal'));
  elements.cancelOpenTrade?.addEventListener('click', () => hideModal('openTradeModal'));
  elements.executeTradeBtn?.addEventListener('click', executeTrade);
  
  // Partial TP Modal
  elements.closePartialTP?.addEventListener('click', () => hideModal('partialTPModal'));
  elements.cancelPartialTP?.addEventListener('click', () => hideModal('partialTPModal'));
  elements.savePartialTP?.addEventListener('click', savePartialTPLevels);
  elements.addTPLevelBtn?.addEventListener('click', addTPLevel);
  
  // Custom Close Modal
  elements.closeCustomClose?.addEventListener('click', () => hideModal('customCloseModal'));
  
  // Custom close preset buttons
  document.querySelectorAll('.close-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const percent = parseInt(btn.dataset.percent);
      executeCustomClose(percent);
    });
  });
  
  elements.customCloseExecute?.addEventListener('click', () => {
    const percent = parseInt(elements.customClosePercent.value);
    executeCustomClose(percent);
  });
}

// ==================== THEME ====================

function loadTheme() {
  const savedTheme = localStorage.getItem('chartwise_theme') || 'dark';
  setTheme(savedTheme);
}

function setTheme(theme) {
  state.theme = theme;
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('chartwise_theme', theme);
  
  // Update theme button icon
  if (elements.themeBtn) {
    elements.themeBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  }
  
  // Update theme select in settings
  if (elements.themeSelect) {
    elements.themeSelect.value = theme;
  }
}

function toggleTheme() {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// ==================== LOGIN / AUTH ====================

async function checkSavedLogin() {
  const savedToken = localStorage.getItem('chartwise_token');
  const savedUser = localStorage.getItem('chartwise_user');
  
  if (savedToken && savedUser) {
    state.token = savedToken;
    state.user = JSON.parse(savedUser);
    state.isLoggedIn = true;
    showMainApp();
    loadUserSettings();
    connectToServer();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const username = elements.loginUsername.value;
  const password = elements.loginPassword.value;
  const rememberMe = document.getElementById('rememberMe')?.checked;
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      state.token = data.token;
      state.user = data.user;
      state.isLoggedIn = true;
      
      if (rememberMe) {
        localStorage.setItem('chartwise_token', data.token);
        localStorage.setItem('chartwise_user', JSON.stringify(data.user));
      }
      
      showMainApp();
      loadUserSettings();
      connectToServer();
    } else {
      showLoginError(data.message || 'Login failed');
    }
  } catch (error) {
    showLoginError('Network error. Please try again.');
  }
}

function handleLogout() {
  state.token = null;
  state.user = null;
  state.isLoggedIn = false;
  
  localStorage.removeItem('chartwise_token');
  localStorage.removeItem('chartwise_user');
  
  elements.loginScreen.style.display = 'flex';
  elements.mainApp.style.display = 'none';
  
  ipcRenderer.send('disconnect-server');
}

function showMainApp() {
  elements.loginScreen.style.display = 'none';
  elements.mainApp.style.display = 'flex';
  
  if (state.user) {
    elements.userInfo.textContent = `${state.user.username}`;
  }
}

function showLoginError(message) {
  elements.loginError.textContent = message;
  elements.loginError.classList.add('visible');
  setTimeout(() => elements.loginError.classList.remove('visible'), 5000);
}

// ==================== GOOGLE LOGIN ====================

async function handleGoogleLogin() {
  try {
    // In a real implementation, this would open a Google OAuth popup
    // For now, we'll simulate a successful Google login
    showNotification('Google Login', 'Opening Google authentication...');
    
    // Simulate Google auth response
    const googleUser = {
      id: 'google_' + Date.now(),
      username: 'trader_' + Math.floor(Math.random() * 10000),
      email: 'trader@gmail.com',
      provider: 'google'
    };
    
    // Send to backend for verification and token generation
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleUser)
    });
    
    const data = await response.json();
    
    if (data.success) {
      state.token = data.token;
      state.user = data.user;
      state.isLoggedIn = true;
      
      localStorage.setItem('chartwise_token', data.token);
      localStorage.setItem('chartwise_user', JSON.stringify(data.user));
      
      showMainApp();
      loadUserSettings();
      connectToServer();
      showNotification('Welcome', `Logged in as ${data.user.username}`);
    } else {
      showLoginError(data.message || 'Google login failed');
    }
  } catch (error) {
    showLoginError('Google login error. Please try again.');
    console.error('Google login error:', error);
  }
}

// ==================== EDITABLE LOT SIZE ====================

function handleLotSizeChange(e) {
  const value = parseFloat(e.target.value);
  if (value > 0 && value <= 100) {
    state.settings.mtConnection.fixedLotSize = value;
    state.tradePlan.calculatedLotSize = value;
    showNotification('Lot Size', `Fixed lot size set to ${value.toFixed(2)}`);
  } else {
    e.target.value = state.settings.mtConnection.fixedLotSize || state.tradePlan.calculatedLotSize || 0.01;
    showNotification('Error', 'Lot size must be between 0.01 and 100');
  }
}

function handleLotSizeInput(e) {
  const value = parseFloat(e.target.value);
  if (value > 0 && value <= 100) {
    state.settings.mtConnection.fixedLotSize = value;
    state.tradePlan.calculatedLotSize = value;
  }
}

// ==================== PIP VALUE CALCULATOR BASED ON PAIR ====================

// Get pip size and value based on symbol
function getPipInfo(symbol) {
  symbol = symbol.toUpperCase();
  
  // XAUUSD (Gold) - 1 USD move = 10 pips
  if (symbol.includes('XAU') || symbol.includes('GOLD')) {
    return { pipSize: 0.1, pipValue: 0.1, digits: 1, isJPY: false, isXAU: true };
  }
  
  // XAGUSD (Silver)
  if (symbol.includes('XAG') || symbol.includes('SILVER')) {
    return { pipSize: 0.01, pipValue: 0.01, digits: 2, isJPY: false, isXAG: true };
  }
  
  // JPY pairs - pip is 0.01 (2nd decimal)
  if (symbol.includes('JPY')) {
    return { pipSize: 0.01, pipValue: 0.01, digits: 2, isJPY: true, isXAU: false };
  }
  
  // Crypto pairs (BTC, ETH)
  if (symbol.includes('BTC') || symbol.includes('ETH')) {
    return { pipSize: 1, pipValue: 1, digits: 0, isCrypto: true, isXAU: false };
  }
  
  // Default forex pairs - pip is 0.0001 (4th decimal)
  return { pipSize: 0.0001, pipValue: 0.0001, digits: 4, isJPY: false, isXAU: false };
}

// Calculate pips between two prices
function calculatePips(price1, price2, symbol) {
  const pipInfo = getPipInfo(symbol);
  return Math.abs(price1 - price2) / pipInfo.pipSize;
}

// Format price based on symbol digits
function formatPrice(price, symbol) {
  const pipInfo = getPipInfo(symbol);
  return price.toFixed(pipInfo.digits);
}

// ==================== SMART DIRECTION DETECTION ====================

// Auto-detect trade direction based on SL position relative to market price
function detectTradeDirection() {
  const slPrice = state.tradePlan.stopLoss;
  const entryPrice = state.tradePlan.entryType === 'market' 
    ? state.currentPrice 
    : state.tradePlan.entryPrice || state.currentPrice;
  
  if (slPrice <= 0) return state.tradePlan.direction;
  
  // If SL is above entry price → SELL (stop loss for sell is above entry)
  // If SL is below entry price → BUY (stop loss for buy is below entry)
  const direction = slPrice > entryPrice ? 'sell' : 'buy';
  
  // Update state and UI
  state.tradePlan.direction = direction;
  updateDirectionUI(direction);
  
  return direction;
}

function updateDirectionUI(direction) {
  elements.calcBuyBtn?.classList.toggle('active', direction === 'buy');
  elements.calcSellBtn?.classList.toggle('active', direction === 'sell');
  
  // Update direction indicator
  const dirIndicator = document.getElementById('directionIndicator');
  if (dirIndicator) {
    dirIndicator.textContent = direction.toUpperCase();
    dirIndicator.className = direction === 'buy' ? 'direction-buy' : 'direction-sell';
  }
}

// ==================== MAGIC KEYS STYLE TRADE CALCULATOR ====================

function setEntryType(type) {
  state.tradePlan.entryType = type;
  elements.marketEntryBtn?.classList.toggle('active', type === 'market');
  elements.pendingEntryBtn?.classList.toggle('active', type === 'pending');
  if (elements.entryPriceRow) {
    elements.entryPriceRow.style.display = type === 'pending' ? 'flex' : 'none';
  }
}

function setDirection(direction) {
  state.tradePlan.direction = direction;
  updateDirectionUI(direction);
  updateTradeCalculator();
}

function setRiskType(type) {
  state.tradePlan.riskType = type;
  
  // Update button states
  if (elements.riskPercentBtn) {
    elements.riskPercentBtn.classList.toggle('active', type === 'percent');
  }
  if (elements.riskMoneyBtn) {
    elements.riskMoneyBtn.classList.toggle('active', type === 'money');
  }
  
  // Update label and input
  if (elements.riskInputLabel) {
    elements.riskInputLabel.textContent = type === 'percent' ? 'Risk %' : 'Risk $';
  }
  if (elements.calcRiskInput) {
    elements.calcRiskInput.value = type === 'percent' 
      ? state.tradePlan.riskPercent 
      : state.tradePlan.riskMoney;
    elements.calcRiskInput.min = type === 'percent' ? '0.1' : '1';
    elements.calcRiskInput.max = type === 'percent' ? '100' : '10000';
  }
  
  updateTradeCalculator();
}

// Execute Buy/Sell trade directly with editable lot size
function executeBuySellTrade(direction) {
  // Check if we have SL set (only if using calculated lot size)
  const useFixedLotSize = state.settings.mtConnection.fixedLotSize > 0;
  
  if (!useFixedLotSize && state.tradePlan.stopLoss <= 0) {
    showNotification('Error', 'Please set Stop Loss in Plan Trade first');
    showModal('planTradeModal');
    return;
  }
  
  // Check prop firm restrictions before trading
  if (!checkPropFirmBeforeTrade()) {
    return;
  }
  
  // Set direction
  state.tradePlan.direction = direction;
  
  // Check prop firm restrictions
  if (state.settings.propFirm.enabled) {
    if (!checkPropFirmRestrictions()) {
      return;
    }
  }
  
  // Execute trade
  const lotSize = state.tradePlan.calculatedLotSize > 0 
    ? state.tradePlan.calculatedLotSize 
    : state.settings.mtConnection.fixedLotSize;
  
  if (lotSize <= 0) {
    showNotification('Error', 'Lot size not calculated. Please check Plan Trade settings.');
    return;
  }
  
  sendCommand('open_trade', {
    symbol: state.tradePlan.symbol === 'AUTO' ? state.currentSymbol : state.tradePlan.symbol,
    direction: direction,
    entryType: 'market',
    entryPrice: state.currentPrice,
    stopLoss: state.tradePlan.stopLoss,
    takeProfit: state.tradePlan.takeProfit,
    lotSize: lotSize.toFixed(2),
    slPips: state.tradePlan.slPips,
    tpPips: state.tradePlan.tpPips,
    riskAmount: state.tradePlan.riskType === 'percent' 
      ? (state.accountBalance * state.tradePlan.riskPercent / 100).toFixed(2)
      : state.tradePlan.riskMoney.toFixed(2)
  });
  
  showNotification('Trade Executed', `${direction.toUpperCase()} ${lotSize.toFixed(2)} lots`);
  
  // Track for AI behavior analysis
  trackTradeBehavior();
}

// Update calculator when SL input changes - AUTO DETECT DIRECTION
function updateCalculatorFromSL() {
  const slPrice = parseFloat(elements.calcSLInput?.value) || 0;
  state.tradePlan.stopLoss = slPrice;
  
  // Auto-detect direction based on SL position
  if (slPrice > 0) {
    detectTradeDirection();
  }
  
  // Calculate pips from entry
  const entryPrice = state.tradePlan.entryType === 'market' 
    ? state.currentPrice 
    : parseFloat(elements.entryPriceInput?.value) || state.currentPrice;
  
  const slPips = slPrice > 0 ? calculatePips(slPrice, entryPrice, state.currentSymbol) : 0;
  state.tradePlan.slPips = slPips;
  
  if (elements.slPipsDisplay) {
    elements.slPipsDisplay.textContent = slPips > 0 ? `${slPips.toFixed(1)} pips` : '-- pips';
  }
  
  // Auto-calculate TP if target default is enabled
  if (state.targetDefault.enabled && slPips > 0) {
    autoCalculateTP();
  }
  
  updateTradeCalculator();
  sendDrawLineCommand('SL', slPrice);
}

// Update calculator when TP input changes
function updateCalculatorFromTP() {
  const tpPrice = parseFloat(elements.calcTPInput?.value) || 0;
  state.tradePlan.takeProfit = tpPrice;
  
  // Calculate pips from entry
  const entryPrice = state.tradePlan.entryType === 'market' 
    ? state.currentPrice 
    : parseFloat(elements.entryPriceInput?.value) || state.currentPrice;
  
  const tpPips = tpPrice > 0 ? calculatePips(tpPrice, entryPrice, state.currentSymbol) : 0;
  state.tradePlan.tpPips = tpPips;
  
  if (elements.tpPipsDisplay) {
    elements.tpPipsDisplay.textContent = tpPips > 0 ? `${tpPips.toFixed(1)} pips` : '-- pips';
  }
  
  updateTradeCalculator();
  sendDrawLineCommand('TP', tpPrice);
}

// Auto-calculate TP based on target default settings
function autoCalculateTP() {
  if (!state.targetDefault.enabled) return;
  
  const entryPrice = state.tradePlan.entryType === 'market' 
    ? state.currentPrice 
    : state.tradePlan.entryPrice || state.currentPrice;
  const slPips = state.tradePlan.slPips;
  const pipInfo = getPipInfo(state.currentSymbol);
  
  let tpPips = 0;
  
  if (state.targetDefault.mode === 'rr') {
    tpPips = slPips * state.targetDefault.rr;
  } else if (state.targetDefault.mode === 'fixed') {
    // Calculate TP pips to achieve target money
    const riskPerPip = state.tradePlan.calculatedLotSize * 10;  // Approximate
    tpPips = state.targetDefault.money / riskPerPip;
  } else if (state.targetDefault.mode === 'pips') {
    tpPips = state.targetDefault.pips;
  }
  
  // Check minimum R:R
  const actualRR = tpPips / slPips;
  if (actualRR < state.targetDefault.minRR) {
    tpPips = slPips * state.targetDefault.minRR;
  }
  
  const tpOffset = tpPips * pipInfo.pipSize;
  const tpPrice = state.tradePlan.direction === 'buy' 
    ? entryPrice + tpOffset 
    : entryPrice - tpOffset;
  
  if (elements.calcTPInput) {
    elements.calcTPInput.value = formatPrice(tpPrice, state.currentSymbol);
  }
  
  state.tradePlan.takeProfit = tpPrice;
  state.tradePlan.tpPips = tpPips;
  
  if (elements.tpPipsDisplay) {
    elements.tpPipsDisplay.textContent = `${tpPips.toFixed(1)} pips`;
  }
  
  sendDrawLineCommand('TP', tpPrice);
}

function updateTradeCalculator() {
  const slPips = state.tradePlan.slPips || 0;
  const tpPips = state.tradePlan.tpPips || 0;
  
  // Get current risk value from input
  const inputValue = parseFloat(elements.calcRiskInput?.value) || 0;
  if (state.tradePlan.riskType === 'percent') {
    state.tradePlan.riskPercent = inputValue || 2;
  } else {
    state.tradePlan.riskMoney = inputValue || 100;
  }
  
  // Calculate risk amount
  let riskAmount = 0;
  if (state.tradePlan.riskType === 'percent') {
    riskAmount = state.accountBalance * (state.tradePlan.riskPercent / 100);
  } else {
    riskAmount = state.tradePlan.riskMoney;
  }
  
  // Calculate lot size based on SL pips and risk amount
  const pipInfo = getPipInfo(state.currentSymbol);
  let lotSize = 0;
  
  if (slPips > 0) {
    const riskPerLot = slPips * 10;  // Simplified - $10 per pip per lot
    lotSize = riskAmount / riskPerLot;
    
    // Adjust for XAUUSD (Gold)
    if (pipInfo.isXAU) {
      lotSize = riskAmount / (slPips * 1);  // $1 per pip for 0.01 lot
    }
    
    // Round to 2 decimal places
    lotSize = Math.floor(lotSize * 100) / 100;
  }
  
  state.tradePlan.calculatedLotSize = lotSize;
  const rrRatio = slPips > 0 ? (tpPips / slPips).toFixed(1) : '0';
  
  if (elements.calcLotSize) elements.calcLotSize.textContent = lotSize.toFixed(2);
  if (elements.calcRiskAmount) elements.calcRiskAmount.textContent = `$${riskAmount.toFixed(2)}`;
  if (elements.calcRRRatio) elements.calcRRRatio.textContent = `1:${rrRatio}`;
  
  // Update display lot size on main screen (editable input)
  if (elements.displayLotSizeInput) {
    elements.displayLotSizeInput.value = lotSize.toFixed(2);
  }
  
  // Send lot size to MT4 to display on chart
  sendLotSizeToMT4(lotSize);
}

// Send calculated lot size to MT4 for display
function sendLotSizeToMT4(lotSize) {
  ipcRenderer.send('send-command', {
    type: 'trade.update_lotsize',
    data: {
      lotSize: lotSize,
      symbol: state.currentSymbol,
      magicKey: state.settings.mtConnection.magicKey
    }
  });
}

// Quick set functions
function quickSetSL(pips) {
  const entryPrice = state.tradePlan.entryType === 'market' 
    ? state.currentPrice 
    : parseFloat(elements.entryPriceInput?.value) || state.currentPrice;
  
  const pipInfo = getPipInfo(state.currentSymbol);
  const slOffset = pips * pipInfo.pipSize;
  
  // For auto-detect, we'll set SL on both sides and let user choose
  const slPriceBuy = entryPrice - slOffset;
  const slPriceSell = entryPrice + slOffset;
  
  // Default to buy side, user can drag line to switch
  if (elements.calcSLInput) {
    elements.calcSLInput.value = formatPrice(slPriceBuy, state.currentSymbol);
  }
  updateCalculatorFromSL();
}

function quickSetTP(pips) {
  const entryPrice = state.tradePlan.entryType === 'market' 
    ? state.currentPrice 
    : parseFloat(elements.entryPriceInput?.value) || state.currentPrice;
  
  const pipInfo = getPipInfo(state.currentSymbol);
  const tpOffset = pips * pipInfo.pipSize;
  const tpPrice = state.tradePlan.direction === 'buy' 
    ? entryPrice + tpOffset 
    : entryPrice - tpOffset;
  
  if (elements.calcTPInput) {
    elements.calcTPInput.value = formatPrice(tpPrice, state.currentSymbol);
  }
  updateCalculatorFromTP();
}

function quickSetRR(rr) {
  const slPips = state.tradePlan.slPips;
  if (slPips <= 0) {
    showNotification('Error', 'Set Stop Loss first');
    return;
  }
  
  const entryPrice = state.tradePlan.entryType === 'market' 
    ? state.currentPrice 
    : parseFloat(elements.entryPriceInput?.value) || state.currentPrice;
  
  const pipInfo = getPipInfo(state.currentSymbol);
  const tpPips = slPips * rr;
  const tpOffset = tpPips * pipInfo.pipSize;
  const tpPrice = state.tradePlan.direction === 'buy' 
    ? entryPrice + tpOffset 
    : entryPrice - tpOffset;
  
  if (elements.calcTPInput) {
    elements.calcTPInput.value = formatPrice(tpPrice, state.currentSymbol);
  }
  updateCalculatorFromTP();
}

// Send command to MT4 to draw visual lines
function sendDrawLineCommand(type, price) {
  if (price <= 0) return;
  
  ipcRenderer.send('send-command', {
    type: 'trade.draw_line',
    data: {
      lineType: type, // 'SL', 'TP', or 'ENTRY'
      price: price,
      symbol: state.currentSymbol,
      direction: state.tradePlan.direction,
      magicKey: state.settings.mtConnection.magicKey
    }
  });
}

// Clear visual lines from chart
function clearVisualLines() {
  ipcRenderer.send('send-command', {
    type: 'trade.clear_lines',
    data: {
      magicKey: state.settings.mtConnection.magicKey
    }
  });
}

// OPEN TRADE - Execute directly from Plan Trade
function openTradeFromPlan() {
  // Validate inputs
  if (state.tradePlan.stopLoss <= 0) {
    showNotification('Error', 'Please set Stop Loss on chart');
    return;
  }
  
  // Update final values
  state.tradePlan.stopLoss = parseFloat(elements.calcSLInput?.value) || 0;
  state.tradePlan.takeProfit = parseFloat(elements.calcTPInput?.value) || 0;
  state.tradePlan.entryPrice = state.tradePlan.entryType === 'market' 
    ? state.currentPrice 
    : parseFloat(elements.entryPriceInput?.value) || state.currentPrice;
  
  // Use fixed lot size from settings if set, otherwise use calculated
  const lotSize = state.settings.mtConnection.fixedLotSize > 0 
    ? state.settings.mtConnection.fixedLotSize 
    : state.tradePlan.calculatedLotSize;
  
  // Use fixed SL from settings if set
  const slPips = state.settings.mtConnection.fixedSL > 0 
    ? state.settings.mtConnection.fixedSL 
    : state.tradePlan.slPips;
  
  // Check prop firm restrictions
  if (state.settings.propFirm.enabled) {
    if (!checkPropFirmRestrictions()) {
      return;
    }
  }
  
  // Execute trade
  hideModal('planTradeModal');
  
  sendCommand('open_trade', {
    symbol: state.tradePlan.symbol === 'AUTO' ? state.currentSymbol : state.tradePlan.symbol,
    direction: state.tradePlan.direction,
    entryType: state.tradePlan.entryType,
    entryPrice: state.tradePlan.entryPrice,
    stopLoss: state.tradePlan.stopLoss,
    takeProfit: state.tradePlan.takeProfit,
    lotSize: lotSize.toFixed(2),
    slPips: slPips,
    tpPips: state.tradePlan.tpPips,
    riskAmount: state.tradePlan.riskType === 'percent' 
      ? (state.accountBalance * state.tradePlan.riskPercent / 100).toFixed(2)
      : state.tradePlan.riskMoney.toFixed(2)
  });
  
  // Track for AI behavior analysis
  trackTradeBehavior();
  
  // Clear visual lines after trade execution
  setTimeout(clearVisualLines, 2000);
}

// Check prop firm restrictions before opening trade
function checkPropFirmRestrictions() {
  const settings = state.settings.propFirm;
  
  // Check daily loss limit
  const dailyLossPercent = (state.dailyLoss / state.accountBalance) * 100;
  
  if (settings.floatingLossCheck || settings.totalLossCheck) {
    const currentLoss = Math.abs(Math.min(0, state.openPL));
    const totalLoss = state.dailyLoss + currentLoss;
    const totalLossPercent = (totalLoss / state.accountBalance) * 100;
    
    if (totalLossPercent >= settings.dailyLossPercent) {
      showNotification('Prop Firm Block', `Daily loss limit (${settings.dailyLossPercent}%) reached`);
      return false;
    }
  }
  
  // Check news block
  if (settings.newsBlock && state.newsAlert) {
    const minutesUntil = state.newsAlert.minutesUntil;
    if (minutesUntil <= state.settings.news.minutesBefore && minutesUntil >= -5) {
      showNotification('Prop Firm Block', 'Trading blocked during high-impact news');
      return false;
    }
  }
  
  // Check news warning
  if (settings.newsWarning && state.newsAlert) {
    const minutesUntil = state.newsAlert.minutesUntil;
    if (minutesUntil <= state.settings.news.minutesBefore && minutesUntil > 0) {
      showNotification('Prop Firm Warning', `News in ${minutesUntil} minutes - trade with caution`);
    }
  }
  
  return true;
}

// Track user trading behavior for AI analysis
function trackTradeBehavior() {
  state.userBehavior.tradeCount++;
  state.userBehavior.avgSLPips = (state.userBehavior.avgSLPips * (state.userBehavior.tradeCount - 1) + state.tradePlan.slPips) / state.userBehavior.tradeCount;
  state.userBehavior.avgTPPips = (state.userBehavior.avgTPPips * (state.userBehavior.tradeCount - 1) + state.tradePlan.tpPips) / state.userBehavior.tradeCount;
  state.userBehavior.avgRR = (state.userBehavior.avgRR * (state.userBehavior.tradeCount - 1) + (state.tradePlan.tpPips / state.tradePlan.slPips)) / state.userBehavior.tradeCount;
  
  if (!state.userBehavior.preferredPairs.includes(state.currentSymbol)) {
    state.userBehavior.preferredPairs.push(state.currentSymbol);
  }
  
  // Save to localStorage for persistence
  localStorage.setItem('chartwise_behavior', JSON.stringify(state.userBehavior));
}

// Load user behavior from storage
function loadUserBehavior() {
  const saved = localStorage.getItem('chartwise_behavior');
  if (saved) {
    state.userBehavior = JSON.parse(saved);
  }
}

function showOpenTradeModal() {
  // Update execution summary
  if (elements.execSymbol) elements.execSymbol.textContent = state.tradePlan.symbol === 'AUTO' ? state.currentSymbol : state.tradePlan.symbol;
  if (elements.execDirection) {
    elements.execDirection.textContent = state.tradePlan.direction.toUpperCase();
    elements.execDirection.className = state.tradePlan.direction;
  }
  if (elements.execEntry) {
    elements.execEntry.textContent = state.tradePlan.entryType === 'market' 
      ? `Market (${state.currentPrice.toFixed(5)})` 
      : state.tradePlan.entryPrice.toFixed(5);
  }
  if (elements.execSL) elements.execSL.textContent = state.tradePlan.stopLoss > 0 ? state.tradePlan.stopLoss.toFixed(5) : '-';
  if (elements.execTP) elements.execTP.textContent = state.tradePlan.takeProfit > 0 ? state.tradePlan.takeProfit.toFixed(5) : '-';
  
  const riskAmount = state.accountBalance * (state.tradePlan.riskPercent / 100);
  const slPips = state.tradePlan.slPips;
  const lotSize = slPips > 0 ? (riskAmount / (slPips * 10)).toFixed(2) : '0.00';
  
  if (elements.execLotSize) elements.execLotSize.textContent = lotSize;
  if (elements.execRisk) elements.execRisk.textContent = `$${riskAmount.toFixed(2)} (${state.tradePlan.riskPercent}%)`;
  
  showModal('openTradeModal');
}

function executeTrade() {
  const confirmTrade = document.getElementById('confirmTrade')?.checked;
  if (!confirmTrade) {
    showNotification('Error', 'Please confirm trade levels');
    return;
  }
  
  hideModal('openTradeModal');
  
  // Calculate lot size
  const riskAmount = state.accountBalance * (state.tradePlan.riskPercent / 100);
  const slPips = state.tradePlan.slPips;
  const lotSize = slPips > 0 ? (riskAmount / (slPips * 10)) : 0;
  
  // Send trade command to MT4
  sendCommand('open_trade', {
    symbol: state.tradePlan.symbol === 'AUTO' ? state.currentSymbol : state.tradePlan.symbol,
    direction: state.tradePlan.direction,
    entryType: state.tradePlan.entryType,
    entryPrice: state.tradePlan.entryType === 'market' ? state.currentPrice : state.tradePlan.entryPrice,
    stopLoss: state.tradePlan.stopLoss,
    takeProfit: state.tradePlan.takeProfit,
    lotSize: lotSize.toFixed(2),
    riskPercent: state.tradePlan.riskPercent,
    riskAmount: riskAmount.toFixed(2),
    slPips: state.tradePlan.slPips,
    tpPips: state.tradePlan.tpPips
  });
  
  // Clear visual lines after trade execution
  clearVisualLines();
}

// ==================== PARTIAL TP - PIPS OR PRICE BASED (Magic Keys Style) ====================

// Single click: Activate/deactivate partial TP with default settings
// Long press: Open modal to add/edit levels

function handlePartialTPClick() {
  if (state.activePartialTP) {
    // Deactivate partial TP
    state.activePartialTP = false;
    elements.partialTPBtn?.classList.remove('active');
    elements.partialTPBtn?.classList.remove('active-glow-partial');
    showNotification('Partial TP', 'Partial TP deactivated');
    
    // Clear PTP lines from chart
    ipcRenderer.send('send-command', {
      type: 'trade.clear_ptp_lines',
      data: { magicKey: state.settings.mtConnection.magicKey }
    });
  } else {
    // Activate partial TP with default settings
    activatePartialTP();
  }
  
  updateToggleGlowEffects();
}

function activatePartialTP() {
  state.activePartialTP = true;
  elements.partialTPBtn?.classList.add('active');
  elements.partialTPBtn?.classList.add('active-glow-partial');
  
  // Calculate TP prices based on mode (pips or price)
  const entryPrice = state.currentPrice;
  const direction = state.tradePlan.direction || 'buy';
  const pipInfo = getPipInfo(state.currentSymbol);
  
  const levels = state.settings.partialTP.defaultLevels.map((level, index) => {
    let price = 0;
    
    if (state.partialTPMode === 'pips') {
      const offset = level.value * pipInfo.pipSize;
      price = direction === 'buy' ? entryPrice + offset : entryPrice - offset;
    } else {
      price = level.value;  // Direct price value
    }
    
    return {
      level: index + 1,
      price: price,
      percent: level.percent,
      triggered: false
    };
  });
  
  // Draw PTP lines on chart
  sendCommand('set_partial_tp', { 
    levels: levels,
    symbol: state.currentSymbol,
    mode: state.partialTPMode
  });
  
  showNotification('Partial TP', `Activated with ${levels.length} levels (${state.partialTPMode})`);
}

function handlePartialTPLongPress() {
  // Open modal for advanced PTP settings
  showModal('partialTPModal');
}

function renderPartialTPLevels() {
  if (!elements.tpLevelsContainer) return;
  
  elements.tpLevelsContainer.innerHTML = state.partialTPLevels.map((level, index) => {
    const valueLabel = state.partialTPMode === 'pips' ? 'Pips' : 'Price';
    const valueDisplay = state.partialTPMode === 'pips' 
      ? level.value 
      : (level.price > 0 ? level.price.toFixed(pipInfo.digits) : '');
    
    return `
    <div class="tp-level-card" data-id="${level.id}">
      <div class="level-num">${index + 1}</div>
      <div class="level-inputs">
        <input type="number" placeholder="${valueLabel}" value="${valueDisplay}" class="tp-value-input" data-id="${level.id}" step="${state.partialTPMode === 'pips' ? '1' : '0.00001'}">
        <input type="number" placeholder="%" value="${level.percent}" class="tp-percent-input" data-id="${level.id}" min="1" max="100">
      </div>
      <button class="level-delete" data-id="${level.id}">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `}).join('');
  
  // Add delete handlers
  document.querySelectorAll('.level-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      deleteTPLevel(id);
    });
  });
  
  // Update visual display
  updatePTPVisualDisplay();
}

function updatePTPVisualDisplay() {
  if (!elements.ptpLinesDisplay) return;
  
  const pipInfo = getPipInfo(state.currentSymbol);
  
  elements.ptpLinesDisplay.innerHTML = state.partialTPLevels.map((level, index) => {
    let displayValue = '';
    if (state.partialTPMode === 'pips') {
      displayValue = `${level.value} pips`;
    } else {
      displayValue = level.price > 0 ? level.price.toFixed(pipInfo.digits) : 'Not Set';
    }
    
    return `
      <div class="ptp-line-item">
        <div class="level-badge">${index + 1}</div>
        <div class="price-info">${displayValue}</div>
        <div class="close-info">${level.percent}%</div>
      </div>
    `;
  }).join('');
}

function setPartialTPMode(mode) {
  state.partialTPMode = mode;
  elements.ptpModePips?.classList.toggle('active', mode === 'pips');
  elements.ptpModePrice?.classList.toggle('active', mode === 'price');
  renderPartialTPLevels();
}

function addTPLevel() {
  const newId = state.partialTPLevels.length > 0 ? Math.max(...state.partialTPLevels.map(l => l.id)) + 1 : 1;
  state.partialTPLevels.push({ 
    id: newId, 
    type: state.partialTPMode,
    value: state.partialTPMode === 'pips' ? 40 : 0, 
    price: 0, 
    percent: 25 
  });
  renderPartialTPLevels();
}

function deleteTPLevel(id) {
  if (state.partialTPLevels.length <= 1) {
    showNotification('Error', 'Must have at least one TP level');
    return;
  }
  state.partialTPLevels = state.partialTPLevels.filter(l => l.id !== id);
  renderPartialTPLevels();
}

function savePartialTPLevels() {
  const pipInfo = getPipInfo(state.currentSymbol);
  
  // Collect values from inputs
  document.querySelectorAll('.tp-level-card').forEach(card => {
    const id = parseInt(card.dataset.id);
    const value = parseFloat(card.querySelector('.tp-value-input').value) || 0;
    const percent = parseInt(card.querySelector('.tp-percent-input').value) || 0;
    
    const level = state.partialTPLevels.find(l => l.id === id);
    if (level) {
      if (state.partialTPMode === 'pips') {
        level.value = value;
        // Calculate price from pips
        const entryPrice = state.currentPrice;
        const direction = state.tradePlan.direction || 'buy';
        const offset = value * pipInfo.pipSize;
        level.price = direction === 'buy' ? entryPrice + offset : entryPrice - offset;
      } else {
        level.price = value;
        // Calculate pips from price
        level.value = calculatePips(value, state.currentPrice, state.currentSymbol);
      }
      level.percent = percent;
    }
  });
  
  // Save to settings
  state.settings.partialTP.defaultLevels = state.partialTPLevels.map(l => ({ 
    type: state.partialTPMode,
    value: l.value, 
    percent: l.percent 
  }));
  
  hideModal('partialTPModal');
  showNotification('Success', 'Partial TP levels saved');
  
  // If PTP is active, update chart lines
  if (state.activePartialTP) {
    activatePartialTP();
  }
}

// ==================== CUSTOM CLOSE - SINGLE CLICK / LONG PRESS ====================

// Single click: Close default percentage (from settings)
// Long press: Open quick partial close modal with presets

function handleCustomCloseClick() {
  // Execute default close percentage
  const defaultPercent = state.settings.customClose.defaultPercent;
  executeCustomClose(defaultPercent);
}

function handleCustomCloseLongPress() {
  // Show quick partial close modal with presets
  showModal('customCloseModal');
}

function executeCustomClose(percent) {
  hideModal('customCloseModal');
  sendCommand('custom_close', { percent });
  showNotification('Custom Close', `Closing ${percent}% of position`);
}

// ==================== TARGET DEFAULT ====================

function handleTargetDefaultClick() {
  // Toggle target default on/off
  state.targetDefault.enabled = !state.targetDefault.enabled;
  state.settings.targetDefault.enabled = state.targetDefault.enabled;
  
  if (state.targetDefault.enabled) {
    // Apply target default to current trade plan
    autoCalculateTP();
    elements.targetDefaultBtn?.classList.add('active-glow-target');
    const modeLabel = state.targetDefault.mode === 'rr' ? `${state.targetDefault.rr}:1 RR` : 
                      state.targetDefault.mode === 'fixed' ? `$${state.targetDefault.money}` :
                      `${state.targetDefault.pips} pips`;
    showNotification('Target Default', `Enabled: ${modeLabel}`);
  } else {
    elements.targetDefaultBtn?.classList.remove('active-glow-target');
    showNotification('Target Default', 'Disabled');
  }
  
  updateToggleGlowEffects();
}

function handleTargetDefaultLongPress() {
  // Open target default settings (new Target tab)
  showModal('settingsModal');
  switchTab('target');
}

// ==================== TARGET SETTINGS ====================

function handleTargetModeChange(e) {
  const mode = e.target.value;
  const rrSettings = document.getElementById('targetRRSettings');
  const fixedSettings = document.getElementById('targetFixedSettings');
  const pipsSettings = document.getElementById('targetPipsSettings');
  
  if (rrSettings) rrSettings.style.display = mode === 'rr' ? 'block' : 'none';
  if (fixedSettings) fixedSettings.style.display = mode === 'fixed' ? 'block' : 'none';
  if (pipsSettings) pipsSettings.style.display = mode === 'pips' ? 'block' : 'none';
}

function populateTargetSettings() {
  const targetMode = document.getElementById('targetMode');
  const targetRRValue = document.getElementById('targetRRValue');
  const targetFixedAmount = document.getElementById('targetFixedAmount');
  const targetPipsValue = document.getElementById('targetPipsValue');
  const targetAutoApply = document.getElementById('targetAutoApply');
  const targetMinRR = document.getElementById('targetMinRR');
  
  if (targetMode) targetMode.value = state.settings.targetDefault.mode;
  if (targetRRValue) targetRRValue.value = state.settings.targetDefault.rr;
  if (targetFixedAmount) targetFixedAmount.value = state.settings.targetDefault.money;
  if (targetPipsValue) targetPipsValue.value = state.settings.targetDefault.pips;
  if (targetAutoApply) targetAutoApply.checked = state.settings.targetDefault.autoApply;
  if (targetMinRR) targetMinRR.value = state.settings.targetDefault.minRR;
  
  // Show/hide appropriate settings sections
  handleTargetModeChange({ target: { value: state.settings.targetDefault.mode } });
}

// ==================== LOCK / UNLOCK ====================

function toggleLock() {
  state.isLocked = !state.isLocked;
  
  const lockIcon = elements.lockIconSmall;
  const icon = lockIcon.querySelector('i');
  const text = lockIcon.querySelector('.lock-text');
  
  if (state.isLocked) {
    lockIcon.classList.remove('unlocked');
    icon.className = 'fas fa-lock';
    text.textContent = 'LOCKED';
    lockIcon.title = 'Click to unlock';
    showNotification('Locked', 'Safe mode enabled');
  } else {
    lockIcon.classList.add('unlocked');
    icon.className = 'fas fa-lock-open';
    text.textContent = 'UNLOCKED';
    lockIcon.title = 'Click to lock';
    showNotification('Unlocked', 'Ready to trade');
  }
}

// ==================== DISPLAY SETTINGS ====================

function updateDisplayVisibility() {
  const showBalance = elements.showBalance?.checked ?? true;
  const showPL = elements.showPL?.checked ?? true;
  const showPositions = elements.showPositions?.checked ?? true;
  
  elements.balanceItem?.classList.toggle('hidden', !showBalance);
  elements.plItem?.classList.toggle('hidden', !showPL);
  elements.positionsItem?.classList.toggle('hidden', !showPositions);
  
  state.settings.display = { showBalance, showPL, showPositions };
}

// ==================== SETTINGS ====================

async function loadUserSettings() {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/all`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    
    const data = await response.json();
    
    if (data.success && data.settings) {
      state.settings = { ...state.settings, ...data.settings };
      if (data.settings.ai?.conditions) {
        state.aiConditions = data.settings.ai.conditions;
      }
      if (data.settings.partialTP?.levels) {
        state.partialTPLevels = data.settings.partialTP.levels.map((l, i) => ({ 
          id: i + 1, 
          pips: l.pips, 
          percent: l.percent 
        }));
        renderPartialTPLevels();
      }
      populateSettingsForm();
      populateAISettingsForm();
      updateDisplayVisibility();
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

function populateSettingsForm() {
  // Display Settings
  if (elements.showBalance) elements.showBalance.checked = state.settings.display.showBalance;
  if (elements.showPL) elements.showPL.checked = state.settings.display.showPL;
  if (elements.showPositions) elements.showPositions.checked = state.settings.display.showPositions;
  if (elements.themeSelect) elements.themeSelect.value = state.settings.theme;
  
  // Risk Settings
  const defaultRisk = document.getElementById('defaultRisk');
  const maxPositions = document.getElementById('maxPositions');
  const dailyLossLimit = document.getElementById('dailyLossLimit');
  if (defaultRisk) defaultRisk.value = state.settings.risk.defaultRiskPercent;
  if (maxPositions) maxPositions.value = state.settings.risk.maxOpenPositions;
  if (dailyLossLimit) dailyLossLimit.value = state.settings.risk.dailyLossLimit;
  
  // Target Settings
  populateTargetSettings();
  
  // Auto BE Settings
  const autoBeEnabled = document.getElementById('autoBeEnabled');
  const beTriggerPips = document.getElementById('beTriggerPips');
  const bePlusPips = document.getElementById('bePlusPips');
  const beSlPosition = document.getElementById('beSlPosition');
  const beProtectPartial = document.getElementById('beProtectPartial');
  if (autoBeEnabled) autoBeEnabled.checked = state.settings.autoBreakeven.enabled;
  if (beTriggerPips) beTriggerPips.value = state.settings.autoBreakeven.triggerPips;
  if (bePlusPips) bePlusPips.value = state.settings.autoBreakeven.plusPips;
  if (beSlPosition) beSlPosition.value = state.settings.autoBreakeven.slPosition || 'entry';
  if (beProtectPartial) beProtectPartial.checked = state.settings.autoBreakeven.protectPartial;
  
  // MT Connection
  const mtAutoConnect = document.getElementById('mtAutoConnect');
  const mtPreferredVersion = document.getElementById('mtPreferredVersion');
  if (mtAutoConnect) mtAutoConnect.checked = state.settings.mtConnection.autoConnect;
  if (mtPreferredVersion) mtPreferredVersion.value = state.settings.mtConnection.preferredVersion;
  if (elements.mtMagicKey) elements.mtMagicKey.value = state.settings.mtConnection.magicKey;
}

function populateAISettingsForm() {
  const aiEnabled = document.getElementById('aiEnabled');
  const aiModel = document.getElementById('aiModel');
  const aiSuggestions = document.getElementById('aiSuggestions');
  const aiAutoExecute = document.getElementById('aiAutoExecute');
  
  if (aiEnabled) aiEnabled.checked = state.settings.ai.enabled;
  if (aiModel) aiModel.value = state.settings.ai.model;
  if (aiSuggestions) aiSuggestions.checked = state.settings.ai.realTimeSuggestions;
  if (aiAutoExecute) aiAutoExecute.checked = state.settings.ai.autoExecute;
  
  if (elements.propFirmEnabled) elements.propFirmEnabled.checked = state.settings.propFirm.enabled;
  if (elements.propFirmProvider) elements.propFirmProvider.value = state.settings.propFirm.provider;
  if (elements.propAccountType) elements.propAccountType.value = state.settings.propFirm.accountType;
  if (elements.propDailyLoss) elements.propDailyLoss.value = state.settings.propFirm.dailyLossLimit;
  if (elements.propMaxDrawdown) elements.propMaxDrawdown.value = state.settings.propFirm.maxDrawdown;
  if (elements.propProfitTarget) elements.propProfitTarget.value = state.settings.propFirm.profitTarget;
  if (elements.propAutoClose) elements.propAutoClose.checked = state.settings.propFirm.autoClose;
  if (elements.propNewsBlock) elements.propNewsBlock.checked = state.settings.propFirm.newsBlock;
  if (elements.propMaxHoldTime) elements.propMaxHoldTime.value = state.settings.propFirm.maxHoldTime;
  if (elements.propWeekendClose) elements.propWeekendClose.checked = state.settings.propFirm.weekendClose;
  
  renderAIConditions();
}

function renderAIConditions() {
  if (!elements.aiConditionsList) return;
  
  elements.aiConditionsList.innerHTML = state.aiConditions.map(condition => `
    <div class="condition-card" data-condition-id="${condition.id}">
      <div class="condition-header">
        <div class="condition-info">
          <span class="condition-type">${condition.type}</span>
          <span class="condition-name">${condition.name}</span>
          <span class="condition-desc">${condition.description}</span>
        </div>
        <div class="condition-actions">
          <button class="icon-btn edit-condition" data-id="${condition.id}"><i class="fas fa-edit"></i></button>
          <button class="icon-btn delete delete-condition" data-id="${condition.id}"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="condition-fields">
        <div class="condition-field">
          <label>Trigger When</label>
          <select class="condition-select trigger-select" data-id="${condition.id}">
            <option ${condition.trigger === 'ATR exceeds average by' ? 'selected' : ''}>ATR exceeds average by</option>
            <option ${condition.trigger === 'Bollinger Bands width exceeds' ? 'selected' : ''}>Bollinger Bands width exceeds</option>
            <option ${condition.trigger === 'Total correlation exceeds' ? 'selected' : ''}>Total correlation exceeds</option>
            <option ${condition.trigger === 'Same currency exposure exceeds' ? 'selected' : ''}>Same currency exposure exceeds</option>
          </select>
        </div>
        <div class="condition-field">
          <label>Threshold</label>
          <div class="input-with-unit">
            <input type="number" value="${condition.threshold}" step="0.1" class="condition-input threshold-input" data-id="${condition.id}">
            <span>${condition.thresholdUnit}</span>
          </div>
        </div>
        <div class="condition-field">
          <label>Action</label>
          <select class="condition-select action-select" data-id="${condition.id}">
            <option ${condition.action === 'Reduce position size by 50%' ? 'selected' : ''}>Reduce position size by 50%</option>
            <option ${condition.action === 'Tighten stop loss by 30%' ? 'selected' : ''}>Tighten stop loss by 30%</option>
            <option ${condition.action === 'Close partial position' ? 'selected' : ''}>Close partial position</option>
            <option ${condition.action === 'Block new correlated trades' ? 'selected' : ''}>Block new correlated trades</option>
            <option ${condition.action === 'Warn before opening' ? 'selected' : ''}>Warn before opening</option>
          </select>
        </div>
      </div>
    </div>
  `).join('');
  
  document.querySelectorAll('.delete-condition').forEach(btn => {
    btn.addEventListener('click', (e) => deleteCondition(parseInt(e.currentTarget.dataset.id)));
  });
}

function addNewCondition() {
  const newId = state.aiConditions.length > 0 ? Math.max(...state.aiConditions.map(c => c.id)) + 1 : 1;
  state.aiConditions.push({
    id: newId,
    type: 'CUSTOM',
    name: 'New Condition',
    description: 'Custom AI condition',
    trigger: 'ATR exceeds average by',
    threshold: 100,
    thresholdUnit: '%',
    action: 'Warn before opening'
  });
  renderAIConditions();
}

function deleteCondition(id) {
  state.aiConditions = state.aiConditions.filter(c => c.id !== id);
  renderAIConditions();
}

async function saveSettings() {
  const newSettings = {
    display: {
      showBalance: elements.showBalance?.checked ?? true,
      showPL: elements.showPL?.checked ?? true,
      showPositions: elements.showPositions?.checked ?? true
    },
    theme: elements.themeSelect?.value || 'dark',
    risk: {
      defaultRiskPercent: parseFloat(document.getElementById('defaultRisk')?.value || 2),
      maxOpenPositions: parseInt(document.getElementById('maxPositions')?.value || 5),
      dailyLossLimit: parseFloat(document.getElementById('dailyLossLimit')?.value || 500)
    },
    targetDefault: {
      enabled: state.targetDefault.enabled,
      mode: document.getElementById('targetMode')?.value || 'rr',
      rr: parseFloat(document.getElementById('targetRRValue')?.value || 2),
      money: parseFloat(document.getElementById('targetFixedAmount')?.value || 100),
      pips: parseInt(document.getElementById('targetPipsValue')?.value || 40),
      autoApply: document.getElementById('targetAutoApply')?.checked ?? true,
      minRR: parseFloat(document.getElementById('targetMinRR')?.value || 1)
    },
    autoBreakeven: {
      enabled: document.getElementById('autoBeEnabled')?.checked ?? false,
      triggerPips: parseInt(document.getElementById('beTriggerPips')?.value || 20),
      plusPips: parseInt(document.getElementById('bePlusPips')?.value || 2),
      slPosition: document.getElementById('beSlPosition')?.value || 'entry',
      protectPartial: document.getElementById('beProtectPartial')?.checked ?? true
    },
    mtConnection: {
      autoConnect: document.getElementById('mtAutoConnect')?.checked ?? true,
      preferredVersion: document.getElementById('mtPreferredVersion')?.value || 'auto',
      magicKey: elements.mtMagicKey?.value?.toUpperCase() || 'CHARTWISE_001',
      reconnectInterval: state.settings.mtConnection.reconnectInterval
    }
  };
  
  state.settings = { ...state.settings, ...newSettings };
  state.targetDefault = { ...state.targetDefault, ...newSettings.targetDefault };
  setTheme(newSettings.theme);
  updateDisplayVisibility();
  
  hideModal('settingsModal');
  showNotification('Settings Saved', 'Your settings have been saved');
}

async function saveAISettings() {
  const newAISettings = {
    ai: {
      enabled: document.getElementById('aiEnabled')?.checked ?? true,
      model: document.getElementById('aiModel')?.value || 'balanced',
      realTimeSuggestions: document.getElementById('aiSuggestions')?.checked ?? true,
      autoExecute: document.getElementById('aiAutoExecute')?.checked ?? false,
      conditions: state.aiConditions
    },
    propFirm: {
      enabled: elements.propFirmEnabled?.checked ?? false,
      provider: elements.propFirmProvider?.value || 'custom',
      accountType: elements.propAccountType?.value || 'challenge',
      dailyLossLimit: parseFloat(elements.propDailyLoss?.value || 500),
      maxDrawdown: parseFloat(elements.propMaxDrawdown?.value || 1000),
      profitTarget: parseFloat(elements.propProfitTarget?.value || 1000),
      autoClose: elements.propAutoClose?.checked ?? true,
      newsBlock: elements.propNewsBlock?.checked ?? true,
      maxHoldTime: parseInt(elements.propMaxHoldTime?.value || 0),
      weekendClose: elements.propWeekendClose?.checked ?? false
    }
  };
  
  state.settings = { ...state.settings, ...newAISettings };
  
  hideModal('aiSettingsModal');
  showNotification('AI Settings Saved', 'Your AI settings have been saved');
}

function switchTab(tabId) {
  elements.tabBtns?.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
  elements.tabContents?.forEach(content => content.classList.toggle('active', content.id === `tab-${tabId}`));
}

// ==================== MT CONNECTION ====================

function connectMT(version) {
  const magicKey = elements.mtMagicKey?.value?.toUpperCase() || 'CHARTWISE_001';
  ipcRenderer.send('connect-mt', { version, magicKey });
  showNotification('Connecting', `Connecting to ${version.toUpperCase()} (${magicKey})`);
}

function disconnectMT() {
  ipcRenderer.send('disconnect-mt');
  updateMTStatus(false, null);
  showNotification('Disconnected', 'MT connection closed');
}

function updateMTStatus(connected, version) {
  state.mtConnected = connected;
  state.mtVersion = version;
  
  elements.mtStatus?.classList.toggle('connected', connected);
  if (elements.mtIndicator) elements.mtIndicator.textContent = connected ? version?.toUpperCase() || 'MT' : 'MT';
  elements.mtStatus && (elements.mtStatus.title = connected ? `${version?.toUpperCase()} Connected` : 'MT Not Connected');
  
  if (elements.mtSettingsStatus) {
    elements.mtSettingsStatus.classList.toggle('connected', connected);
    elements.mtSettingsStatus.innerHTML = connected 
      ? `<div class="mt-status-indicator connected"><i class="fas fa-check-circle"></i><span>${version?.toUpperCase()} Connected</span></div>`
      : `<div class="mt-status-indicator disconnected"><i class="fas fa-unlink"></i><span>Not Connected</span></div>`;
  }
}

// ==================== COMMAND HELPERS ====================

function sendCommand(command, data = {}) {
  if (state.isLocked && isProtectedCommand(command)) {
    showNotification('Locked', 'Unlock to execute trades');
    return;
  }
  
  if (state.settings.propFirm.enabled && state.settings.propFirm.newsBlock && state.newsAlert) {
    if (state.newsAlert.minutesUntil <= state.settings.news.minutesBefore) {
      showNotification('Prop Firm Restriction', 'Trading blocked during high-impact news');
      return;
    }
  }
  
  ipcRenderer.send('send-command', {
    type: `trade.${command}`,
    data: {
      ...data,
      magicKey: state.settings.mtConnection.magicKey
    }
  });
  
  showNotification('Command Sent', command.replace(/_/g, ' ').toUpperCase());
}

function isProtectedCommand(command) {
  const protectedCommands = ['open_trade', 'plan_trade', 'close_all', 'close_half', 'partial_tp', 'custom_close'];
  return protectedCommands.includes(command);
}

function connectToServer() {
  ipcRenderer.send('connect-server', { token: state.token, userId: state.user?.id });
  startNewsCountdown();
}

// ==================== NEWS ====================

async function fetchNews() {
  try {
    const currencies = state.settings.news.currencies;
    const impactLevels = state.settings.news.impactLevels;
    
    const response = await fetch(`${API_BASE_URL}/news/alert?currencies=${currencies.join(',')}&impact=${impactLevels.join(',')}`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    
    const data = await response.json();
    
    if (data.success && data.alert) {
      updateNewsPanel(data.alert);
    } else {
      elements.newsPanel?.classList.add('hidden');
    }
  } catch (error) {
    console.error('Failed to fetch news:', error);
  }
}

function updateNewsPanel(news) {
  state.newsAlert = news;
  
  if (elements.newsTitle) elements.newsTitle.textContent = `${news.currency} - ${news.event}`;
  if (elements.newsImpact) elements.newsImpact.textContent = `IMPACT: ${news.impact.toUpperCase()}`;
  elements.newsPanel?.classList.remove('hidden');
  
  updateCountdown();
}

function updateCountdown() {
  if (!state.newsAlert || !elements.newsCountdown) return;
  
  const minutesUntil = state.newsAlert.minutesUntil;
  
  if (minutesUntil <= 0) {
    elements.newsCountdown.textContent = 'LIVE NOW';
    elements.newsCountdown.style.color = 'var(--color-red)';
  } else if (minutesUntil < 60) {
    elements.newsCountdown.textContent = `T-${minutesUntil}M`;
    elements.newsCountdown.style.color = 'var(--color-orange)';
  } else {
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    elements.newsCountdown.textContent = `T-${hours}H ${mins}M`;
    elements.newsCountdown.style.color = 'var(--color-yellow)';
  }
}

function startNewsCountdown() {
  if (state.isLoggedIn) fetchNews();
  
  state.newsCountdownInterval = setInterval(() => {
    if (state.newsAlert) {
      state.newsAlert.minutesUntil--;
      updateCountdown();
      if (state.newsAlert.minutesUntil % 5 === 0) fetchNews();
    }
  }, 60000);
  
  setInterval(fetchNews, 300000);
}

// ==================== UI HELPERS ====================

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'flex';
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

let confirmCallback = null;

function confirmAction(title, message, callback) {
  if (elements.confirmTitle) elements.confirmTitle.textContent = title;
  if (elements.confirmMessage) elements.confirmMessage.textContent = message;
  confirmCallback = callback;
  
  if (elements.confirmAction) {
    elements.confirmAction.onclick = () => {
      if (confirmCallback) confirmCallback();
      hideModal('confirmModal');
    };
  }
  
  showModal('confirmModal');
}

// ==================== AUTO BE - TOGGLE WITH GLOW ====================

// Single click: Toggle Auto BE on/off
// Long press: Open Auto BE settings

function handleAutoBEClick() {
  toggleAutoBE();
}

function handleAutoBELongPress() {
  // Open Auto BE settings tab in settings modal
  showModal('settingsModal');
  switchTab('autobe');
}

function toggleAutoBE() {
  state.settings.autoBreakeven.enabled = !state.settings.autoBreakeven.enabled;
  state.autoBE = state.settings.autoBreakeven.enabled;
  
  // Update UI with glow effect
  elements.autoBeBtn?.classList.toggle('active', state.autoBE);
  elements.autoBeBtn?.classList.toggle('glowing', state.autoBE);
  
  if (elements.autoBeIndicator) {
    elements.autoBeIndicator.textContent = state.autoBE ? 'ON' : 'OFF';
    elements.autoBeIndicator.classList.toggle('active', state.autoBE);
  }
  
  sendCommand('auto_be', { 
    enabled: state.autoBE,
    triggerPips: state.settings.autoBreakeven.triggerPips,
    plusPips: state.settings.autoBreakeven.plusPips,
    slPosition: state.settings.autoBreakeven.slPosition
  });
  
  updateToggleGlowEffects();
  
  showNotification('Auto BE', state.autoBE ? `Auto Breakeven enabled (${state.settings.autoBreakeven.triggerPips} pips)` : 'Auto Breakeven disabled');
}

// ==================== GLOWING EFFECTS FOR ACTIVE TOGGLES ====================

function updateToggleGlowEffects() {
  // Partial TP glow
  if (state.activePartialTP) {
    elements.partialTPBtn?.classList.add('active-glow-partial');
  } else {
    elements.partialTPBtn?.classList.remove('active-glow-partial');
  }
  
  // Target Default glow
  if (state.targetDefault.enabled) {
    elements.targetDefaultBtn?.classList.add('active-glow-target');
  } else {
    elements.targetDefaultBtn?.classList.remove('active-glow-target');
  }
  
  // Auto BE glow
  if (state.settings.autoBreakeven.enabled) {
    elements.autoBeBtn?.classList.add('active-glow-autobe');
  } else {
    elements.autoBeBtn?.classList.remove('active-glow-autobe');
  }
}

// ==================== PROP FIRM MODE ====================

function updatePropFirmStatus() {
  if (!state.settings.propFirm.enabled) return;
  
  const settings = state.settings.propFirm;
  const currentLoss = Math.abs(Math.min(0, state.openPL));
  const totalLoss = state.dailyLoss + (settings.includeFloating ? currentLoss : 0);
  const remaining = Math.max(0, settings.dailyLossLimit - totalLoss);
  const lossPercent = (totalLoss / state.accountBalance) * 100;
  
  // Update UI
  if (elements.todayLoss) {
    elements.todayLoss.textContent = `$${totalLoss.toFixed(2)}`;
    elements.todayLoss.className = totalLoss > settings.dailyLossLimit * 0.8 ? 'stat-value danger' : 
                                     totalLoss > settings.dailyLossLimit * 0.5 ? 'stat-value warning' : 'stat-value';
  }
  
  if (elements.remainingLimit) {
    elements.remainingLimit.textContent = `$${remaining.toFixed(2)}`;
  }
  
  if (elements.propStatusText) {
    if (totalLoss >= settings.dailyLossLimit) {
      elements.propStatusText.textContent = 'LIMIT HIT';
      elements.propStatusText.className = 'stat-value danger';
    } else if (lossPercent >= settings.dailyLossPercent * 0.8) {
      elements.propStatusText.textContent = 'WARNING';
      elements.propStatusText.className = 'stat-value warning';
    } else {
      elements.propStatusText.textContent = 'SAFE';
      elements.propStatusText.className = 'stat-value safe';
    }
  }
  
  // Check if limit hit and close trades if enabled
  if (totalLoss >= settings.dailyLossLimit) {
    if (settings.closeOpenTrades && state.positionCount > 0) {
      sendCommand('close_all');
      showNotification('Prop Firm Protection', 'Daily loss limit reached - All trades closed');
    } else if (settings.preventNewTrades) {
      showNotification('Prop Firm Block', 'Daily loss limit reached - New trades blocked');
    }
  }
}

function checkPropFirmBeforeTrade() {
  if (!state.settings.propFirm.enabled) return true;
  
  const settings = state.settings.propFirm;
  const currentLoss = Math.abs(Math.min(0, state.openPL));
  const totalLoss = state.dailyLoss + (settings.includeFloating ? currentLoss : 0);
  
  if (totalLoss >= settings.dailyLossLimit && settings.preventNewTrades) {
    showNotification('Prop Firm Block', 'Daily loss limit reached - Cannot open new trades');
    return false;
  }
  
  return true;
}

// ==================== AI TRADE ANALYSIS REPORT ====================

function updateAIReportUI() {
  const ai = state.settings.ai;
  
  // Update report usage
  if (elements.reportUsage) {
    elements.reportUsage.textContent = `${ai.reportsThisWeek}/2 used this week`;
  }
  
  // Update next report date
  if (elements.nextReportDate) {
    const nextWeekly = getNextWeeklyReportDate();
    elements.nextReportDate.textContent = ai.autoReports ? `Weekly: ${nextWeekly.toLocaleDateString()}` : 'Manual Only';
  }
  
  // Update stats if we have data
  if (state.userBehavior.tradeCount > 0) {
    if (elements.aiWinRate) elements.aiWinRate.textContent = `${state.userBehavior.winRate.toFixed(1)}%`;
    if (elements.aiBestPair) elements.aiBestPair.textContent = state.userBehavior.preferredPairs[0] || '--';
    if (elements.aiAvgRR) elements.aiAvgRR.textContent = `1:${state.userBehavior.avgRR.toFixed(1)}`;
    if (elements.aiTotalTrades) elements.aiTotalTrades.textContent = state.userBehavior.tradeCount.toString();
  }
  
  // Update insights
  updateAIInsights();
  
  // Update previous reports list
  renderPreviousReports();
}

function getNextWeeklyReportDate() {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()));
  nextSunday.setHours(0, 0, 0, 0);
  return nextSunday;
}

function updateAIInsights() {
  if (!elements.insightsList) return;
  
  const insights = generateAIInsights();
  
  if (insights.length === 0) {
    elements.insightsList.innerHTML = '<li>Generate your first report to see AI insights</li>';
  } else {
    elements.insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
  }
}

function generateAIInsights() {
  const insights = [];
  const behavior = state.userBehavior;
  
  if (behavior.tradeCount === 0) return insights;
  
  // Win rate insight
  if (behavior.winRate < 40) {
    insights.push('Your win rate is below 40%. Consider reviewing your entry criteria and waiting for higher-probability setups.');
  } else if (behavior.winRate > 60) {
    insights.push('Excellent win rate! Your strategy is working well. Consider slightly increasing position sizes.');
  }
  
  // R:R insight
  if (behavior.avgRR < 1.5) {
    insights.push('Your average risk-to-reward ratio is low. Try to aim for at least 1:2 R:R on your trades.');
  } else if (behavior.avgRR > 2.5) {
    insights.push('Great R:R ratio! You are maximizing your winners effectively.');
  }
  
  // SL insight
  if (behavior.avgSLPips > 50) {
    insights.push('Your stop losses are quite wide. Consider tighter stops or trading lower timeframes.');
  }
  
  // Preferred pairs
  if (behavior.preferredPairs.length > 5) {
    insights.push(`You're trading ${behavior.preferredPairs.length} different pairs. Focus on 2-3 pairs to master them.`);
  }
  
  // Trade frequency
  if (behavior.tradeCount > 20) {
    insights.push('High trading frequency detected. Quality over quantity - fewer, higher-probability trades may improve results.');
  }
  
  return insights;
}

async function generateAIReport() {
  const ai = state.settings.ai;
  
  // Check if user can generate report (max 2 per week)
  if (ai.reportsThisWeek >= 2) {
    showNotification('Report Limit', 'You have used all 2 manual reports for this week. Next report available on Sunday.');
    return;
  }
  
  // Generate report
  const report = {
    id: Date.now(),
    date: new Date().toISOString(),
    type: 'manual',
    winRate: state.userBehavior.winRate,
    avgRR: state.userBehavior.avgRR,
    avgSLPips: state.userBehavior.avgSLPips,
    avgTPPips: state.userBehavior.avgTPPips,
    preferredPairs: [...state.userBehavior.preferredPairs],
    totalTrades: state.userBehavior.tradeCount,
    insights: generateAIInsights(),
    recommendations: generateRecommendations()
  };
  
  // Save report
  state.aiReports.unshift(report);
  ai.reportsThisWeek++;
  ai.lastReportDate = new Date().toISOString();
  
  // Save to localStorage
  localStorage.setItem('chartwise_ai_reports', JSON.stringify(state.aiReports));
  localStorage.setItem('chartwise_ai_settings', JSON.stringify(ai));
  
  // Update UI
  updateAIReportUI();
  
  showNotification('AI Report Generated', 'Your trade analysis report is ready!');
}

function generateRecommendations() {
  const recommendations = [];
  const behavior = state.userBehavior;
  
  if (behavior.winRate < 50) {
    recommendations.push('Consider using a trade journal to identify patterns in losing trades');
    recommendations.push('Wait for confirmation before entering - avoid FOMO trades');
  }
  
  if (behavior.avgRR < 2) {
    recommendations.push('Set take profit at least 2x your stop loss distance');
    recommendations.push('Consider trailing stops to maximize winning trades');
  }
  
  recommendations.push('Review your trades weekly to identify areas for improvement');
  recommendations.push('Stick to your trading plan and avoid emotional decisions');
  
  return recommendations;
}

function renderPreviousReports() {
  if (!elements.previousReportsList) return;
  
  if (state.aiReports.length === 0) {
    elements.previousReportsList.innerHTML = '<div class="no-reports">No reports generated yet</div>';
    return;
  }
  
  elements.previousReportsList.innerHTML = state.aiReports.slice(0, 5).map(report => `
    <div class="report-item">
      <div>
        <div class="report-date">${new Date(report.date).toLocaleDateString()}</div>
        <div class="report-type">${report.type === 'manual' ? 'Manual' : 'Auto'} Report</div>
      </div>
      <button class="view-report-btn" onclick="viewReport(${report.id})">View</button>
    </div>
  `).join('');
}

function viewReport(reportId) {
  const report = state.aiReports.find(r => r.id === reportId);
  if (report) {
    state.currentReport = report;
    showNotification('Report', `Viewing report from ${new Date(report.date).toLocaleDateString()}`);
    // In a real implementation, this would open a detailed report view
  }
}

// Reset weekly report counter on Sunday
function checkWeeklyReset() {
  const lastReset = localStorage.getItem('chartwise_last_reset');
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  
  if (lastReset) {
    const lastResetWeek = getWeekNumber(new Date(lastReset));
    if (currentWeek !== lastResetWeek) {
      // New week - reset counter
      state.settings.ai.reportsThisWeek = 0;
      localStorage.setItem('chartwise_ai_settings', JSON.stringify(state.settings.ai));
      localStorage.setItem('chartwise_last_reset', now.toISOString());
      
      // Generate auto report if enabled
      if (state.settings.ai.autoReports) {
        generateAutoReport();
      }
    }
  } else {
    localStorage.setItem('chartwise_last_reset', now.toISOString());
  }
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function generateAutoReport() {
  const report = {
    id: Date.now(),
    date: new Date().toISOString(),
    type: 'auto',
    winRate: state.userBehavior.winRate,
    avgRR: state.userBehavior.avgRR,
    avgSLPips: state.userBehavior.avgSLPips,
    avgTPPips: state.userBehavior.avgTPPips,
    preferredPairs: [...state.userBehavior.preferredPairs],
    totalTrades: state.userBehavior.tradeCount,
    insights: generateAIInsights(),
    recommendations: generateRecommendations()
  };
  
  state.aiReports.unshift(report);
  localStorage.setItem('chartwise_ai_reports', JSON.stringify(state.aiReports));
  
  showNotification('Weekly AI Report', 'Your automated weekly trading report is ready!');
}

function showNotification(title, body) {
  console.log(`[Notification] ${title}: ${body}`);
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-body">${body}</div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==================== IPC HANDLERS ====================

ipcRenderer.on('connection-status', (event, data) => {
  elements.connectionStatus?.classList.toggle('connected', data.connected);
});

ipcRenderer.on('mt-status', (event, data) => {
  updateMTStatus(data.connected, data.version);
});

ipcRenderer.on('server-message', (event, message) => {
  if (message.type === 'account_update') {
    if (message.data.balance !== undefined) {
      state.accountBalance = message.data.balance;
      if (elements.accountBalance) elements.accountBalance.textContent = `$${message.data.balance.toFixed(2)}`;
    }
    if (message.data.openPL !== undefined) {
      state.openPL = message.data.openPL;
      if (elements.openPL) {
        elements.openPL.textContent = `$${message.data.openPL.toFixed(2)}`;
        elements.openPL.classList.toggle('positive', message.data.openPL > 0);
        elements.openPL.classList.toggle('negative', message.data.openPL < 0);
      }
    }
    if (message.data.positions !== undefined && elements.positionCount) {
      elements.positionCount.textContent = message.data.positions;
    }
  }
  
  // Market data update from MT4
  if (message.type === 'market_data') {
    if (message.data.symbol) {
      state.currentSymbol = message.data.symbol;
      if (elements.calcSymbolDisplay) elements.calcSymbolDisplay.textContent = message.data.symbol;
    }
    if (message.data.bid !== undefined) {
      state.currentPrice = message.data.bid;
      if (elements.currentPriceDisplay) elements.currentPriceDisplay.textContent = message.data.bid.toFixed(5);
    }
    if (message.data.point !== undefined) {
      state.pointValue = message.data.point;
      state.pipValue = message.data.point * 10; // 1 pip = 10 points for most pairs
    }
  }
  
  // Line update from MT4 (when user drags lines on chart)
  if (message.type === 'line_update') {
    if (message.data.lineType === 'SL' && elements.calcSLInput) {
      elements.calcSLInput.value = message.data.price.toFixed(5);
      updateCalculatorFromSL();
    }
    if (message.data.lineType === 'TP' && elements.calcTPInput) {
      elements.calcTPInput.value = message.data.price.toFixed(5);
      updateCalculatorFromTP();
    }
  }
});

// ==================== KEYBOARD SHORTCUTS ====================

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
    e.preventDefault();
    toggleLock();
  }
  
  if (e.key === 'Escape') {
    hideModal('settingsModal');
    hideModal('aiSettingsModal');
    hideModal('planTradeModal');
    hideModal('openTradeModal');
    hideModal('partialTPModal');
    hideModal('customCloseModal');
    hideModal('confirmModal');
    hideModal('autoBeSettingsModal');
    hideModal('targetDefaultModal');
  }
});

// ==================== LONG PRESS HELPER (IMPROVED) ====================

function addClickAndLongPress(element, clickHandler, longPressHandler) {
  if (!element) return;
  
  let pressTimer = null;
  let isLongPress = false;
  let isPressed = false;
  
  const startPress = (e) => {
    if (e.button === 2) return; // Ignore right click
    isPressed = true;
    isLongPress = false;
    
    pressTimer = setTimeout(() => {
      if (isPressed) {
        isLongPress = true;
        isPressed = false;
        // Add haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
        longPressHandler();
      }
    }, state.longPressDuration);
  };
  
  const endPress = (e) => {
    clearTimeout(pressTimer);
    if (isPressed && !isLongPress) {
      isPressed = false;
      clickHandler();
    }
    isPressed = false;
  };
  
  const cancelPress = () => {
    clearTimeout(pressTimer);
    isPressed = false;
    isLongPress = false;
  };
  
  // Mouse events
  element.addEventListener('mousedown', startPress);
  element.addEventListener('mouseup', endPress);
  element.addEventListener('mouseleave', cancelPress);
  element.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent context menu
  
  // Touch events
  element.addEventListener('touchstart', (e) => {
    startPress(e.touches[0]);
  }, { passive: true });
  element.addEventListener('touchend', endPress);
  element.addEventListener('touchcancel', cancelPress);
}

// ==================== AI SUGGESTIONS (COMING SOON) ====================

/*
AI CONDITIONS - SUGGESTED FEATURES:

1. USER BEHAVIOR ANALYSIS (Implemented)
   - Track user's average SL/TP in pips
   - Track preferred R:R ratios
   - Track most traded pairs
   - Track win rate and trade duration
   - Auto-suggest settings based on patterns

2. SMART RISK ADJUSTMENT (Coming Soon)
   - Adjust risk % based on recent performance
   - Reduce size after consecutive losses
   - Increase size during winning streaks (optional)

3. MARKET CONDITION ADAPTATION (Coming Soon)
   - Detect high volatility periods
   - Suggest wider SL during news
   - Recommend avoiding trades during low liquidity

4. TRADE PATTERN RECOGNITION (Coming Soon)
   - Identify user's most profitable setups
   - Alert when similar conditions occur
   - Warn against repetitive losing patterns

5. OPTIMAL EXIT SUGGESTIONS (Coming Soon)
   - Suggest partial TP levels based on S/R
   - Recommend moving to breakeven based on price action
   - Alert when target is near major level

6. SESSION-BASED RULES (Coming Soon)
   - Different rules for London/NY/Asian sessions
   - Adjust risk based on time of day
   - Weekend position warnings
*/
