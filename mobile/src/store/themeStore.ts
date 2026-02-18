/**
 * Theme Store - Zustand
 * Manages app theme (dark/light)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

interface ThemeState {
  theme: 'dark' | 'light';
  followSystem: boolean;
  
  // Actions
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setFollowSystem: (follow: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      followSystem: false,

      setTheme: (theme: 'dark' | 'light') => {
        set({ theme, followSystem: false });
      },

      toggleTheme: () => {
        const { theme } = get();
        set({ theme: theme === 'dark' ? 'light' : 'dark', followSystem: false });
      },

      setFollowSystem: (follow: boolean) => {
        if (follow) {
          const colorScheme = Appearance.getColorScheme();
          set({ theme: colorScheme === 'dark' ? 'dark' : 'light', followSystem: true });
        } else {
          set({ followSystem: false });
        }
      },
    }),
    {
      name: 'chartwise-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Theme colors
export const colors = {
  dark: {
    bgPrimary: '#0a0a0f',
    bgSecondary: '#12121a',
    bgTertiary: '#1a1a25',
    bgCard: '#161620',
    bgHover: '#222230',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0b0',
    textMuted: '#6a6a7a',
    border: '#2a2a3a',
    primary: '#00d4ff',
    secondary: '#a855f7',
    accent: '#f472b6',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
  light: {
    bgPrimary: '#f8f9fc',
    bgSecondary: '#ffffff',
    bgTertiary: '#f0f2f5',
    bgCard: '#ffffff',
    bgHover: '#e8eaf0',
    textPrimary: '#1a1a2e',
    textSecondary: '#4a4a5a',
    textMuted: '#8a8a9a',
    border: '#e0e2e8',
    primary: '#0088cc',
    secondary: '#7c3aed',
    accent: '#db2777',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
  },
};
