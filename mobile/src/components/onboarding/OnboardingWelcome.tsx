import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';

interface OnboardingWelcomeProps {
  onStart: () => void;
  onSkip?: () => void;
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({
  onStart,
  onSkip,
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📊</Text>
          </View>
        </View>

        <Text style={styles.title}>Welcome to ChartWise</Text>
        <Text style={styles.subtitle}>
          Let's personalize your trading experience with just a few questions
        </Text>

        <View style={styles.featuresContainer}>
          <Feature
            icon="🎯"
            title="Personalized Settings"
            description="Get recommended settings tailored to your experience and goals"
          />
          <Feature
            icon="🤖"
            title="AI-Powered Insights"
            description="Receive analysis and recommendations designed for your trading style"
          />
          <Feature
            icon="⚡"
            title="Optimized Defaults"
            description="Smart defaults for risk management and position sizing"
          />
          <Feature
            icon="📱"
            title="Seamless Sync"
            description="Your settings sync across all your devices"
          />
        </View>

        <View style={styles.timeEstimate}>
          <Text style={styles.timeEstimateText}>⏱️ Takes about 3-5 minutes</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={onStart}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonTextPrimary}>Start Personalization</Text>
        </TouchableOpacity>
        {onSkip && (
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={onSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonTextSecondary}>Skip for Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => (
  <View style={styles.feature}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1f3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8892b0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#8892b0',
    lineHeight: 20,
  },
  timeEstimate: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    marginBottom: 40,
  },
  timeEstimateText: {
    color: '#8892b0',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  buttonPrimary: {
    paddingVertical: 16,
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondary: {
    paddingVertical: 16,
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8892b0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTextPrimary: {
    color: '#0A0E27',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
