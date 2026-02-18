/**
 * ChartWise Desktop App - Main Process
 * Electron app with draggable floating window
 */

const { app, BrowserWindow, ipcMain, screen, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');
const WebSocket = require('ws');

// App configuration
const CONFIG = {
  windowWidth: 420,
  windowHeight: 750,
  serverUrl: 'ws://127.0.0.1:3001',
  reconnectInterval: 5000
};

let mainWindow = null;
let tray = null;
let ws = null;
let isConnected = false;
let reconnectTimer = null;

// ==================== WINDOW MANAGEMENT ====================

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: CONFIG.windowWidth,
    height: CONFIG.windowHeight,
    x: width - CONFIG.windowWidth - 20,
    y: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    minimizable: true,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Make window draggable
  mainWindow.setMovable(true);

  // Handle window events
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', () => {
    mainWindow.hide();
  });

  // Create tray icon
  createTray();

  // Register global shortcuts
  registerShortcuts();

  // Connect to backend
  connectToServer();

  return mainWindow;
}

function createTray() {
  tray = new Tray(path.join(__dirname, '../assets/icon_16x16.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show ChartWise',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Hide ChartWise',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Connection Status',
      enabled: false
    },
    {
      label: isConnected ? '✓ Connected' : '✗ Disconnected',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quick Actions',
      submenu: [
        { label: 'Close All Trades', click: () => sendCommand('close_all') },
        { label: 'Move to Breakeven', click: () => sendCommand('move_be_all') },
        { label: 'Refresh Status', click: () => sendCommand('get_status') }
      ]
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('ChartWise Trade Manager');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function registerShortcuts() {
  // Toggle window visibility
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Emergency close all
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    sendCommand('close_all');
  });
}

// ==================== WEBSOCKET CONNECTION ====================

function connectToServer() {
  if (ws) {
    ws.close();
  }

  try {
    ws = new WebSocket(CONFIG.serverUrl, {
      headers: {
        'x-client-type': 'desktop'
      }
    });

    ws.on('open', () => {
      console.log('Connected to ChartWise server');
      isConnected = true;
      updateConnectionStatus(true);

      // Request initial status
      sendToServer({
        type: 'get_status'
      });
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        handleServerMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Disconnected from server');
      isConnected = false;
      updateConnectionStatus(false);

      // Reconnect
      reconnectTimer = setTimeout(connectToServer, CONFIG.reconnectInterval);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      isConnected = false;
      updateConnectionStatus(false);
    });

  } catch (error) {
    console.error('Connection error:', error);
    reconnectTimer = setTimeout(connectToServer, CONFIG.reconnectInterval);
  }
}

function sendToServer(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function handleServerMessage(message) {
  // Forward to renderer
  if (mainWindow) {
    mainWindow.webContents.send('server-message', message);
  }

  // Handle specific message types
  switch (message.type) {
    case 'trade_executed':
      showNotification('Trade Executed', message.data.message || 'Trade executed successfully');
      break;
    case 'trade_closed':
      showNotification('Trade Closed', message.data.message || 'Trade closed');
      break;
    case 'ai_suggestion':
      showNotification('AI Suggestion', message.data.suggestion);
      break;
    case 'news_alert':
      showNotification('News Alert', `${message.data.event} - ${message.data.impact} impact`);
      break;
  }
}

function updateConnectionStatus(connected) {
  isConnected = connected;

  if (mainWindow) {
    mainWindow.webContents.send('connection-status', { connected });
  }

  // Update tray menu
  if (tray) {
    createTray();
  }
}

// ==================== IPC HANDLERS ====================

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-connection-status', () => {
  return { connected: isConnected };
});

ipcMain.on('send-command', (event, command) => {
  sendCommand(command);
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.on('toggle-always-on-top', (event, enabled) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(enabled);
  }
});

ipcMain.on('resize-window', (event, width, height) => {
  if (mainWindow) {
    mainWindow.setSize(width, height);
  }
});

ipcMain.on('move-window', (event, x, y) => {
  if (mainWindow) {
    mainWindow.setPosition(x, y);
  }
});

// ==================== COMMAND HELPERS ====================

function sendCommand(command, data = {}) {
  sendToServer({
    type: 'command',
    command,
    data,
    timestamp: Date.now()
  });
}

function showNotification(title, body) {
  if (mainWindow) {
    mainWindow.webContents.send('notification', { title, body });
  }
}

// ==================== APP EVENTS ====================

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  if (ws) {
    ws.close();
  }
});

app.on('will-quit', () => {
  if (app.isReady()) {
    globalShortcut.unregisterAll();
  }
});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}
