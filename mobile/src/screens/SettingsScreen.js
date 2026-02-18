import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTradeStore } from '../store/tradeStore';
import { useAuthStore } from '../store/authStore';

const SettingsScreen = ({ navigation }) => {
  const { logout } = useAuthStore();
  const { settings, setSettings } = useTradeStore();
  const [activeTab, setActiveTab] = useState('risk');

  const tabs = [
    { id: 'risk', label: 'Risk', icon: 'shield-alt' },
    { id: 'autobe', label: 'Auto BE', icon: 'sync-alt' },
    { id: 'partial', label: 'Partial TP', icon: 'layer-group' },
    { id: 'customclose', label: 'Close', icon: 'sliders-h' },
    { id: 'news', label: 'News', icon: 'newspaper' },
    { id: 'mt', label: 'MT', icon: 'plug' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'risk':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Risk Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Default Risk %</Text>
              <TextInput
                style={styles.settingInput}
                value={settings.risk.defaultRiskPercent.toString()}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Default Risk $</Text>
              <TextInput
                style={styles.settingInput}
                value={settings.risk.defaultRiskMoney.toString()}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Prop Firm Mode</Text>
              <Switch
                value={settings.propFirm.enabled}
                trackColor={{ false: '#333', true: '#3b82f6' }}
              />
            </View>

            {settings.propFirm.enabled && (
              <>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Daily Loss Limit %</Text>
                  <TextInput
                    style={styles.settingInput}
                    value={settings.propFirm.dailyLossPercent.toString()}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Block News Trading</Text>
                  <Switch
                    value={settings.propFirm.newsBlock}
                    trackColor={{ false: '#333', true: '#3b82f6' }}
                  />
                </View>
              </>
            )}
          </View>
        );

      case 'autobe':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Auto Breakeven</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Trigger Pips</Text>
              <TextInput
                style={styles.settingInput}
                value={settings.autoBreakeven.triggerPips.toString()}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Plus Pips</Text>
              <TextInput
                style={styles.settingInput}
                value={settings.autoBreakeven.plusPips.toString()}
                keyboardType="number-pad"
              />
            </View>
          </View>
        );

      case 'partial':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Partial Take Profit</Text>
            <Text style={styles.sectionDesc}>
              Set default partial TP levels
            </Text>

            {settings.partialTP.levels.map((level, index) => (
              <View key={index} style={styles.tpRow}>
                <Text style={styles.tpLabel}>TP {index + 1}</Text>
                <TextInput
                  style={styles.tpInput}
                  placeholder="Pips"
                  value={level.value.toString()}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={styles.tpInput}
                  placeholder="%"
                  value={level.percent.toString()}
                  keyboardType="number-pad"
                />
              </View>
            ))}
          </View>
        );

      case 'customclose':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Custom Close</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Default Close %</Text>
              <TextInput
                style={styles.settingInput}
                value={settings.customClose.defaultPercent.toString()}
                keyboardType="number-pad"
              />
            </View>
          </View>
        );

      case 'news':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>News Filter</Text>
            
            <Text style={styles.subSectionTitle}>Currencies</Text>
            <View style={styles.currencyGrid}>
              {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyChip,
                    settings.news.currencies.includes(curr) && styles.currencyChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyChipText,
                      settings.news.currencies.includes(curr) && styles.currencyChipTextActive,
                    ]}
                  >
                    {curr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subSectionTitle}>Impact Levels</Text>
            <View style={styles.impactRow}>
              {['High', 'Medium', 'Low'].map((impact) => (
                <TouchableOpacity
                  key={impact}
                  style={[
                    styles.impactChip,
                    settings.news.impactLevels.includes(impact.toLowerCase()) &&
                      styles.impactChipActive,
                  ]}
                >
                  <View
                    style={[
                      styles.impactDot,
                      impact === 'High'
                        ? styles.impactHigh
                        : impact === 'Medium'
                        ? styles.impactMedium
                        : styles.impactLow,
                    ]}
                  />
                  <Text style={styles.impactChipText}>{impact}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'mt':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>MetaTrader Connection</Text>
            
            <View style={styles.connectionStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Connected</Text>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Magic Key</Text>
              <TextInput
                style={styles.settingInput}
                value="CHARTWISE_001"
                editable={false}
              />
            </View>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={logout}>
          <Icon name="sign-out-alt" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Icon
              name={tab.icon}
              size={14}
              color={activeTab === tab.id ? '#fff' : '#888'}
            />
            <Text
              style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView style={styles.content}>{renderTabContent()}</ScrollView>
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
  tabsContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tabsContent: {
    paddingHorizontal: 8,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  settingLabel: {
    fontSize: 14,
    color: '#fff',
  },
  settingInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
    minWidth: 80,
    textAlign: 'center',
  },
  tpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  tpLabel: {
    width: 50,
    fontSize: 14,
    color: '#888',
  },
  tpInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  currencyChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  currencyChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  currencyChipTextActive: {
    color: '#fff',
  },
  impactRow: {
    flexDirection: 'row',
    gap: 10,
  },
  impactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  impactChipActive: {
    borderColor: '#3b82f6',
  },
  impactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  impactHigh: {
    backgroundColor: '#ef4444',
  },
  impactMedium: {
    backgroundColor: '#f97316',
  },
  impactLow: {
    backgroundColor: '#3b82f6',
  },
  impactChipText: {
    fontSize: 12,
    color: '#fff',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 14,
    color: '#10b981',
  },
  actionButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default SettingsScreen;
