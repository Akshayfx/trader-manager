import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../services/api';

export const useAuthStore = create((set, get) => ({
  isLoggedIn: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('chartwise_token');
      const user = await AsyncStorage.getItem('chartwise_user');
      
      if (token && user) {
        set({ 
          isLoggedIn: true, 
          token, 
          user: JSON.parse(user) 
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await AsyncStorage.setItem('chartwise_token', data.token);
        await AsyncStorage.setItem('chartwise_user', JSON.stringify(data.user));
        
        set({
          isLoggedIn: true,
          token: data.token,
          user: data.user,
          isLoading: false,
        });
        
        return true;
      } else {
        set({ error: data.message || 'Login failed', isLoading: false });
        return false;
      }
    } catch (error) {
      set({ error: 'Network error. Please try again.', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('chartwise_token');
    await AsyncStorage.removeItem('chartwise_user');
    set({ isLoggedIn: false, token: null, user: null });
  },
}));
