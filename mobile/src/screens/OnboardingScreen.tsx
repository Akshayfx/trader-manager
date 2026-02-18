/**
 * Onboarding Screen
 * Multi-step onboarding flow with hard paywall
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { useThemeStore, colors } from '../store/themeStore';
import { trackEvent } from '../services/analytics';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  options: { value: string; label: string; description: string }[];
}

const onboardingData: OnboardingStep[] = [
  {
    id: 'intent',
    title: 'What do you want ChartWise to help you with?',
    subtitle: 'Select your primary trading goal',
    icon: 'bullseye',
    options: [
      { value: 'protect', label: 'Protect My Capital', description: 'Auto breakeven, stop loss management' },
      { value: 'automate', label: 'Automate My Trading', description: 'Partial TP, custom closes' },
      { value: 'improve', label: 'Improve Performance', description: 'AI analysis, trade insights' },
      { value: 'propfirm', label: 'Pass Prop Firm Challenge', description: 'Daily loss limits, protection' },
    ],
  },
  {
    id: 'style',
    title: 'What\'s your trading style?',
    subtitle: 'This helps us configure the right settings',
    icon: 'chart-line',
    options: [
      { value: 'scalper', label: 'Scalper', description: 'Quick trades, M1-M5' },
      { value: 'daytrader', label: 'Day Trader', description: 'Multiple trades daily, M15-H1' },
      { value: 'swing', label: 'Swing Trader', description: 'Holds for days, H4-D1' },
      { value: 'position', label: 'Position Trader', description: 'Long-term, Weekly+' },
    ],
  },
  {
    id: 'risk',
    title: 'How much risk per trade?',
    subtitle: 'We\'ll set your default risk parameters',
    icon: 'shield-alt',
    options: [
      { value: '0.5', label: 'Conservative', description: '0.5% per trade' },
      { value: '2', label: 'Moderate', description: '2% per trade' },
      { value: '3', label: 'Aggressive', description: '3% per trade' },
      { value: '5', label: 'High Risk', description: '5% per trade' },
    ],
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const totalSteps = onboardingData.length + 1; // +1 for paywall

  const updateProgress = (step: number) => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSelect = (stepId: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [stepId]: value }));
    trackEvent('onboarding_select', { step: stepId, value });
  };

  const handleNext = () => {
    if (currentStep < onboardingData.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
      updateProgress(nextStep);
    } else {
      // Show paywall
      setCurrentStep(onboardingData.length);
      updateProgress(onboardingData.length);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      flatListRef.current?.scrollToIndex({ index: prevStep, animated: true });
      updateProgress(prevStep);
    }
  };

  const handleStartTrial = async () => {
    trackEvent('onboarding_complete', { selections: selectedOptions });
    await AsyncStorage.setItem('chartwise_onboarding_complete', 'true');
    await AsyncStorage.setItem('chartwise_preferences', JSON.stringify(selectedOptions));
    navigation.navigate('Login' as never);
  };

  const renderStep = ({ item, index }: { item: OnboardingStep; index: number }) => (
    <View style={[styles.stepContainer, { width }]}>
      <View style={styles.stepHeader}>
        <View style={[styles.iconContainer, { backgroundColor: themeColors.bgTertiary }]}>
          <Icon name={item.icon} size={32} color={themeColors.primary} />
        </View>
        <Text style={[styles.stepTitle, { color: themeColors.textPrimary }]}>{item.title}</Text>
        <Text style={[styles.stepSubtitle, { color: themeColors.textSecondary }]}>{item.subtitle}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {item.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionCard,
              { backgroundColor: themeColors.bgCard, borderColor: themeColors.border },
              selectedOptions[item.id] === option.value && { borderColor: themeColors.primary },
            ]}
            onPress={() => handleSelect(item.id, option.value)}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radio,
                  { borderColor: themeColors.border },
                  selectedOptions[item.id] === option.value && { borderColor: themeColors.primary },
                ]}
              >
                {selectedOptions[item.id] === option.value && (
                  <View style={[styles.radioInner, { backgroundColor: themeColors.primary }]} />
                )}
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, { color: themeColors.textPrimary }]}>{option.label}</Text>
              <Text style={[styles.optionDescription, { color: themeColors.textSecondary }]}>
                {option.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPaywall = () => (
    <View style={[styles.paywallContainer, { width }]}>
      <View style={styles.paywallHeader}>
        <Image source={require('../../logo.png')} style={styles.paywallLogo} />
        <Text style={[styles.paywallTitle, { color: themeColors.textPrimary }]}>
          Unlock Your Full Potential
        </Text>
        <Text style={[styles.paywallSubtitle, { color: themeColors.textSecondary }]}>
          Start your 7-day free trial today
        </Text>
      </View>

      <View style={styles.benefitsContainer}>
        {[
          'All premium features unlocked',
          'Unlimited MT connections',
          'AI trade analysis reports',
          'Priority customer support',
          'Cancel anytime - no commitment',
        ].map((benefit, i) => (
          <View key={i} style={styles.benefitItem}>
            <Icon name="check-circle" size={18} color="#22c55e" />
            <Text style={[styles.benefitText, { color: themeColors.textSecondary }]}>{benefit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.pricingContainer}>
        <View style={[styles.priceCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.primary }]}>
          <View style={[styles.popularBadge, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.popularBadgeText}>Most Popular</Text>
          </View>
          <Text style={[styles.planName, { color: themeColors.textSecondary }]}>Pro Plan</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.currency, { color: themeColors.textSecondary }]}>$</Text>
            <Text style={[styles.price, { color: themeColors.textPrimary }]}>39</Text>
            <Text style={[styles.period, { color: themeColors.textMuted }]}>/month</Text>
          </View>
          <TouchableOpacity
            style={[styles.trialButton, { backgroundColor: themeColors.primary }]}
            onPress={handleStartTrial}
          >
            <Text style={styles.trialButtonText}>Start Free Trial</Text>
          </TouchableOpacity>
          <Text style={[styles.trialNote, { color: themeColors.textMuted }]}>
            7 days free, then $39/month
          </Text>
        </View>

        <View style={[styles.priceCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
          <Text style={[styles.planName, { color: themeColors.textSecondary }]}>Starter Plan</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.currency, { color: themeColors.textSecondary }]}>$</Text>
            <Text style={[styles.price, { color: themeColors.textPrimary }]}>19</Text>
            <Text style={[styles.period, { color: themeColors.textMuted }]}>/month</Text>
          </View>
          <TouchableOpacity
            style={[styles.trialButton, { backgroundColor: themeColors.bgTertiary }]}
            onPress={handleStartTrial}
          >
            <Text style={[styles.trialButtonText, { color: themeColors.textPrimary }]}>
              Start Free Trial
            </Text>
          </TouchableOpacity>
          <Text style={[styles.trialNote, { color: themeColors.textMuted }]}>
            7 days free, then $19/month
          </Text>
        </View>
      </View>

      <View style={styles.guaranteeContainer}>
        <Icon name="shield-alt" size={16} color="#22c55e" />
        <Text style={[styles.guaranteeText, { color: themeColors.textSecondary }]}>
          30-day money-back guarantee
        </Text>
      </View>
    </View>
  );

  const styles = createStyles(themeColors);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: themeColors.bgTertiary }]}>
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: themeColors.primary, width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }) },
          ]}
        />
      </View>

      {/* Content */}
      {currentStep < onboardingData.length ? (
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderStep}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        renderPaywall()
      )}

      {/* Navigation */}
      {currentStep < onboardingData.length && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: themeColors.bgTertiary }]}
            onPress={handleBack}
            disabled={currentStep === 0}
          >
            <Text style={[styles.navButtonText, { color: themeColors.textPrimary }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: themeColors.primary },
              !selectedOptions[onboardingData[currentStep].id] && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={!selectedOptions[onboardingData[currentStep].id]}
          >
            <Text style={styles.navButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step Indicator */}
      {currentStep < onboardingData.length && (
        <View style={styles.stepIndicator}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                { backgroundColor: index === currentStep ? themeColors.primary : themeColors.border },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (themeColors: typeof colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    progressContainer: {
      height: 4,
      width: '100%',
    },
    progressBar: {
      height: '100%',
    },
    stepContainer: {
      flex: 1,
      padding: 24,
    },
    stepHeader: {
      alignItems: 'center',
      marginBottom: 32,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    stepSubtitle: {
      fontSize: 14,
      textAlign: 'center',
    },
    optionsContainer: {
      gap: 12,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
    },
    radioContainer: {
      marginRight: 16,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    optionContent: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
    optionDescription: {
      fontSize: 13,
      marginTop: 2,
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 24,
      gap: 12,
    },
    navButton: {
      flex: 1,
      height: 52,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    disabledButton: {
      opacity: 0.5,
    },
    navButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingBottom: 24,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    paywallContainer: {
      flex: 1,
      padding: 24,
    },
    paywallHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    paywallLogo: {
      width: 80,
      height: 80,
      marginBottom: 16,
    },
    paywallTitle: {
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
    },
    paywallSubtitle: {
      fontSize: 14,
      marginTop: 8,
    },
    benefitsContainer: {
      marginBottom: 24,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
    },
    benefitText: {
      fontSize: 14,
    },
    pricingContainer: {
      gap: 12,
    },
    priceCard: {
      borderRadius: 12,
      borderWidth: 2,
      padding: 20,
      position: 'relative',
    },
    popularBadge: {
      position: 'absolute',
      top: -10,
      alignSelf: 'center',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    popularBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#fff',
    },
    planName: {
      fontSize: 14,
      marginBottom: 8,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      marginBottom: 16,
    },
    currency: {
      fontSize: 24,
      fontWeight: '600',
    },
    price: {
      fontSize: 48,
      fontWeight: '800',
    },
    period: {
      fontSize: 14,
    },
    trialButton: {
      height: 48,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    trialButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    trialNote: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 10,
    },
    guaranteeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 24,
    },
    guaranteeText: {
      fontSize: 13,
    },
  });

export default OnboardingScreen;
