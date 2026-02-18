import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';

interface OnboardingCompleteProps {
  profile: string;
  message: string;
  recommendations: any;
  onContinue: () => void;
}

export const OnboardingComplete: React.FC<OnboardingCompleteProps> = ({
  profile,
  message,
  recommendations,
  onContinue,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.celebrationContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.celebrationIcon}>🎉</Text>
        </Animated.View>

        <Text style={styles.title}>All Set!</Text>
        <Text style={styles.profileBadge}>{profile}</Text>

        <View style={styles.messageBox}>
          <Text style={styles.message}>{message}</Text>
        </View>

        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Your Personalized Settings</Text>

          <RecommendationItem
            icon="⚠️"
            label="Risk Per Trade"
            value={`${recommendations.recommended_risk_per_trade}%`}
          />
          <RecommendationItem
            icon="📊"
            label="Position Sizing"
            value={`${(recommendations.recommended_position_size * 100).toFixed(0)}%`}
          />
          <RecommendationItem
            icon="🤖"
            label="AI Aggressiveness"
            value={recommendations.ai_aggressiveness.charAt(0).toUpperCase() + recommendations.ai_aggressiveness.slice(1)}
          />

          <View style={styles.featuresGrid}>
            <Feature
              enabled={recommendations.auto_breakeven_enabled}
              label="Auto Breakeven"
            />
            <Feature
              enabled={recommendations.partial_tp_enabled}
              label="Partial TP"
            />
            <Feature
              enabled={recommendations.news_protection_enabled}
              label="News Protection"
            />
            <Feature
              enabled={recommendations.trailing_stop_enabled}
              label="Trailing Stop"
            />
            <Feature
              enabled={recommendations.prop_firm_mode_enabled}
              label="Prop Firm Mode"
            />
          </View>
        </View>

        <View style={styles.nextStepsSection}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <StepItem
            number="1"
            title="Connect to MT4/MT5"
            description="Link your trading account to start syncing trades"
          />
          <StepItem
            number="2"
            title="Review AI Settings"
            description="Fine-tune your personalized recommendations"
          />
          <StepItem
            number="3"
            title="Start Trading"
            description="Use ChartWise for smarter trading decisions"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={onContinue}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonTextPrimary}>Begin Trading</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

interface RecommendationItemProps {
  icon: string;
  label: string;
  value: string;
}

const RecommendationItem: React.FC<RecommendationItemProps> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.recommendationItem}>
    <Text style={styles.recommendationIcon}>{icon}</Text>
    <View style={styles.recommendationContent}>
      <Text style={styles.recommendationLabel}>{label}</Text>
      <Text style={styles.recommendationValue}>{value}</Text>
    </View>
  </View>
);

interface FeatureProps {
  enabled: boolean;
  label: string;
}

const Feature: React.FC<FeatureProps> = ({ enabled, label }) => (
  <View style={[styles.featureBadge, enabled && styles.featureBadgeEnabled]}>
    <Text style={styles.featureBadgeText}>{enabled ? '✓' : '○'}</Text>
    <Text style={styles.featureBadgeLabel}>{label}</Text>
  </View>
);

interface StepItemProps {
  number: string;
  title: string;
  description: string;
}

const StepItem: React.FC<StepItemProps> = ({ number, title, description }) => (
  <View style={styles.stepItem}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
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
    paddingTop: 40,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  profileBadge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00d4ff',
    textAlign: 'center',
    marginBottom: 24,
  },
  messageBox: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00d4ff',
    marginBottom: 32,
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  recommendationsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1f3a',
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationLabel: {
    fontSize: 14,
    color: '#8892b0',
    marginBottom: 2,
  },
  recommendationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1a1f3a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8892b0',
  },
  featureBadgeEnabled: {
    backgroundColor: '#0a2942',
    borderColor: '#00d4ff',
  },
  featureBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
    marginRight: 6,
  },
  featureBadgeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  nextStepsSection: {
    marginBottom: 40,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00d4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0E27',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#8892b0',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  buttonPrimary: {
    paddingVertical: 16,
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTextPrimary: {
    color: '#0A0E27',
    fontSize: 16,
    fontWeight: '600',
  },
});
