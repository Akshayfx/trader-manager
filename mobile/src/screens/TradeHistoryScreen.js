/**
 * Trade History Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TradeHistoryScreen = () => {
  const [activeTab, setActiveTab] = useState('today');

  // Mock trade data
  const trades = {
    today: [
      { id: 1, symbol: 'EURUSD', type: 'BUY', lotSize: 0.05, entry: 1.0842, exit: 1.0875, profit: 33, profitUsd: 16.50, time: '10:30', result: 'win' },
      { id: 2, symbol: 'GBPUSD', type: 'SELL', lotSize: 0.03, entry: 1.2650, exit: 1.2620, profit: 30, profitUsd: 9.00, time: '11:45', result: 'win' },
      { id: 3, symbol: 'USDJPY', type: 'BUY', lotSize: 0.04, entry: 148.50, exit: 148.20, profit: -30, profitUsd: -12.00, time: '13:20', result: 'loss' },
    ],
    week: [
      { id: 4, symbol: 'XAUUSD', type: 'BUY', lotSize: 0.02, entry: 2030.50, exit: 2045.00, profit: 145, profitUsd: 29.00, time: 'Mon 09:15', result: 'win' },
      { id: 5, symbol: 'EURUSD', type: 'SELL', lotSize: 0.05, entry: 1.0920, exit: 1.0880, profit: 40, profitUsd: 20.00, time: 'Tue 14:30', result: 'win' },
      { id: 6, symbol: 'GBPUSD', type: 'BUY', lotSize: 0.03, entry: 1.2600, exit: 1.2580, profit: -20, profitUsd: -6.00, time: 'Wed 11:00', result: 'loss' },
      { id: 7, symbol: 'USDCHF', type: 'SELL', lotSize: 0.04, entry: 0.8650, exit: 0.8620, profit: 30, profitUsd: 12.00, time: 'Thu 16:45', result: 'win' },
    ],
    month: [
      { id: 8, symbol: 'EURUSD', type: 'BUY', lotSize: 0.06, entry: 1.0750, exit: 1.0850, profit: 100, profitUsd: 60.00, time: 'Jan 15', result: 'win' },
      { id: 9, symbol: 'GBPUSD', type: 'SELL', lotSize: 0.04, entry: 1.2800, exit: 1.2700, profit: 100, profitUsd: 40.00, time: 'Jan 18', result: 'win' },
    ],
  };

  const stats = {
    today: { trades: 3, winRate: 67, profit: 13.50 },
    week: { trades: 12, winRate: 75, profit: 145.00 },
    month: { trades: 28, winRate: 68, profit: 425.00 },
  };

  const TradeCard = ({ trade }) => (
    <View style={styles.tradeCard}>
      <View style={styles.tradeHeader}>
        <View style={styles.tradeSymbol}>
          <Text style={styles.symbolText}>{trade.symbol}</Text>
          <View style={[styles.typeBadge, trade.type === 'BUY' ? styles.buyBadge : styles.sellBadge]}>
            <Text style={styles.typeText}>{trade.type}</Text>
          </View>
        </View>
        <View style={styles.tradeResult}>
          <Text style={[styles.profitText, trade.result === 'win' ? styles.winText : styles.lossText]}>
            {trade.result === 'win' ? '+' : ''}{trade.profit} pips
          </Text>
          <Text style={[styles.profitUsdText, trade.result === 'win' ? styles.winText : styles.lossText]}>
            {trade.result === 'win' ? '+' : ''}${trade.profitUsd.toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.tradeDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Lot Size</Text>
          <Text style={styles.detailValue}>{trade.lotSize}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Entry</Text>
          <Text style={styles.detailValue}>{trade.entry}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Exit</Text>
          <Text style={styles.detailValue}>{trade.exit}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>{trade.time}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Stats Summary */}
      <View style={styles.statsPanel}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats[activeTab].trades}</Text>
            <Text style={styles.statLabel}>Trades</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats[activeTab].winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, stats[activeTab].profit >= 0 ? styles.winText : styles.lossText]}>
              ${stats[activeTab].profit.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Net Profit</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['today', 'week', 'month'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trade List */}
      <FlatList
        data={trades[activeTab]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TradeCard trade={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="chart-line" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No trades yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1d29',
  },
  statsPanel: {
    backgroundColor: '#23262f',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  winText: {
    color: '#10b981',
  },
  lossText: {
    color: '#ef4444',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#23262f',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  tradeCard: {
    backgroundColor: '#23262f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradeSymbol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  buyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  sellBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  tradeResult: {
    alignItems: 'flex-end',
  },
  profitText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  profitUsdText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  tradeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 10,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 12,
  },
});

export default TradeHistoryScreen;
