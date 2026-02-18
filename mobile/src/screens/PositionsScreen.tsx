/**
 * Positions Screen
 * Shows open positions and trade history
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { useThemeStore, colors } from '../store/themeStore';
import { useTradingStore, Position } from '../store/tradingStore';
import { trackEvent } from '../services/analytics';

const PositionsScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { positions, closePosition, moveSLToBE } = useTradingStore();

  const handleClose = (position: Position) => {
    trackEvent('position_close', { symbol: position.symbol, id: position.id });
    closePosition(position.id);
  };

  const handleSLToBE = (position: Position) => {
    trackEvent('position_sl_to_be', { symbol: position.symbol, id: position.id });
    moveSLToBE(position.id);
  };

  const renderPosition = ({ item }: { item: Position }) => (
    <View style={[styles.positionCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
      <View style={styles.positionHeader}>
        <View style={styles.symbolContainer}>
          <Text style={[styles.symbol, { color: themeColors.textPrimary }]}>{item.symbol}</Text>
          <View style={[styles.directionBadge, { backgroundColor: item.direction === 'buy' ? '#22c55e' : '#ef4444' }]}>
            <Text style={styles.directionText}>{item.direction.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={[styles.profit, { color: item.profit >= 0 ? '#22c55e' : '#ef4444' }]}>
          {item.profit >= 0 ? '+' : ''}${item.profit.toFixed(2)}
        </Text>
      </View>

      <View style={styles.positionDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Entry</Text>
          <Text style={[styles.detailValue, { color: themeColors.textPrimary }]}>{item.entryPrice.toFixed(5)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Current</Text>
          <Text style={[styles.detailValue, { color: themeColors.textPrimary }]}>{item.currentPrice.toFixed(5)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Lot Size</Text>
          <Text style={[styles.detailValue, { color: themeColors.textPrimary }]}>{item.lotSize.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>SL</Text>
          <Text style={[styles.detailValue, { color: themeColors.textPrimary }]}>{item.stopLoss.toFixed(5)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>TP</Text>
          <Text style={[styles.detailValue, { color: themeColors.textPrimary }]}>{item.takeProfit.toFixed(5)}</Text>
        </View>
      </View>

      <View style={styles.positionActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.bgTertiary }]}
          onPress={() => handleSLToBE(item)}
        >
          <Icon name="shield-alt" size={14} color={themeColors.primary} />
          <Text style={[styles.actionText, { color: themeColors.primary }]}>SL→BE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.bgTertiary }]}
        >
          <Icon name="cut" size={14} color={themeColors.textSecondary} />
          <Text style={[styles.actionText, { color: themeColors.textSecondary }]}>Close ½</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: '#ef4444' }]}
          onPress={() => handleClose(item)}
        >
          <Icon name="times" size={14} color="#fff" />
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const styles = createStyles(themeColors);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.bgSecondary, borderColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>Open Positions</Text>
        <View style={styles.headerStats}>
          <Text style={[styles.statText, { color: themeColors.textSecondary }]}>
            {positions.length} positions
          </Text>
        </View>
      </View>

      {/* Positions List */}
      {positions.length > 0 ? (
        <FlatList
          data={positions}
          renderItem={renderPosition}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="chart-line" size={48} color={themeColors.textMuted} />
          <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>No Open Positions</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
            Your open trades will appear here
          </Text>
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
    },
    headerStats: {
      flexDirection: 'row',
      gap: 16,
    },
    statText: {
      fontSize: 14,
    },
    listContent: {
      padding: 16,
    },
    positionCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 12,
    },
    positionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    symbolContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    symbol: {
      fontSize: 18,
      fontWeight: '700',
    },
    directionBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    directionText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#fff',
    },
    profit: {
      fontSize: 18,
      fontWeight: '700',
    },
    positionDetails: {
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    detailLabel: {
      fontSize: 13,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '600',
    },
    positionActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 8,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
    },
    closeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 8,
    },
    closeButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
  });

export default PositionsScreen;
