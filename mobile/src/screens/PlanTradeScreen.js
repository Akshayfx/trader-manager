import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTradeStore } from '../store/tradeStore';
import WebSocketService from '../services/websocket';

const PlanTradeScreen = ({ navigation }) => {
  const {
    currentSymbol,
    currentPrice,
    accountBalance,
    tradePlan,
    setTradePlan,
    calculateLotSize,
  } = useTradeStore();

  const [slPrice, setSlPrice] = useState('');
  const [tpPrice, setTpPrice] = useState('');
  const [riskValue, setRiskValue] = useState('2');
  const [riskType, setRiskType] = useState('percent');
  const [direction, setDirection] = useState('auto');

  // Calculate direction based on SL position
  useEffect(() => {
    if (slPrice) {
      const sl = parseFloat(slPrice);
      if (sl > currentPrice) {
        setDirection('sell');
      } else if (sl < currentPrice && sl > 0) {
        setDirection('buy');
      }
    }
  }, [slPrice, currentPrice]);

  // Calculate lot size when inputs change
  useEffect(() => {
    const sl = parseFloat(slPrice) || 0;
    const slPips = sl > 0 ? Math.abs(sl - currentPrice) / 0.0001 : 0;

    setTradePlan({
      stopLoss: sl,
      takeProfit: parseFloat(tpPrice) || 0,
      slPips,
      riskType,
      riskPercent: riskType === 'percent' ? parseFloat(riskValue) || 2 : 0,
      riskMoney: riskType === 'money' ? parseFloat(riskValue) || 100 : 0,
    });

    calculateLotSize();
  }, [slPrice, tpPrice, riskValue, riskType]);

  // Send SL line to MT4
  const handleSLChange = (value) => {
    setSlPrice(value);
    const price = parseFloat(value);
    if (price > 0) {
      WebSocketService.drawLine('SL', price);
    }
  };

  // Send TP line to MT4
  const handleTPChange = (value) => {
    setTpPrice(value);
    const price = parseFloat(value);
    if (price > 0) {
      WebSocketService.drawLine('TP', price);
    }
  };

  // Execute trade
  const handleOpenTrade = (tradeDirection) => {
    if (!slPrice || parseFloat(slPrice) <= 0) {
      Alert.alert('Error', 'Please set Stop Loss');
      return;
    }

    const lotSize = calculateLotSize();
    const finalDirection = tradeDirection === 'auto' ? direction : tradeDirection;

    WebSocketService.openTrade({
      symbol: tradePlan.symbol === 'AUTO' ? currentSymbol : tradePlan.symbol,
      direction: finalDirection,
      entryType: 'market',
      entryPrice: currentPrice,
      stopLoss: parseFloat(slPrice),
      takeProfit: parseFloat(tpPrice) || 0,
      lotSize: lotSize.toFixed(2),
    });

    Alert.alert(
      'Trade Executed',
      `${finalDirection.toUpperCase()} ${lotSize.toFixed(2)} lots`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  // Quick set SL at X pips
  const quickSetSL = (pips) => {
    const offset = pips * 0.0001;
    const sl = currentPrice - offset;
    setSlPrice(sl.toFixed(5));
    WebSocketService.drawLine('SL', sl);
  };

  // Quick set TP at X pips
  const quickSetTP = (pips) => {
    const offset = pips * 0.0001;
    const tp = currentPrice + offset;
    setTpPrice(tp.toFixed(5));
    WebSocketService.drawLine('TP', tp);
  };

  // Calculate R:R ratio
  const getRRRatio = () => {
    const sl = parseFloat(slPrice) || 0;
    const tp = parseFloat(tpPrice) || 0;
    const slPips = sl > 0 ? Math.abs(sl - currentPrice) / 0.0001 : 0;
    const tpPips = tp > 0 ? Math.abs(tp - currentPrice) / 0.0001 : 0;
    return slPips > 0 ? (tpPips / slPips).toFixed(1) : '0';
  };

  // Calculate risk amount
  const getRiskAmount = () => {
    const value = parseFloat(riskValue) || 0;
    if (riskType === 'percent') {
      return (accountBalance * (value / 100)).toFixed(2);
    }
    return value.toFixed(2);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Trade</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Symbol & Price */}
        <View style={styles.symbolSection}>
          <Text style={styles.symbolText}>{currentSymbol}</Text>
          <Text style={styles.priceText}>{currentPrice.toFixed(5)}</Text>
          <View
            style={[
              styles.directionBadge,
              direction === 'buy'
                ? styles.buyBadge
                : direction === 'sell'
                ? styles.sellBadge
                : styles.autoBadge,
            ]}
          >
            <Text style={styles.directionText}>
              {direction === 'auto' ? 'AUTO' : direction.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Risk Type Toggle */}
        <View style={styles.riskToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              riskType === 'percent' && styles.toggleActive,
            ]}
            onPress={() => setRiskType('percent')}
          >
            <Text
              style={[
                styles.toggleText,
                riskType === 'percent' && styles.toggleTextActive,
              ]}
            >
              % RISK
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              riskType === 'money' && styles.toggleActive,
            ]}
            onPress={() => setRiskType('money')}
          >
            <Text
              style={[
                styles.toggleText,
                riskType === 'money' && styles.toggleTextActive,
              ]}
            >
              $ RISK
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Fields */}
        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Stop Loss Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Set SL on chart"
              placeholderTextColor="#666"
              value={slPrice}
              onChangeText={handleSLChange}
              keyboardType="decimal-pad"
            />
            {slPrice && (
              <Text style={styles.pipsText}>
                {((Math.abs(parseFloat(slPrice) - currentPrice) / 0.0001) || 0).toFixed(1)} pips
              </Text>
            )}
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Take Profit Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Set TP on chart (optional)"
              placeholderTextColor="#666"
              value={tpPrice}
              onChangeText={handleTPChange}
              keyboardType="decimal-pad"
            />
            {tpPrice && (
              <Text style={styles.pipsText}>
                {((Math.abs(parseFloat(tpPrice) - currentPrice) / 0.0001) || 0).toFixed(1)} pips
              </Text>
            )}
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>
              {riskType === 'percent' ? 'Risk %' : 'Risk $'}
            </Text>
            <TextInput
              style={styles.input}
              value={riskValue}
              onChangeText={setRiskValue}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Quick Set Buttons */}
        <View style={styles.quickButtons}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => quickSetSL(20)}
          >
            <Text style={styles.quickButtonText}>SL @ 20 pips</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => quickSetTP(40)}
          >
            <Text style={styles.quickButtonText}>TP @ 40 pips</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        <View style={styles.resultsSection}>
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Lot Size</Text>
            <Text style={styles.resultValue}>
              {tradePlan.calculatedLotSize.toFixed(2)}
            </Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Risk $</Text>
            <Text style={styles.resultValue}>${getRiskAmount()}</Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>R:R</Text>
            <Text style={styles.resultValue}>1:{getRRRatio()}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Icon name="info-circle" size={14} color="#888" />
          <Text style={styles.infoText}>
            Set SL line on MT4 chart. Direction auto-detects based on SL position.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[styles.tradeButton, styles.sellButton]}
          onPress={() => handleOpenTrade('sell')}
        >
          <Icon name="arrow-down" size={18} color="#fff" />
          <Text style={styles.tradeButtonText}>SELL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tradeButton, styles.buyButton]}
          onPress={() => handleOpenTrade('buy')}
        >
          <Icon name="arrow-up" size={18} color="#fff" />
          <Text style={styles.tradeButtonText}>BUY</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  symbolSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  symbolText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  directionBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  autoBadge: {
    backgroundColor: '#374151',
  },
  buyBadge: {
    backgroundColor: '#10b981',
  },
  sellBadge: {
    backgroundColor: '#ef4444',
  },
  directionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  riskToggle: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#3b82f6',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
  },
  toggleTextActive: {
    color: '#fff',
  },
  inputSection: {
    paddingHorizontal: 16,
    gap: 16,
  },
  inputRow: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  pipsText: {
    fontSize: 11,
    color: '#666',
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 10,
    margin: 16,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    color: '#888',
  },
  resultsSection: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
  },
  resultBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    margin: 16,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  tradeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PlanTradeScreen;
