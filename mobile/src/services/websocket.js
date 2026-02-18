import { io } from 'socket.io-client';
import { useTradeStore } from '../store/tradeStore';
import { useAuthStore } from '../store/authStore';

const WS_URL = 'ws://localhost:3001';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    const { token } = useAuthStore.getState();
    
    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('message', (message) => {
      this.handleMessage(message);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  handleMessage(message) {
    const { setMarketData, setAccountData } = useTradeStore.getState();
    
    switch (message.type) {
      case 'market_data':
        setMarketData(message.data);
        break;
      case 'account_update':
        setAccountData(message.data);
        break;
      case 'trade_executed':
        console.log('Trade executed:', message.data);
        break;
      case 'partial_tp_triggered':
        console.log('Partial TP triggered:', message.data);
        break;
      default:
        console.log('Received message:', message);
    }
  }

  sendCommand(type, data = {}) {
    if (this.socket && this.isConnected) {
      this.socket.emit('command', { type, data });
    } else {
      console.warn('WebSocket not connected');
    }
  }

  // Trade commands
  openTrade(tradeData) {
    this.sendCommand('open_trade', tradeData);
  }

  closeHalf() {
    this.sendCommand('close_half');
  }

  closeAll() {
    this.sendCommand('close_all');
  }

  moveSLToBE() {
    this.sendCommand('sl_to_be');
  }

  setAutoBE(enabled, triggerPips) {
    this.sendCommand('auto_be', { enabled, triggerPips });
  }

  customClose(percent) {
    this.sendCommand('custom_close', { percent });
  }

  setPartialTP(levels) {
    this.sendCommand('set_partial_tp', { levels });
  }

  drawLine(lineType, price) {
    this.sendCommand('trade.draw_line', { lineType, price });
  }

  clearLines() {
    this.sendCommand('trade.clear_lines');
  }
}

export default new WebSocketService();
