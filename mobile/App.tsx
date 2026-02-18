/**
 * ChartWise Trade Manager - Mobile App
 * Full-featured trading companion for Android and iOS
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';

// Import stores and services
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';
import { initializeAnalytics } from './src/services/analytics';
import { initializeCrashReporting } from './src/services/crashReporting';
import { initializePushNotifications } from './src/services/pushNotifications';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const Stack = createStackNavigator();

const App: React.FC = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    // Initialize services
    initializeAnalytics();
    initializeCrashReporting();
    initializePushNotifications();
    
    // Check authentication status
    checkAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#0a0a0f' : '#f8f9fc'}
      />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </SafeAreaProvider>
  );
};

export default App;
