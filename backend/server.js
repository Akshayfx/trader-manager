/**
 * ChartWise Backend Server v2.0
 * Central hub with admin dashboard, user management, and economic calendar
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const logger = require('./utils/logger');
const { initDatabase } = require('./database/db');
const { authenticateToken, requireAdmin } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const tradeRoutes = require('./routes/trades');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news');
const propFirmRoutes = require('./routes/propfirm');
const mtRoutes = require('./routes/mt');

// Services
const newsService = require('./services/newsService');
const aiService = require('./services/aiService');
// const mtService = require('./services/mtService');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', apiLimiter);

// Connected clients
const clients = new Map();
const mt4Connections = new Map(); // Key: magicKey, Value: Map of client connections
const mt5Connections = new Map(); // Key: magicKey, Value: Map of client connections
const desktopConnections = new Map();
const mobileConnections = new Map();

// Active sessions
const activeSessions = new Map();

// Magic Key Registry - tracks which magic keys are in use
const magicKeyRegistry = new Map();

// Initialize database
initDatabase();

// ==================== WEBSOCKET HANDLING ====================

wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  const clientType = req.headers['x-client-type'] || 'unknown';
  const userId = req.headers['x-user-id'];
  const token = req.headers['x-auth-token'];
  const magicKey = req.headers['x-magic-key'] || 'DEFAULT';

  logger.info(`New ${clientType} connection: ${clientId} (Magic Key: ${magicKey})`);

  clients.set(clientId, {
    ws,
    type: clientType,
    userId,
    token,
    magicKey: magicKey.toUpperCase(),
    connectedAt: new Date(),
    lastPing: Date.now(),
    mtConnected: false,
    mtVersion: null
  });

  // Categorize connections with magic key support
  if (clientType === 'mt4') {
    const key = magicKey.toUpperCase();
    if (!mt4Connections.has(key)) {
      mt4Connections.set(key, new Map());
    }
    mt4Connections.get(key).set(clientId, clients.get(clientId));
    clients.get(clientId).mtConnected = true;
    clients.get(clientId).mtVersion = 'MT4';
    magicKeyRegistry.set(key, { type: 'MT4', connectedAt: new Date() });
    broadcastToAll({ type: 'mt_status', data: { connected: true, version: 'MT4', magicKey: key } });
  } else if (clientType === 'mt5') {
    const key = magicKey.toUpperCase();
    if (!mt5Connections.has(key)) {
      mt5Connections.set(key, new Map());
    }
    mt5Connections.get(key).set(clientId, clients.get(clientId));
    clients.get(clientId).mtConnected = true;
    clients.get(clientId).mtVersion = 'MT5';
    magicKeyRegistry.set(key, { type: 'MT5', connectedAt: new Date() });
    broadcastToAll({ type: 'mt_status', data: { connected: true, version: 'MT5', magicKey: key } });
  } else if (clientType === 'desktop') {
    desktopConnections.set(clientId, clients.get(clientId));
  } else if (clientType === 'mobile') {
    mobileConnections.set(clientId, clients.get(clientId));
  }

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    message: 'Connected to ChartWise Server',
    mtStatus: {
      mt4: mt4Connections.size > 0,
      mt5: mt5Connections.size > 0
    }
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(clientId, clientType, message);
    } catch (error) {
      logger.error('Invalid message format:', error);
      sendToClient(clientId, { type: 'error', message: 'Invalid message format' });
    }
  });

  ws.on('close', () => {
    logger.info(`Client disconnected: ${clientId}`);
    const client = clients.get(clientId);
    if (client && client.mtConnected) {
      const key = client.magicKey;
      // Remove from magic key connections
      if (client.mtVersion === 'MT4' && mt4Connections.has(key)) {
        mt4Connections.get(key).delete(clientId);
        if (mt4Connections.get(key).size === 0) {
          mt4Connections.delete(key);
          magicKeyRegistry.delete(key);
        }
      } else if (client.mtVersion === 'MT5' && mt5Connections.has(key)) {
        mt5Connections.get(key).delete(clientId);
        if (mt5Connections.get(key).size === 0) {
          mt5Connections.delete(key);
          magicKeyRegistry.delete(key);
        }
      }
      broadcastToAll({ type: 'mt_status', data: { connected: false, version: client.mtVersion, magicKey: key } });
    }
    clients.delete(clientId);
    desktopConnections.delete(clientId);
    mobileConnections.delete(clientId);
  });

  ws.on('error', (error) => {
    logger.error(`WebSocket error for ${clientId}:`, error);
  });
});

// Handle incoming messages
function handleMessage(clientId, clientType, message) {
  logger.info(`Message from ${clientType} (${clientId}):`, message.type);

  switch (message.type) {
    case 'ping':
      sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
      break;

    case 'trade.execute':
      handleTradeExecution(clientId, message);
      break;

    case 'trade.close':
      handleTradeClose(clientId, message);
      break;

    case 'trade.partial_close':
      handlePartialClose(clientId, message);
      break;

    case 'trade.modify_sl':
      handleModifySL(clientId, message);
      break;

    case 'trade.modify_tp':
      handleModifyTP(clientId, message);
      break;

    case 'position.status':
      handlePositionStatus(clientId, message);
      break;

    case 'account.status':
      handleAccountStatus(clientId, message);
      break;

    case 'mt.connect':
      handleMTConnect(clientId, message);
      break;

    case 'mt.disconnect':
      handleMTDisconnect(clientId, message);
      break;

    case 'ai.query':
      handleAIQuery(clientId, message);
      break;

    case 'ai.suggestion':
      handleAISuggestion(clientId, message);
      break;

    case 'news.alert':
      handleNewsAlert(clientId, message);
      break;

    case 'settings.update':
      handleSettingsUpdate(clientId, message);
      break;

    case 'settings.sync':
      handleSettingsSync(clientId, message);
      break;

    case 'mobile.command':
      handleMobileCommand(clientId, message);
      break;

    case 'get_status':
      sendToClient(clientId, {
        type: 'server_status',
        data: {
          mt4: mt4Connections.size > 0,
          mt5: mt5Connections.size > 0,
          clients: clients.size
        }
      });
      break;

    case 'command':
      handleCommand(clientId, message);
      break;

    case 'propfirm.status':

    default:
      logger.warn(`Unknown message type: ${message.type}`);
      sendToClient(clientId, { type: 'error', message: 'Unknown message type' });
  }
}

// ==================== TRADE HANDLERS ====================

function handleTradeExecution(clientId, message) {
  const { symbol, orderType, lotSize, stopLoss, takeProfit, riskPercent, magicKey } = message.data;
  const key = magicKey ? magicKey.toUpperCase() : 'DEFAULT';

  logger.info(`Trade execution request: ${symbol} ${orderType} ${lotSize} lots (Key: ${key})`);

  // Try MT4 first, then MT5
  if (mt4Connections.has(key)) {
    broadcastToMT4({
      type: 'execute_trade',
      clientId,
      data: { symbol, orderType, lotSize, stopLoss, takeProfit, riskPercent, timestamp: Date.now() }
    }, key);
  } else if (mt5Connections.has(key)) {
    broadcastToMT5({
      type: 'execute_trade',
      clientId,
      data: { symbol, orderType, lotSize, stopLoss, takeProfit, riskPercent, timestamp: Date.now() }
    }, key);
  } else {
    // Fallback to any available connection
    broadcastToMT4({
      type: 'execute_trade',
      clientId,
      data: { symbol, orderType, lotSize, stopLoss, takeProfit, riskPercent, timestamp: Date.now() }
    });
  }

  broadcastToDesktop({ type: 'trade_executing', data: { symbol, orderType, lotSize } });
  broadcastToMobile({ type: 'trade_executing', data: { symbol, orderType, lotSize } });
}

function handleTradeClose(clientId, message) {
  const { ticket, symbol, magicKey } = message.data;
  const key = magicKey ? magicKey.toUpperCase() : 'DEFAULT';
  logger.info(`Trade close request: Ticket #${ticket} (Key: ${key})`);

  if (mt4Connections.has(key)) {
    broadcastToMT4({ type: 'close_trade', clientId, data: { ticket, symbol } }, key);
  } else if (mt5Connections.has(key)) {
    broadcastToMT5({ type: 'close_trade', clientId, data: { ticket, symbol } }, key);
  } else {
    broadcastToMT4({ type: 'close_trade', clientId, data: { ticket, symbol } });
  }
}

function handlePartialClose(clientId, message) {
  const { ticket, percent, symbol, magicKey } = message.data;
  const key = magicKey ? magicKey.toUpperCase() : 'DEFAULT';
  logger.info(`Partial close request: Ticket #${ticket}, ${percent}% (Key: ${key})`);

  if (mt4Connections.has(key)) {
    broadcastToMT4({ type: 'partial_close', clientId, data: { ticket, percent, symbol } }, key);
  } else if (mt5Connections.has(key)) {
    broadcastToMT5({ type: 'partial_close', clientId, data: { ticket, percent, symbol } }, key);
  } else {
    broadcastToMT4({ type: 'partial_close', clientId, data: { ticket, percent, symbol } });
  }
}

function handleModifySL(clientId, message) {
  const { ticket, newSL, magicKey } = message.data;
  const key = magicKey ? magicKey.toUpperCase() : 'DEFAULT';

  if (mt4Connections.has(key)) {
    broadcastToMT4({ type: 'modify_sl', clientId, data: { ticket, newSL } }, key);
  } else if (mt5Connections.has(key)) {
    broadcastToMT5({ type: 'modify_sl', clientId, data: { ticket, newSL } }, key);
  } else {
    broadcastToMT4({ type: 'modify_sl', clientId, data: { ticket, newSL } });
  }
}

function handleModifyTP(clientId, message) {
  const { ticket, newTP, magicKey } = message.data;
  const key = magicKey ? magicKey.toUpperCase() : 'DEFAULT';

  if (mt4Connections.has(key)) {
    broadcastToMT4({ type: 'modify_tp', clientId, data: { ticket, newTP } }, key);
  } else if (mt5Connections.has(key)) {
    broadcastToMT5({ type: 'modify_tp', clientId, data: { ticket, newTP } }, key);
  } else {
    broadcastToMT4({ type: 'modify_tp', clientId, data: { ticket, newTP } });
  }
}

function handlePositionStatus(clientId, message) {
  broadcastToAll({ type: 'position_update', data: message.data });
}

function handleAccountStatus(clientId, message) {
  broadcastToAll({ type: 'account_update', data: message.data });
}

// ==================== MT CONNECTION HANDLERS ====================

function handleMTConnect(clientId, message) {
  const { version, accountInfo } = message.data;
  const client = clients.get(clientId);
  if (client) {
    client.mtConnected = true;
    client.mtVersion = version;
    client.accountInfo = accountInfo;
  }

  logger.info(`MT${version} connected: ${clientId}`);

  broadcastToAll({
    type: 'mt_status',
    data: { connected: true, version, accountInfo }
  });
}

function handleMTDisconnect(clientId, message) {
  const client = clients.get(clientId);
  if (client) {
    client.mtConnected = false;
    client.mtVersion = null;
  }

  logger.info(`MT disconnected: ${clientId}`);

  broadcastToAll({
    type: 'mt_status',
    data: { connected: false }
  });
}

// ==================== AI HANDLERS ====================

async function handleAIQuery(clientId, message) {
  const { query, context } = message.data;
  try {
    const response = await aiService.processQuery(query, context);
    sendToClient(clientId, { type: 'ai_response', data: response });
  } catch (error) {
    logger.error('AI query error:', error);
    sendToClient(clientId, { type: 'ai_error', message: 'Failed to process AI query' });
  }
}

function handleAISuggestion(clientId, message) {
  const { suggestion, priority } = message.data;
  broadcastToAll({ type: 'ai_suggestion', data: { suggestion, priority, timestamp: Date.now() } });
}

// ==================== NEWS HANDLERS ====================

function handleNewsAlert(clientId, message) {
  const { event, impact, timeUntil } = message.data;
  broadcastToAll({ type: 'news_alert', data: { event, impact, timeUntil } });
}

// ==================== SETTINGS HANDLERS ====================

function handleSettingsUpdate(clientId, message) {
  const { userId, settings } = message.data;
  broadcastToAll({ type: 'settings_updated', data: { userId, settings } });
}

function handleSettingsSync(clientId, message) {
  const { userId, settings } = message.data;
  // Sync settings to all user's devices
  clients.forEach((client, id) => {
    if (client.userId === userId && id !== clientId) {
      sendToClient(id, { type: 'settings_sync', data: settings });
    }
  });
}

// ==================== MOBILE HANDLERS ====================

function handleMobileCommand(clientId, message) {
  const { command, data } = message.data;
  broadcastToDesktop({ type: 'mobile_command', data: { command, ...data } });
  broadcastToMT4({ type: 'mobile_command', data: { command, ...data } });
}

// ==================== PROP FIRM HANDLERS ====================

function handlePropFirmStatus(clientId, message) {
  const { status, limits } = message.data;
  broadcastToAll({ type: 'propfirm_status', data: { status, limits } });
}

function handleCommand(clientId, message) {
  const { command, data } = message;
  logger.info(`Command from desktop (${clientId}): ${command}`);

  // Broadcast command to MT4/MT5
  broadcastToMT4({ type: 'command', command, data });
  broadcastToMT5({ type: 'command', command, data });
}

// ==================== BROADCAST HELPERS ====================

function sendToClient(clientId, message) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

function broadcastToAll(message) {
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

function broadcastToMT4(message, magicKey = null) {
  if (magicKey && mt4Connections.has(magicKey)) {
    // Send to specific magic key
    mt4Connections.get(magicKey).forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  } else {
    // Broadcast to all MT4 connections
    mt4Connections.forEach((connections) => {
      connections.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(message));
        }
      });
    });
  }
}

function broadcastToMT5(message, magicKey = null) {
  if (magicKey && mt5Connections.has(magicKey)) {
    // Send to specific magic key
    mt5Connections.get(magicKey).forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  } else {
    // Broadcast to all MT5 connections
    mt5Connections.forEach((connections) => {
      connections.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(message));
        }
      });
    });
  }
}

function broadcastToDesktop(message) {
  desktopConnections.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

function broadcastToMobile(message) {
  mobileConnections.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

// ==================== STATIC FILES ====================

// Serve admin dashboard
app.use('/admin', express.static('public/admin'));
app.use(express.static('public'));

// ==================== REST API ROUTES ====================

app.use('/api/auth', authRoutes);
app.use('/api/trades', authenticateToken, tradeRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/news', authenticateToken, newsRoutes);
app.use('/api/propfirm', authenticateToken, propFirmRoutes);
app.use('/api/mt', authenticateToken, mtRoutes);
app.use('/api/admin', authenticateToken, requireAdmin, adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: {
      total: clients.size,
      mt4: mt4Connections.size,
      mt5: mt5Connections.size,
      desktop: desktopConnections.size,
      mobile: mobileConnections.size
    }
  });
});

// Get server status
app.get('/api/status', (req, res) => {
  res.json({
    server: 'ChartWise Backend',
    version: '2.0.0',
    uptime: process.uptime(),
    connections: {
      total: clients.size,
      mt4: mt4Connections.size,
      mt5: mt5Connections.size,
      desktop: desktopConnections.size,
      mobile: mobileConnections.size
    },
    activeSessions: activeSessions.size
  });
});

// ==================== SCHEDULED TASKS ====================

// Check for high-impact news every minute
cron.schedule('* * * * *', async () => {
  try {
    const news = await newsService.getUpcomingNews();
    if (news.length > 0) {
      broadcastToAll({ type: 'news_update', data: news });
    }
  } catch (error) {
    logger.error('News check error:', error);
  }
});

// Send heartbeat to all clients every 30 seconds
setInterval(() => {
  broadcastToAll({ type: 'heartbeat', timestamp: Date.now() });
}, 30000);

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`=================================`);
  logger.info(`ChartWise Backend Server v2.0`);
  logger.info(`Port: ${PORT}`);
  logger.info(`=================================`);
});

module.exports = { app, server, wss, clients, mt4Connections, mt5Connections };
