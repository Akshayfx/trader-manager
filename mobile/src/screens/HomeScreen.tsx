/**
 * Home Screen - Main Trading Interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Vibration,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

import { useThemeStore, colors } from '../store/themeStore';
import { useTradingStore } from '../store/tradingStore';
import { useSettingsStore } from '../store/settingsStore';
import { trackEvent } from '../services/analytics';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  
  const {
    isConnected,
    mtVersion,
    accountBalance,
    openPL,
    positionCount,
    currentSymbol,
    currentPrice,
    autoBE,
    partialTP,
    targetDefault,
    toggleAutoBE,
    togglePartialTP,
    toggleTargetDefault,
  } = useTradingStore();

  const { display, propFirm } = useSettingsStore();

  const [isLocked, setIsLocked] = useState(true);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Long press handler
  const handleLongPress = (action: () => void) => {
    Vibration.vibrate(50);
    action();
  };

  // Action buttons
  const handlePlanTrade = () => {
    trackEvent('button_click', { button: 'plan_trade' });
    Toast.show({
      type: 'info',
      text1: 'Plan Trade',
      text2: 'Opening trade calculator...',
    });
  };

  const handleBuy = () => {
    if (isLocked) {
      Toast.show({ type: 'error', text1: 'Locked', text2: 'Unlock to trade' });
      return;
    }
    trackEvent('trade_action', { action: 'buy', symbol: currentSymbol });
    Toast.show({ type: 'success', text1: 'Buy Order', text2: `Executing BUY on ${currentSymbol}` });
  };

  const handleSell = () => {
    if (isLocked) {
      Toast.show({ type: 'error', text1: 'Locked', text2: 'Unlock to trade' });
      return;
    }
    trackEvent('trade_action', { action: 'sell', symbol: currentSymbol });
    Toast.show({ type: 'success', text1: 'Sell Order', text2: `Executing SELL on ${currentSymbol}` });
  };

  const handleTargetDefault = () => {
    toggleTargetDefault();
    Toast.show({
      type: 'info',
      text1: 'Target Default',
      text2: targetDefault ? 'Disabled' : 'Enabled',
    });
  };

  const handlePartialTP = () => {
    togglePartialTP();
    Toast.show({
      type: 'info',
      text1: 'Partial TP',
      text2: partialTP ? 'Disabled' : 'Enabled',
    });
  };

  const handleCustomClose = () => {
    trackEvent('button_click', { button: 'custom_close' });
    Toast.show({ type: 'info', text1: 'Custom Close', text2: 'Closing 50% of position' });
  };

  const handleCloseHalf = () => {
    trackEvent('button_click', { button: 'close_half' });
    Toast.show({ type: 'info', text1: 'Close Half', text2: 'Closing 50% of all positions' });
  };

  const handleSLToBE = () => {
    trackEvent('button_click', { button: 'sl_to_be' });
    Toast.show({ type: 'success', text1: 'SL → BE', text2: 'Moving stop loss to breakeven' });
  };

  const handleCloseAll = () => {
    trackEvent('button_click', { button: 'close_all' });
    Toast.show({ type: 'error', text1: 'Close All', text2: 'Closing all positions' });
  };

  const toggleLock = () => {
    setIsLocked(!isLocked);
    Vibration.vibrate(30);
    Toast.show({
      type: isLocked ? 'success' : 'info',
      text1: isLocked ? 'Unlocked' : 'Locked',
      text2: isLocked ? 'Ready to trade' : 'Safe mode enabled',
    });
  };

  const styles = createStyles(themeColors);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.symbolText}>{currentSymbol}</Text>
          <Text style={styles.priceText}>{currentPrice.toFixed(5)}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.connectionBadge, isConnected && styles.connectedBadge]}>
            <Icon name="plug" size={12} color={isConnected ? '#22c55e' : themeColors.textMuted} />
            <Text style={[styles.connectionText, isConnected && styles.connectedText]}>
              {isConnected ? mtVersion?.toUpperCase() || 'MT' : 'OFFLINE'}
            </Text>
          </View>
        </View>
      </View>

      {/* Account Info */}
      <View style={styles.accountCard}>
        <View style={styles.accountRow}>
          {display.showBalance && (
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>BALANCE</Text>
              <Text style={styles.accountValue}>${accountBalance.toFixed(2)}</Text>
            </View>
          )}
          {display.showPL && (
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>P&L</Text>
              <Text style={[styles.accountValue, openPL >= 0 ? styles.profit : styles.loss]}>
                {openPL >= 0 ? '+' : ''}${openPL.toFixed(2)}
              </Text>
            </View>
          )}
          {display.showPositions && (
            <View style={styles.accountItem}>
              <Text style={styles.accountLabel}>POSITIONS</Text>
              <Text style={styles.accountValue}>{positionCount}</Text>
            </View>
          )}
        </View>
        
        {/* Lock Button */}
        <TouchableOpacity style={styles.lockButton} onPress={toggleLock}>
          <Icon name={isLocked ? 'lock' : 'lock-open'} size={14} color={isLocked ? '#ef4444' : '#22c55e'} />
          <Text style={[styles.lockText, { color: isLocked ? '#ef4444' : '#22c55e' }]}>
            {isLocked ? 'LOCKED' : 'UNLOCKED'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Prop Firm Warning */}
      {propFirm.enabled && (
        <View style={styles.propFirmBanner}>
          <Icon name="building" size={14} color="#f59e0b" />
          <Text style={styles.propFirmText}>Prop Firm Mode Active</Text>
        </View>
      )}

      {/* Button Grid */}
      <View style={styles.buttonGrid}>
        {/* Row 1: Plan Trade & Buy/Sell */}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handlePlanTrade} activeOpacity={0.8}>
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.actionButton}
            >
              <Icon name="calculator" size={20} color="#fff" />
              <Text style={styles.buttonText}>PLAN TRADE</Text>
              <Text style={styles.buttonHint}>Set SL/TP</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.tradeButtonsContainer}>
            <TouchableOpacity onPress={handleSell} activeOpacity={0.8}>
              <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.tradeButton}>
                <Icon name="arrow-down" size={16} color="#fff" />
                <Text style={styles.tradeButtonText}>SELL</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBuy} activeOpacity={0.8}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.tradeButton}>
                <Icon name="arrow-up" size={16} color="#fff" />
                <Text style={styles.tradeButtonText}>BUY</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Target & Partial TP */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleTargetDefault}
            onLongPress={() => handleLongPress(() => {/* Navigate to Target settings */})}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={targetDefault ? ['#f97316', '#ea580c'] : ['#374151', '#1f2937']}
              style={[styles.actionButton, targetDefault && styles.activeButton]}
            >
              <Icon name="bullseye" size={20} color="#fff" />
              <Text style={styles.buttonText}>TARGET</Text>
              <Text style={styles.buttonHint}>Default TP</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePartialTP}
            onLongPress={() => handleLongPress(() => {/* Open Partial TP modal */})}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={partialTP ? ['#a855f7', '#9333ea'] : ['#374151', '#1f2937']}
              style={[styles.actionButton, partialTP && styles.activeButton]}
            >
              <Icon name="layer-group" size={20} color="#fff" />
              <Text style={styles.buttonText}>PARTIAL TP</Text>
              <Text style={styles.buttonHint}>Scale Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Row 3: Custom Close & Close Half */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleCustomClose}
            onLongPress={() => handleLongPress(() => {/* Open Custom Close modal */})}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#14b8a6', '#0d9488']} style={styles.actionButton}>
              <Icon name="sliders-h" size={20} color="#fff" />
              <Text style={styles.buttonText}>CUSTOM CLOSE</Text>
              <Text style={styles.buttonHint}>Partial</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCloseHalf} activeOpacity={0.8}>
            <LinearGradient colors={['#374151', '#1f2937']} style={styles.actionButton}>
              <Icon name="cut" size={20} color="#fff" />
              <Text style={styles.buttonText}>CLOSE ½</Text>
              <Text style={styles.buttonHint}>50%</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Row 4: SL→BE & Auto BE */}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleSLToBE} activeOpacity={0.8}>
            <LinearGradient colors={['#06b6d4', '#0891b2']} style={styles.actionButton}>
              <Icon name="arrow-right" size={20} color="#fff" />
              <Text style={styles.buttonText}>SL → BE</Text>
              <Text style={styles.buttonHint}>Protect</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleAutoBE}
            onLongPress={() => handleLongPress(() => {/* Navigate to Auto BE settings */})}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={autoBE ? ['#00d4ff', '#0088cc'] : ['#374151', '#1f2937']}
              style={[styles.actionButton, autoBE && styles.activeButton]}
            >
              <Icon name="shield-alt" size={20} color="#fff" />
              <Text style={styles.buttonText}>AUTO BE</Text>
              <Text style={styles.buttonHint}>{autoBE ? 'ON' : 'OFF'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Row 5: AI Settings & Close All */}
        <View style={styles.buttonRow}>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient colors={['#ec4899', '#db2777']} style={styles.actionButton}>
              <Icon name="brain" size={20} color="#fff" />
              <Text style={styles.buttonText}>AI SETTINGS</Text>
              <Text style={styles.buttonHint}>Analysis</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCloseAll} activeOpacity={0.8}>
            <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.actionButton}>
              <Icon name="times-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>CLOSE ALL</Text>
              <Text style={styles.buttonHint}>Exit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Version */}
      <Text style={styles.versionText}>v3.0.0</Text>
    </ScrollView>
  );
};

const createStyles = (themeColors: typeof colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.bgPrimary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: themeColors.bgSecondary,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    symbolText: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.textPrimary,
    },
    priceText: {
      fontSize: 16,
      color: themeColors.textSecondary,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    connectionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: themeColors.bgTertiary,
      borderRadius: 12,
    },
    connectedBadge: {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
    },
    connectionText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.textMuted,
    },
    connectedText: {
      color: '#22c55e',
    },
    accountCard: {
      margin: 16,
      padding: 16,
      backgroundColor: themeColors.bgCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    accountRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 12,
    },
    accountItem: {
      alignItems: 'center',
    },
    accountLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: themeColors.textMuted,
      marginBottom: 4,
    },
    accountValue: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.textPrimary,
    },
    profit: {
      color: '#22c55e',
    },
    loss: {
      color: '#ef4444',
    },
    lockButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      backgroundColor: themeColors.bgTertiary,
      borderRadius: 8,
    },
    lockText: {
      fontSize: 12,
      fontWeight: '700',
    },
    propFirmBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 10,
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    propFirmText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#f59e0b',
    },
    buttonGrid: {
      padding: 16,
      gap: 12,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      width: (width - 56) / 2,
      height: 90,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
    },
    activeButton: {
      shadowColor: '#00d4ff',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 5,
    },
    buttonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#fff',
      marginTop: 8,
    },
    buttonHint: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 2,
    },
    tradeButtonsContainer: {
      flexDirection: 'row',
      gap: 8,
      width: (width - 56) / 2,
    },
    tradeButton: {
      flex: 1,
      height: 90,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tradeButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
      marginTop: 4,
    },
    versionText: {
      textAlign: 'center',
      fontSize: 12,
      color: themeColors.textMuted,
      marginVertical: 16,
    },
  });

export default HomeScreen;
