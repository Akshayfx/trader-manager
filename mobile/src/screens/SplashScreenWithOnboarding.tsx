import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useOnboardingStore } from '../store/onboardingStore';
import { TraderOnboardingScreen } from './TraderOnboardingScreen';
import { SplashScreen } from './SplashScreen';

interface SplashScreenWithOnboardingProps {
  onAuthReady: (isOnboarded: boolean) => void;
}

export const SplashScreenWithOnboarding: React.FC<SplashScreenWithOnboardingProps> = ({ onAuthReady }) => {
  const { isCompleted } = useOnboardingStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      if (!isCompleted) {
        setShowOnboarding(true);
      } else {
        onAuthReady(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isCompleted, onAuthReady]);

  if (loading && !showOnboarding) {
    return <SplashScreen />;
  }

  if (showOnboarding) {
    return (
      <TraderOnboardingScreen
        onComplete={() => {
          setShowOnboarding(false);
          onAuthReady(true);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00d4ff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
