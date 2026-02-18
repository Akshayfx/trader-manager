/**
 * Settings Screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

import { useThemeStore, colors } from '../store/themeStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { trackEvent } from '../services/analytics';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, toggleTheme } = useThemeStore();
  const settings = useSettingsStore();
  const { logout, user } = useAuthStore();
  const themeColors = colors[theme];

  const handleLogout = () => {
    logout();
    navigation.navigate('Login' as never);
  };

  const SettingItem: React.FC<{
    icon: string;
    title: string;
    subtitle?: string;
    value?: boolean;
    onToggle?: (value: boolean) => void;
    onPress?: () => void;
    showArrow?: boolean;
  }> = ({ icon, title, subtitle, value, onToggle, onPress, showArrow }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !onToggle}
    >
      <View style={[styles.iconContainer, { backgroundColor: themeColors.bgTertiary }]}>
        <Icon name={icon} size={16} color={themeColors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: themeColors.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {onToggle && (
        <Switch
          value={value}
          onValueChange={(val) => {
            onToggle(val);
            trackEvent('setting_changed', { setting: title, value: val });
          }}
          trackColor={{ false: themeColors.border, true: themeColors.primary }}
          thumbColor="#fff"
        />
      )}
      {showArrow && <Icon name="chevron-right" size={14} color={themeColors.textMuted} />}
    </TouchableOpacity>
  );

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Text style={[styles.sectionHeader, { color: themeColors.textMuted }]}>{title}</Text>
  );

  const styles = createStyles(themeColors);

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* User Info */}
      <View style={[styles.userCard, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
        <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
        <View>
          <Text style={[styles.username, { color: themeColors.textPrimary }]}>{user?.username || 'User'}</Text>
          <Text style={[styles.email, { color: themeColors.textSecondary }]}>{user?.email || 'user@example.com'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: themeColors.bgTertiary }]}>
          <Text style={[styles.badgeText, { color: themeColors.primary }]}>{user?.subscription?.toUpperCase() || 'FREE'}</Text>
        </View>
      </View>

      {/* Display Settings */}
      <SectionHeader title="DISPLAY" />
      <View style={[styles.section, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
        <SettingItem
          icon="eye"
          title="Show Balance"
          value={settings.display.showBalance}
          onToggle={(val) => settings.updateDisplay({ showBalance: val })}
        />
        <SettingItem
          icon="chart-line"
          title="Show Open P&L"
          value={settings.display.showPL}
          onToggle={(val) => settings.updateDisplay({ showPL: val })}
        />
        <SettingItem
          icon="list-ol"
          title="Show Positions Count"
          value={settings.display.showPositions}
          onToggle={(val) => settings.updateDisplay({ showPositions: val })}
        />
        <SettingItem
          icon={theme === 'dark' ? 'moon' : 'sun'}
          title="Dark Mode"
          value={theme === 'dark'}
          onToggle={toggleTheme}
        />
      </View>

      {/* Trading Settings */}
      <SectionHeader title="TRADING" />
      <View style={[styles.section, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
        <SettingItem
          icon="shield-alt"
          title="Auto Breakeven"
          subtitle={`Trigger at ${settings.autoBE.triggerPips} pips`}
          value={settings.autoBE.enabled}
          onToggle={(val) => settings.updateAutoBE({ enabled: val })}
          onPress={() => {/* Navigate to Auto BE settings */}}
          showArrow
        />
        <SettingItem
          icon="bullseye"
          title="Target Default"
          subtitle={`${settings.target.mode === 'rr' ? settings.target.rr + ':1 RR' : '$' + settings.target.money}`}
          value={settings.target.enabled}
          onToggle={(val) => settings.updateTarget({ enabled: val })}
          onPress={() => {/* Navigate to Target settings */}}
          showArrow
        />
        <SettingItem
          icon="layer-group"
          title="Partial Take Profit"
          subtitle={`${settings.partialTPLevels.length} levels configured`}
          value={settings.partialTP}
          onToggle={(val) => {/* Toggle partial TP */}}
          onPress={() => {/* Navigate to Partial TP settings */}}
          showArrow
        />
        <SettingItem
          icon="sliders-h"
          title="Custom Close"
          subtitle={`Default: ${settings.customClose.defaultPercent}%`}
          onPress={() => {/* Navigate to Custom Close settings */}}
          showArrow
        />
      </View>

      {/* Prop Firm */}
      <SectionHeader title="PROP FIRM" />
      <View style={[styles.section, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
        <SettingItem
          icon="building"
          title="Prop Firm Mode"
          subtitle={`Daily limit: $${settings.propFirm.dailyLossLimit}`}
          value={settings.propFirm.enabled}
          onToggle={(val) => settings.updatePropFirm({ enabled: val })}
          onPress={() => {/* Navigate to Prop Firm settings */}}
          showArrow
        />
      </View>

      {/* News */}
      <SectionHeader title="NEWS & ALERTS" />
      <View style={[styles.section, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
        <SettingItem
          icon="newspaper"
          title="News Filter"
          subtitle={`Monitoring ${settings.news.currencies.length} currencies`}
          value={settings.news.enabled}
          onToggle={(val) => settings.updateNews({ enabled: val })}
          onPress={() => {/* Navigate to News settings */}}
          showArrow
        />
      </View>

      {/* AI */}
      <SectionHeader title="AI & ANALYTICS" />
      <View style={[styles.section, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
        <SettingItem
          icon="brain"
          title="AI Trade Analysis"
          subtitle="Weekly performance reports"
          value={settings.ai.enabled}
          onToggle={(val) => settings.updateAI({ enabled: val })}
          onPress={() => {/* Navigate to AI settings */}}
          showArrow
        />
      </View>

      {/* Account */}
      <SectionHeader title="ACCOUNT" />
      <View style={[styles.section, { backgroundColor: themeColors.bgCard, borderColor: themeColors.border }]}>
        <SettingItem
          icon="user-cog"
          title="Profile Settings"
          onPress={() => {/* Navigate to Profile */}}
          showArrow
        />
        <SettingItem
          icon="credit-card"
          title="Subscription"
          subtitle="Manage your plan"
          onPress={() => {/* Navigate to Subscription */}}
          showArrow
        />
        <SettingItem
          icon="question-circle"
          title="Help & Support"
          onPress={() => {/* Navigate to Help */}}
          showArrow
        />
        <SettingItem
          icon="info-circle"
          title="About"
          subtitle="Version 3.0.0"
          onPress={() => {/* Navigate to About */}}
          showArrow
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="sign-out-alt" size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const createStyles = (themeColors: typeof colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#fff',
    },
    username: {
      fontSize: 18,
      fontWeight: '700',
    },
    email: {
      fontSize: 13,
      marginTop: 2,
    },
    badge: {
      marginLeft: 'auto',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '700',
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 8,
    },
    section: {
      marginHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 15,
      fontWeight: '600',
    },
    settingSubtitle: {
      fontSize: 12,
      marginTop: 2,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 24,
      padding: 16,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: 12,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ef4444',
    },
  });

export default SettingsScreen;
