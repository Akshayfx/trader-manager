/**
 * Authentication Store - Zustand
 * Manages user authentication state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authAPI } from '../services/api';
import { trackEvent } from '../services/analytics';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  subscription: 'free' | 'starter' | 'pro' | 'enterprise';
  subscriptionExpiry?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(username, password);
          
          if (response.success) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
            });
            
            trackEvent('login_success', { method: 'email' });
            return true;
          } else {
            set({ error: response.message, isLoading: false });
            trackEvent('login_failed', { reason: response.message });
            return false;
          }
        } catch (error: any) {
          set({ error: error.message || 'Login failed', isLoading: false });
          trackEvent('login_error', { error: error.message });
          return false;
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          
          const response = await authAPI.googleLogin({
            id: userInfo.user.id,
            email: userInfo.user.email,
            username: userInfo.user.name || userInfo.user.email.split('@')[0],
            avatar: userInfo.user.photo,
          });
          
          if (response.success) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
            });
            
            trackEvent('login_success', { method: 'google' });
            return true;
          } else {
            set({ error: response.message, isLoading: false });
            return false;
          }
        } catch (error: any) {
          set({ error: error.message || 'Google login failed', isLoading: false });
          trackEvent('login_error', { method: 'google', error: error.message });
          return false;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(username, email, password);
          
          if (response.success) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
            });
            
            trackEvent('register_success', { method: 'email' });
            return true;
          } else {
            set({ error: response.message, isLoading: false });
            trackEvent('register_failed', { reason: response.message });
            return false;
          }
        } catch (error: any) {
          set({ error: error.message || 'Registration failed', isLoading: false });
          return false;
        }
      },

      logout: () => {
        GoogleSignin.signOut().catch(() => {});
        trackEvent('logout');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const { token } = get();
        if (token) {
          try {
            const response = await authAPI.verifyToken(token);
            if (response.success) {
              set({
                user: response.user,
                isAuthenticated: true,
              });
            } else {
              get().logout();
            }
          } catch {
            get().logout();
          }
        }
      },

      clearError: () => set({ error: null }),

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },
    }),
    {
      name: 'chartwise-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
