import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTradeStore } from '../store/tradeStore';
import { useAuthStore } from '../store/authStore';
import WebSocketService from '../services/websocket';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const {
    currentSymbol,
    currentPrice,
    accountBalance,
    openPL,
    positionCount,
    tradePlan,
    autoBE,
    activePartialTP,
    settings,
    toggleAutoBE,
    togglePartialTP,
    calculateLotSize,
  } = useTradeStore();

  const [longPressActive, setLongPressActive] = useState(null);
  const longPressTimer = useRef(null);

  useEffect(() => {
    WebSocketService.connect();
    return () => WebSocketService.disconnect();
  }, []);

  // Long press handler
  const handlePressIn = (buttonId, longPressAction) => {
    setLongPressActive(buttonId);
    longPressTimer.current = setTimeout(() => {
      Vibration.vibrate(50);
      longPressAction();
      setLongPressActive(null);
    }, 800);
  };

  const handlePressOut = (buttonId, clickAction) => {
    clearTimeout(longPressTimer.current);
    if (longPressActive === buttonId) {
      clickAction();
    }
    setLongPressActive(null);
  };

  // Button actions
  const handlePlanTrade = () => navigation.navigate('PlanTrade');

  const handleBuy = () => {
    const lotSize = calculateLotSize();
    WebSocketService.openTrade({
      symbol: tradePlan.symbol === 'AUTO' ? currentSymbol : tradePlan.symbol,
      direction: 'buy',
      entryType: 'market',
      entryPrice: currentPrice,
      stopLoss: tradePlan.stopLoss,
      takeProfit: tradePlan.takeProfit,
      lotSize: lotSize.toFixed(2),
    });
  };

  const handleSell = () => {
    const lotSize = calculateLotSize();
    WebSocketService.openTrade({
      symbol: tradePlan.symbol === 'AUTO' ? currentSymbol : tradePlan.symbol,
      direction: 'sell',
      entryType: 'market',
      entryPrice: currentPrice,
      stopLoss: tradePlan.stopLoss,
      takeProfit: tradePlan.takeProfit,
      lotSize: lotSize.toFixed(2),
    });
  };

  const handlePartialTPClick = () => {
    togglePartialTP();
    if (!activePartialTP) {
      WebSocketService.setPartialTP(settings.partialTP.levels);
    }
  };

  const handlePartialTPLongPress = () => {
    // Open partial TP settings
    console.log('Open Partial TP Settings');
  };

  const handleCustomCloseClick = () => {
    WebSocketService.customClose(settings.customClose.defaultPercent);
  };

  const handleCustomCloseLongPress = () => {
    // Open custom close presets
    console.log('Open Custom Close Presets');
  };

  const handleAutoBEClick = () => {
    toggleAutoBE();
    WebSocketService.setAutoBE(!autoBE, settings.autoBreakeven.triggerPips);
  };

  const handleAutoBELongPress = () => {
    // Open Auto BE settings
    console.log('Open Auto BE Settings');
  };

  const handleCloseHalf = () => WebSocketService.closeHalf();
  const handleSLToBE = () => WebSocketService.moveSLToBE();
  const handleCloseAll = () => WebSocketService.closeAll();

  // Render button component
  const ActionButton = ({
    id,
    icon,
    label,
    hint,
    color,
    onClick,
    onLongPress,
    isToggle,
    isActive,
  }) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: color },
        isToggle && isActive && styles.activeButton,
      ]}
      onPressIn={() => onLongPress && handlePressIn(id, onLongPress)}
      onPressOut={() =>
        handlePressOut(id, onClick)
      }
      activeOpacity={0.8}
    >
      <Icon name={icon} size={18} color="#fff" style={styles.buttonIcon} />
      <Text style={styles.buttonLabel}>{label}</Text>
      <Text style={styles.buttonHint}>{hint}</Text>
      {isToggle && isActive && (
        <View style={styles.activeIndicator}>
          <Text style={styles.activeText}>ON</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>ChartWise</Text>
          <View style={styles.connectionStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Connected</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="cog" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Account Info */}
      <View style={styles.accountInfo}>
        <View style={styles.accountItem}>
          <Text style={styles.accountLabel}>Balance</Text>
          <Text style={styles.accountValue}>${accountBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.accountItem}>
          <Text style={styles.accountLabel}>Open P&L</Text>
          <Text
            style={[
              styles.accountValue,
              openPL >= 0 ? styles.positive : styles.negative,
            ]}
          >
            {openPL >= 0 ? '+' : ''}${openPL.toFixed(2)}
          </Text>
        </View>
        <View style={styles.accountItem}>
          <Text style={styles.accountLabel}>Positions</Text>
          <Text style={styles.accountValue}>{positionCount}</Text>
        </View>
      </View>

      {/* Symbol Display */}
      <View style={styles.symbolDisplay}>
        <Text style={styles.symbolText}>{currentSymbol}</Text>
        <Text style={styles.priceText}>{currentPrice.toFixed(5)}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Button Grid */}
        <View style={styles.buttonGrid}>
          {/* Row 1: Plan Trade */}
          <ActionButton
            id="planTrade"
            icon="calculator"
            label="PLAN TRADE"
            hint="Set SL/TP"
            color="#3b82f6"
            onClick={handlePlanTrade}
          />

          {/* Row 2: Buy/Sell */}
          <View style={styles.tradeRow}>
            <TouchableOpacity
              style={[styles.tradeButton, styles.sellButton]}
              onPress={handleSell}
            >
              <Icon name="arrow-down" size={16} color="#fff" />
              <Text style={styles.tradeButtonText}>SELL</Text>
            </TouchableOpacity>

            <View style={styles.lotSizeBox}>
              <Text style={styles.lotSizeValue}>
                {tradePlan.calculatedLotSize.toFixed(2)}
              </Text>
              <Text style={styles.lotSizeLabel}>Lot(s)</Text>
            </View>

            <TouchableOpacity
              style={[styles.tradeButton, styles.buyButton]}
              onPress={handleBuy}
            >
              <Icon name="arrow-up" size={16} color="#fff" />
              <Text style={styles.tradeButtonText}>BUY</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3: Partial TP & Custom Close */}
          <View style={styles.buttonRow}>
            <ActionButton
              id="partialTP"
              icon="layer-group"
              label="PARTIAL TP"
              hint="Scale Out"
              color="#8b5cf6"
              onClick={handlePartialTPClick}
              onLongPress={handlePartialTPLongPress}
              isToggle
              isActive={activePartialTP}
            />
            <ActionButton
              id="customClose"
              icon="sliders-h"
              label="CUSTOM CLOSE"
              hint="Partial Close"
              color="#14b8a6"
              onClick={handleCustomCloseClick}
              onLongPress={handleCustomCloseLongPress}
            />
          </View>

          {/* Row 4: Close Half & SL to BE */}
          <View style={styles.buttonRow}>
            <ActionButton
              id="closeHalf"
              icon="cut"
              label="CLOSE ½"
              hint="50%"
              color="#374151"
              onClick={handleCloseHalf}
            />
            <ActionButton
              id="slToBE"
              icon="arrow-right"
              label="SL → BE"
              hint="Protect"
              color="#06b6d4"
              onClick={handleSLToBE}
            />
          </View>

          {/* Row 5: Auto BE & Close All */}
          <View style={styles.buttonRow}>
            <ActionButton
              id="autoBE"
              icon="shield-alt"
              label="AUTO BE"
              hint="Auto Protect"
              color="#4b5563"
              onClick={handleAutoBEClick}
              onLongPress={handleAutoBELongPress}
              isToggle
              isActive={autoBE}
            />
            <ActionButton
              id="closeAll"
              icon="times-circle"
              label="CLOSE ALL"
              hint="Exit All"
              color="#ef4444"
              onClick={handleCloseAll}
            />
          </View>
        </View>

        {/* News Panel */}
        <View style={styles.newsPanel}>
          <View style={styles.newsHeader}>
            <Icon name="newspaper" size={14} color="#888" />
            <Text style={styles.newsTitle}>Next News</Text>
          </View>
          <View style={styles.newsContent}>
            <Text style={styles.newsEvent}>Non-Farm Payrolls</Text>
            <View style={styles.newsMeta}>
              <Text style={styles.newsTime}>15:30</Text>
              <View style={styles.impactBadge}>
                <Text style={styles.impactText}>HIGH</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 11,
    color: '#10b981',
  },
  settingsButton: {
    padding: 8,
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  accountItem: {
    alignItems: 'center',
  },
  accountLabel: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  positive: {
    color: '#10b981',
  },
  negative: {
    color: '#ef4444',
  },
  symbolDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  symbolText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    fontFamily: 'monospace',
  },
  scrollView: {
    flex: 1,
  },
  buttonGrid: {
    padding: 12,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    position: 'relative',
  },
  activeButton: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonIcon: {
    marginBottom: 4,
  },
  buttonLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonHint: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tradeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  tradeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 12,
  },
  sellButton: {
    backgroundColor: '#ef4444',
  },
  buyButton: {
    backgroundColor: '#10b981',
  },
  tradeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  lotSizeBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  lotSizeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  lotSizeLabel: {
    fontSize: 9,
    color: '#888',
    textTransform: 'uppercase',
  },
  newsPanel: {
    margin: 12,
    marginTop: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  newsTitle: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
  },
  newsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsEvent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newsTime: {
    fontSize: 12,
    color: '#888',
  },
  impactBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  impactText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default HomeScreen;
