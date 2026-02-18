import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';

interface Option {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

interface QuestionCardProps {
  title: string;
  subtitle?: string;
  options: Option[];
  selectedOptions: string | string[];
  onSelect: (id: string) => void;
  onSelectMultiple?: (id: string) => void;
  isMultiSelect?: boolean;
  canProceed?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  progress?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  title,
  subtitle,
  options,
  selectedOptions,
  onSelect,
  onSelectMultiple,
  isMultiSelect = false,
  canProceed = true,
  onNext,
  onPrevious,
  progress = 0,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = (id: string) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (isMultiSelect) {
      onSelectMultiple?.(id);
    } else {
      onSelect(id);
    }
  };

  const isSelected = (id: string) => {
    if (isMultiSelect) {
      return Array.isArray(selectedOptions) && selectedOptions.includes(id);
    }
    return selectedOptions === id;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handlePress(option.id)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.option,
                  isSelected(option.id) && styles.optionSelected,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected(option.id) && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected(option.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {option.description && (
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  )}
                </View>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        {onPrevious && (
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={onPrevious}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonTextSecondary}>← Previous</Text>
          </TouchableOpacity>
        )}
        {onNext && (
          <TouchableOpacity
            style={[
              styles.buttonPrimary,
              !canProceed && styles.buttonDisabled,
            ]}
            onPress={onNext}
            disabled={!canProceed}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonTextPrimary}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1a1f3a',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00d4ff',
    borderRadius: 2,
  },
  progressText: {
    color: '#8892b0',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8892b0',
    marginBottom: 24,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 40,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a1f3a',
  },
  optionSelected: {
    backgroundColor: '#0a2942',
    borderColor: '#00d4ff',
  },
  optionLeft: {
    marginRight: 16,
    justifyContent: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8892b0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#00d4ff',
    borderColor: '#00d4ff',
  },
  checkmark: {
    color: '#0A0E27',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#8892b0',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  buttonPrimary: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSecondary: {
    paddingVertical: 16,
    paddingHorizontal: 24,
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
