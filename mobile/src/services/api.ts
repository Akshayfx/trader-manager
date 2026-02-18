/**
 * API Service
 * Handles all backend communication
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { trackEvent } from './analytics';

// For Android emulator, use 10.0.2.2 to access host's localhost
const API_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3001/api'
  : 'http://localhost:3001/api';
// const API_BASE_URL = 'https://api.chartwise.app/api'; // Production URL

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Add device info headers
    config.headers['X-Platform'] = Platform.OS;
    config.headers['X-App-Version'] = DeviceInfo.getVersion();
    config.headers['X-Device-Id'] = await DeviceInfo.getUniqueId();

    // Add auth token if available
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Track API errors
    trackEvent('api_error', {
      endpoint: error.config?.url || 'unknown',
      method: error.config?.method || 'unknown',
      status: error.response?.status || 0,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

// Helper to get auth token from storage
async function getAuthToken(): Promise<string | null> {
  // This will be implemented with AsyncStorage
  // For now, return null
  return null;
}

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (username: string, email: string, password: string) => {
    const response = await apiClient.post('/auth/register', { username, email, password });
    return response.data;
  },

  googleLogin: async (userData: any) => {
    const response = await apiClient.post('/auth/google', userData);
    return response.data;
  },

  verifyToken: async (token: string) => {
    const response = await apiClient.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.put('/user/profile', data);
    return response.data;
  },

  getSettings: async () => {
    const response = await apiClient.get('/user/settings');
    return response.data;
  },

  updateSettings: async (settings: any) => {
    const response = await apiClient.put('/user/settings', settings);
    return response.data;
  },
};

// Trading API
export const tradingAPI = {
  getAccountInfo: async () => {
    const response = await apiClient.get('/trading/account');
    return response.data;
  },

  getPositions: async () => {
    const response = await apiClient.get('/trading/positions');
    return response.data;
  },

  openTrade: async (tradeData: any) => {
    const response = await apiClient.post('/trading/open', tradeData);
    return response.data;
  },

  closeTrade: async (tradeId: string) => {
    const response = await apiClient.post('/trading/close', { tradeId });
    return response.data;
  },

  closePartial: async (tradeId: string, percent: number) => {
    const response = await apiClient.post('/trading/close-partial', { tradeId, percent });
    return response.data;
  },

  moveSLToBE: async (tradeId: string) => {
    const response = await apiClient.post('/trading/sl-to-be', { tradeId });
    return response.data;
  },

  setPartialTP: async (levels: any[]) => {
    const response = await apiClient.post('/trading/partial-tp', { levels });
    return response.data;
  },
};

// News API
export const newsAPI = {
  getNews: async () => {
    const response = await apiClient.get('/news');
    return response.data;
  },

  getUpcomingEvents: async () => {
    const response = await apiClient.get('/news/upcoming');
    return response.data;
  },

  updatePreferences: async (preferences: any) => {
    const response = await apiClient.put('/news/preferences', preferences);
    return response.data;
  },
};

// AI API
export const aiAPI = {
  getReports: async () => {
    const response = await apiClient.get('/ai/reports');
    return response.data;
  },

  generateReport: async () => {
    const response = await apiClient.post('/ai/generate-report');
    return response.data;
  },

  getInsights: async () => {
    const response = await apiClient.get('/ai/insights');
    return response.data;
  },
};

// WebSocket connection for real-time data
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect(token: string, onMessage: (data: any) => void): void {
    const wsUrl = API_BASE_URL.replace('https', 'wss').replace('/api', '');
    this.socket = new WebSocket(`${wsUrl}?token=${token}`);

    this.socket.onopen = () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      trackEvent('websocket_connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('[WebSocket] Message parse error:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('[WebSocket] Disconnected');
      trackEvent('websocket_disconnected');
      this.attemptReconnect(token, onMessage);
    };

    this.socket.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      trackEvent('websocket_error');
    };
  }

  private attemptReconnect(token: string, onMessage: (data: any) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}`);

      setTimeout(() => {
        this.connect(token, onMessage);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
    }
  }

  send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default apiClient;
