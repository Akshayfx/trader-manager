/**
 * Socket Service
 * Handles WebSocket communication with ChartWise backend
 */

import io from 'socket.io-client';

const SERVER_URL = 'ws://localhost:3001'; // Update with your server URL

export class SocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {};
  }

  connect() {
    this.socket = io(SERVER_URL, {
      transports: ['websocket'],
      query: {
        clientType: 'mobile',
      },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Listen for server messages
    this.socket.on('trade_executed', (data) => {
      if (this.callbacks.onTradeExecuted) {
        this.callbacks.onTradeExecuted(data);
      }
    });

    this.socket.on('trade_closed', (data) => {
      if (this.callbacks.onTradeClosed) {
        this.callbacks.onTradeClosed(data);
      }
    });

    this.socket.on('position_update', (data) => {
      if (this.callbacks.onPositionUpdate) {
        this.callbacks.onPositionUpdate(data);
      }
    });

    this.socket.on('account_update', (data) => {
      if (this.callbacks.onAccountUpdate) {
        this.callbacks.onAccountUpdate(data);
      }
    });

    this.socket.on('ai_suggestion', (data) => {
      if (this.callbacks.onAISuggestion) {
        this.callbacks.onAISuggestion(data);
      }
    });

    this.socket.on('news_alert', (data) => {
      if (this.callbacks.onNewsAlert) {
        this.callbacks.onNewsAlert(data);
      }
    });

    this.socket.on('heartbeat', (data) => {
      // Respond to heartbeat
      this.socket.emit('pong', { timestamp: Date.now() });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Callback setters
  onConnect(callback) {
    this.callbacks.onConnect = callback;
  }

  onDisconnect(callback) {
    this.callbacks.onDisconnect = callback;
  }

  onTradeExecuted(callback) {
    this.callbacks.onTradeExecuted = callback;
  }

  onTradeClosed(callback) {
    this.callbacks.onTradeClosed = callback;
  }

  onPositionUpdate(callback) {
    this.callbacks.onPositionUpdate = callback;
  }

  onAccountUpdate(callback) {
    this.callbacks.onAccountUpdate = callback;
  }

  onAISuggestion(callback) {
    this.callbacks.onAISuggestion = callback;
  }

  onNewsAlert(callback) {
    this.callbacks.onNewsAlert = callback;
  }
}
