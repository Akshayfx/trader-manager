/**
 * AI Analysis Screen
 * Shows AI-generated trade analysis reports
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { useThemeStore, colors } from '../store/themeStore';
import { useSettingsStore } from '../store/settingsStore';
import { aiAPI } from '../services/api';
import { trackEvent } from '../services/analytics';

interface AIReport {
  id: string;
  date: string;
  type: 'weekly' | 'monthly';
  summary: string;
  winRate: number;
  totalTrades: number;
  profitTrades: number;
  lossTrades: number;
  avgRR: number;
  bestPair: string;
  worstPair: string;
  insights: string[];
  recommendations: string[];
}

const AIAnalysisScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { ai } = useSettingsStore();

  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.getReports();
      if (response.success) {
        setReports(response.reports);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
    setLoading(false);
  };

  const generateReport = async () => {
    if (ai.reportsThisWeek >= 2) {
      trackEvent('ai_report_limit_reached');
      return;
    }

    setGenerating(true);
    try {
      const response = await aiAPI.generateReport();
      if (response.success) {
        trackEvent('ai_report_generated');
        loadReports();
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
    setGenerating(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const StatCard: React.FC<{ icon: string; label: string; value: string; color?: string }> = ({
    icon,
    label,
    value,
    color,
  }) => (
    <View style={[styles.statCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
      <Icon name={icon} size={20} color={color || themeColors.primary} />
      <Text style={[styles.statValue, { color: themeColors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>{label}</Text>
    </View>
  );

  const styles = createStyles(themeColors);

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.bgSecondary, borderColor: themeColors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>AI Trade Analysis</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
            Weekly & Monthly Performance Reports
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: themeColors.bgTertiary }]}>
          <Icon name="brain" size={14} color={themeColors.primary} />
          <Text style={[styles.badgeText, { color: themeColors.primary }]}>AI Powered</Text>
        </View>
      </View>

      {/* Generate Report Button */}
      <View style={styles.generateSection}>
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: themeColors.primary }]}
          onPress={generateReport}
          disabled={generating || ai.reportsThisWeek >= 2}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="magic" size={18} color="#fff" />
              <Text style={styles.generateButtonText}>Generate Report</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={[styles.generateLimit, { color: themeColors.textSecondary }]}>
          {ai.reportsThisWeek}/2 reports this week
        </Text>
      </View>

      {/* Latest Report */}
      {reports.length > 0 && (
        <View style={styles.latestReport}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Latest Report</Text>
          
          <View style={[styles.reportCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
            <View style={styles.reportHeader}>
              <View>
                <Text style={[styles.reportDate, { color: themeColors.textPrimary }]}>
                  {new Date(reports[0].date).toLocaleDateString()}
                </Text>
                <View style={[styles.reportType, { backgroundColor: themeColors.bgTertiary }]}>
                  <Text style={[styles.reportTypeText, { color: themeColors.primary }]}>
                    {reports[0].type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={[styles.winRateBadge, { 
                backgroundColor: reports[0].winRate >= 50 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
              }]}>
                <Text style={[styles.winRateText, { 
                  color: reports[0].winRate >= 50 ? '#22c55e' : '#ef4444'
                }]}>
                  {reports[0].winRate}% Win Rate
                </Text>
              </View>
            </View>

            <Text style={[styles.reportSummary, { color: themeColors.textSecondary }]}>
              {reports[0].summary}
            </Text>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                icon="chart-line"
                label="Total Trades"
                value={reports[0].totalTrades.toString()}
              />
              <StatCard
                icon="arrow-up"
                label="Winners"
                value={reports[0].profitTrades.toString()}
                color="#22c55e"
              />
              <StatCard
                icon="arrow-down"
                label="Losers"
                value={reports[0].lossTrades.toString()}
                color="#ef4444"
              />
              <StatCard
                icon="balance-scale"
                label="Avg R:R"
                value={reports[0].avgRR.toFixed(2)}
              />
            </View>

            {/* Best/Worst Pairs */}
            <View style={styles.pairsSection}>
              <View style={styles.pairItem}>
                <Icon name="trophy" size={16} color="#22c55e" />
                <Text style={[styles.pairLabel, { color: themeColors.textSecondary }]}>Best Pair</Text>
                <Text style={[styles.pairValue, { color: '#22c55e' }]}>{reports[0].bestPair}</Text>
              </View>
              <View style={styles.pairItem}>
                <Icon name="exclamation-triangle" size={16} color="#ef4444" />
                <Text style={[styles.pairLabel, { color: themeColors.textSecondary }]}>Worst Pair</Text>
                <Text style={[styles.pairValue, { color: '#ef4444' }]}>{reports[0].worstPair}</Text>
              </View>
            </View>

            {/* Insights */}
            <View style={styles.insightsSection}>
              <Text style={[styles.insightsTitle, { color: themeColors.textPrimary }]}>Key Insights</Text>
              {reports[0].insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Icon name="lightbulb" size={14} color={themeColors.primary} />
                  <Text style={[styles.insightText, { color: themeColors.textSecondary }]}>{insight}</Text>
                </View>
              ))}
            </View>

            {/* Recommendations */}
            <View style={styles.recommendationsSection}>
              <Text style={[styles.recommendationsTitle, { color: themeColors.textPrimary }]}>
                AI Recommendations
              </Text>
              {reports[0].recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={[styles.recommendationNumber, { backgroundColor: themeColors.primary }]}>
                    <Text style={styles.recommendationNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.recommendationText, { color: themeColors.textSecondary }]}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Previous Reports */}
      {reports.length > 1 && (
        <View style={styles.previousReports}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Previous Reports</Text>
          {reports.slice(1).map((report) => (
            <TouchableOpacity
              key={report.id}
              style={[styles.previousReportItem, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}
            >
              <View>
                <Text style={[styles.previousReportDate, { color: themeColors.textPrimary }]}>
                  {new Date(report.date).toLocaleDateString()}
                </Text>
                <Text style={[styles.previousReportType, { color: themeColors.textSecondary }]}>
                  {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                </Text>
              </View>
              <View style={[styles.previousWinRate, { 
                backgroundColor: report.winRate >= 50 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
              }]}>
                <Text style={[styles.previousWinRateText, { 
                  color: report.winRate >= 50 ? '#22c55e' : '#ef4444'
                }]}>
                  {report.winRate}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && (
        <View style={styles.emptyContainer}>
          <Icon name="brain" size={48} color={themeColors.textMuted} />
          <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>No Reports Yet</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
            Generate your first AI analysis report to see insights about your trading performance
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
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
    headerSubtitle: {
      fontSize: 13,
      marginTop: 2,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    generateSection: {
      padding: 16,
      alignItems: 'center',
    },
    generateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      width: '100%',
      height: 52,
      borderRadius: 12,
    },
    generateButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    generateLimit: {
      fontSize: 12,
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginHorizontal: 16,
      marginBottom: 12,
    },
    latestReport: {
      marginTop: 8,
    },
    reportCard: {
      marginHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
    },
    reportHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    reportDate: {
      fontSize: 16,
      fontWeight: '700',
    },
    reportType: {
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    reportTypeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    winRateBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    winRateText: {
      fontSize: 14,
      fontWeight: '700',
    },
    reportSummary: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      width: '23%',
      aspectRatio: 1,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      marginTop: 8,
    },
    statLabel: {
      fontSize: 10,
      marginTop: 4,
    },
    pairsSection: {
      flexDirection: 'row',
      gap: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      marginBottom: 16,
    },
    pairItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pairLabel: {
      fontSize: 12,
    },
    pairValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    insightsSection: {
      marginBottom: 16,
    },
    insightsTitle: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 10,
    },
    insightItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 8,
    },
    insightText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
    },
    recommendationsSection: {},
    recommendationsTitle: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 10,
    },
    recommendationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 10,
    },
    recommendationNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recommendationNumberText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#fff',
    },
    recommendationText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
    },
    previousReports: {
      marginTop: 24,
    },
    previousReportItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
    },
    previousReportDate: {
      fontSize: 14,
      fontWeight: '600',
    },
    previousReportType: {
      fontSize: 12,
      marginTop: 2,
    },
    previousWinRate: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    previousWinRateText: {
      fontSize: 13,
      fontWeight: '700',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      marginTop: 60,
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
      lineHeight: 20,
    },
  });

export default AIAnalysisScreen;
