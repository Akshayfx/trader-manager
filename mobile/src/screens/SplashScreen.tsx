/**
 * Splash Screen
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useThemeStore, colors } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { trackEvent } from '../services/analytics';

const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const themeColors = colors[theme];

  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animate logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Check onboarding status and navigate
    const checkStatus = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const onboardingComplete = await AsyncStorage.getItem('chartwise_onboarding_complete');
        
        if (onboardingComplete === 'true') {
          if (isAuthenticated) {
            trackEvent('app_launch', { status: 'authenticated' });
            navigation.navigate('Main' as never);
          } else {
            trackEvent('app_launch', { status: 'login_required' });
            navigation.navigate('Login' as never);
          }
        } else {
          trackEvent('app_launch', { status: 'onboarding_required' });
          navigation.navigate('Onboarding' as never);
        }
      } catch (error) {
        navigation.navigate('Onboarding' as never);
      }
    };

    checkStatus();
  }, [isAuthenticated]);

  const styles = createStyles(themeColors);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>CHARTWISE</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Trade Manager</Text>
      </Animated.View>

      <View style={styles.bottomContainer}>
        <Text style={[styles.version, { color: themeColors.textMuted }]}>v3.0.0</Text>
      </View>
    </View>
  );
};

const createStyles = (themeColors: typeof colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      alignItems: 'center',
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 24,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: 4,
    },
    subtitle: {
      fontSize: 16,
      marginTop: 8,
      letterSpacing: 2,
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 40,
    },
    version: {
      fontSize: 12,
    },
  });

export default SplashScreen;
