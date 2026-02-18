/**
 * News Screen
 * Shows economic calendar and news alerts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { useThemeStore, colors } from '../store/themeStore';
import { useSettingsStore } from '../store/settingsStore';
import { newsAPI } from '../services/api';

interface NewsEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  impact: 'low' | 'medium' | 'high';
  actual?: string;
  forecast?: string;
  previous?: string;
  minutesUntil: number;
}

const NewsScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { news } = useSettingsStore();

  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNews = async () => {
    try {
      const response = await newsAPI.getUpcomingEvents();
      if (response.success) {
        setEvents(response.events);
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
      default:
        return themeColors.textMuted;
    }
  };

  const getCountdownText = (minutes: number) => {
    if (minutes <= 0) return 'LIVE NOW';
    if (minutes < 60) return `In ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `In ${hours}h ${minutes % 60}m`;
  };

  const renderEvent = ({ item }: { item: NewsEvent }) => (
    <View style={[styles.eventCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
      <View style={styles.eventHeader}>
        <View style={styles.timeContainer}>
          <Text style={[styles.time, { color: themeColors.textSecondary }]}>{item.time}</Text>
          <View style={[styles.countdown, { backgroundColor: themeColors.bgTertiary }]}>
            <Text style={[styles.countdownText, { color: getImpactColor(item.impact) }]}>
              {getCountdownText(item.minutesUntil)}
            </Text>
          </View>
        </View>
        <View style={[styles.impactBadge, { backgroundColor: `${getImpactColor(item.impact)}20` }]}>
          <View style={[styles.impactDot, { backgroundColor: getImpactColor(item.impact) }]} />
          <Text style={[styles.impactText, { color: getImpactColor(item.impact) }]}>
            {item.impact.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.eventContent}>
        <View style={styles.currencyContainer}>
          <Text style={[styles.currency, { color: themeColors.primary }]}>{item.currency}</Text>
        </View>
        <Text style={[styles.eventName, { color: themeColors.textPrimary }]}>{item.event}</Text>
      </View>

      {(item.actual || item.forecast || item.previous) && (
        <View style={styles.eventData}>
          {item.actual && (
            <View style={styles.dataItem}>
              <Text style={[styles.dataLabel, { color: themeColors.textMuted }]}>Actual</Text>
              <Text style={[styles.dataValue, { color: themeColors.textPrimary }]}>{item.actual}</Text>
            </View>
          )}
          {item.forecast && (
            <View style={styles.dataItem}>
              <Text style={[styles.dataLabel, { color: themeColors.textMuted }]}>Forecast</Text>
              <Text style={[styles.dataValue, { color: themeColors.textPrimary }]}>{item.forecast}</Text>
            </View>
          )}
          {item.previous && (
            <View style={styles.dataItem}>
              <Text style={[styles.dataLabel, { color: themeColors.textMuted }]}>Previous</Text>
              <Text style={[styles.dataValue, { color: themeColors.textPrimary }]}>{item.previous}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const styles = createStyles(themeColors);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.bgSecondary, borderColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>Economic Calendar</Text>
        <View style={styles.filterContainer}>
          <Text style={[styles.filterText, { color: themeColors.textSecondary }]}>
            {news.currencies.length} currencies
          </Text>
        </View>
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="newspaper" size={48} color={themeColors.textMuted} />
            <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>No Upcoming Events</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              Check back later for new events
            </Text>
          </View>
        }
      />
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
    filterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterText: {
      fontSize: 13,
    },
    listContent: {
      padding: 16,
    },
    eventCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 12,
    },
    eventHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    time: {
      fontSize: 13,
      fontWeight: '600',
    },
    countdown: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    countdownText: {
      fontSize: 11,
      fontWeight: '700',
    },
    impactBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    impactDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    impactText: {
      fontSize: 11,
      fontWeight: '700',
    },
    eventContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    currencyContainer: {
      backgroundColor: themeColors.bgTertiary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    currency: {
      fontSize: 13,
      fontWeight: '700',
    },
    eventName: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    eventData: {
      flexDirection: 'row',
      gap: 24,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    dataItem: {
      alignItems: 'center',
    },
    dataLabel: {
      fontSize: 11,
      marginBottom: 2,
    },
    dataValue: {
      fontSize: 14,
      fontWeight: '700',
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

export default NewsScreen;
