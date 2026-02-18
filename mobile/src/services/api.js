import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// export const API_BASE_URL = 'http://localhost:3001/api';
export const API_BASE_URL = 'https://api.chartwise.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('chartwise_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('chartwise_token');
      await AsyncStorage.removeItem('chartwise_user');
    }
    return Promise.reject(error);
  }
);

export default api;
