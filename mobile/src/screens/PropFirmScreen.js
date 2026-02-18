/**
 * Prop Firm Screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';

const PropFirmScreen = () => {
  const { propFirmStatus, setPropFirmStatus, settings, setSettings } = useStore();
  const [providers, setProviders] = useState({});
  const [localSettings, setLocalSettings] = useState(settings.propFirm);

  useEffect(() => {
    fetchProviders();
    fetchStatus();
  }, []);

  const fetchProviders = async () => {
    try {
      const token = await AsyncStorage.getItem('chartwise_token');
      const response = await fetch('http://localhost:3001/api/propfirm/providers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Fetch providers error:', error);
    }
  };

  const fetchStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('chartwise_token');
      const response = await fetch('http://localhost:3001/api/propfirm/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setPropFirmStatus(data.status);
      }
    } catch (error) {
      console.error('Fetch status error:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const token = await AsyncStorage.getItem('chartwise_token');
      const response = await fetch('http://localhost:3001/api/propfirm/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(localSettings)
      });
      
      if (response.ok) {
        setSettings({ propFirm: localSettings });
        alert('Settings saved');
      }
    } catch (error) {
      console.error('Save settings error:', error);
    }
  };

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'ftmo': return '#3b82f6';
      case 'myforexfunds': return '#10b981';
      case 'the5ers': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Status Card */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Today's Status</Text>
        <View style={[styles.statusCard, !propFirmStatus.isCompliant && styles.statusCardWarning]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusIcon, localSettings.enabled && styles.statusIconActive]}>
                <Icon name="office-building" size={24} color={localSettings.enabled ? '#fff' : '#6b7280'} />
              </View>
              <View>
                <Text style={styles.statusTitle}>Prop Firm Mode</Text>
                <Text style={styles.statusSubtitle}>
                  {localSettings.enabled ? 'Active' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={localSettings.enabled}
              onValueChange={(v) => setLocalSettings({ ...localSettings, enabled: v })}
              trackColor={{ false: '#3e3e3e', true: '#3b82f6' }}
            />
          </View>

          {localSettings.enabled && (
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, propFirmStatus.dailyPL < 0 && styles.negative]}>
                  ${propFirmStatus.dailyPL?.toFixed(0) || 0}
                </Text>
                <Text style={styles.statLabel}>Daily P&L</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{propFirmStatus.dailyTrades || 0}</Text>
                <Text style={styles.statLabel}>Trades</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, 
                  Math.abs(propFirmStatus.dailyPL || 0) > (localSettings.dailyLossLimit * 0.8) && styles.warning
                ]}>
                  ${localSettings.dailyLossLimit}
                </Text>
                <Text style={styles.statLabel}>Daily Limit</Text>
              </View>
            </View>
          )}

          {propFirmStatus.warnings?.length > 0 && (
            <View style={styles.warningsContainer}>
              {propFirmStatus.warnings.map((warning, index) => (
                <View key={index} style={styles.warningItem}>
                  <Icon name="alert-circle" size={16} color="#ef4444" />
                  <Text style={styles.warningText}>{warning}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Provider Selection */}
      {localSettings.enabled && (
        <View style={styles.providerSection}>
          <Text style={styles.sectionTitle}>Select Provider</Text>
          <View style={styles.providerGrid}>
            {Object.entries(providers).map(([key, provider]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.providerCard,
                  localSettings.provider === key && { borderColor: getProviderColor(key) }
                ]}
                onPress={() => setLocalSettings({ ...localSettings, provider: key })}
              >
                <View style={[styles.providerDot, { backgroundColor: getProviderColor(key) }]} />
                <Text style={styles.providerName}>{provider.name}</Text>
                {localSettings.provider === key && (
                  <Icon name="check-circle" size={18} color={getProviderColor(key)} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Limits Settings */}
      {localSettings.enabled && (
        <View style={styles.limitsSection}>
          <Text style={styles.sectionTitle}>Risk Limits</Text>
          
          <View style={styles.limitCard}>
            <View style={styles.limitRow}>
              <View style={styles.limitLeft}>
                <Icon name="cash-remove" size={20} color="#ef4444" />
                <View>
                  <Text style={styles.limitTitle}>Daily Loss Limit</Text>
                  <Text style={styles.limitDesc}>Maximum daily loss allowed</Text>
                </View>
              </View>
              <Text style={styles.limitValue}>${localSettings.dailyLossLimit}</Text>
            </View>
          </View>

          <View style={styles.limitCard}>
            <View style={styles.limitRow}>
              <View style={styles.limitLeft}>
                <Icon name="trending-down" size={20} color="#f59e0b" />
                <View>
                  <Text style={styles.limitTitle}>Max Drawdown</Text>
                  <Text style={styles.limitDesc}>Total account drawdown limit</Text>
                </View>
              </View>
              <Text style={styles.limitValue}>${localSettings.maxDrawdown}</Text>
            </View>
          </View>

          <View style={styles.limitCard}>
            <View style={styles.limitRow}>
              <View style={styles.limitLeft}>
                <Icon name="trophy" size={20} color="#10b981" />
                <View>
                  <Text style={styles.limitTitle}>Profit Target</Text>
                  <Text style={styles.limitDesc}>Target profit to pass challenge</Text>
                </View>
              </View>
              <Text style={styles.limitValue}>${localSettings.profitTarget}</Text>
            </View>
          </View>

          <View style={styles.limitCard}>
            <View style={styles.limitRow}>
              <View style={styles.limitLeft}>
                <Icon name="clock" size={20} color="#3b82f6" />
                <View>
                  <Text style={styles.limitTitle}>Time Limit</Text>
                  <Text style={styles.limitDesc}>Days to complete challenge</Text>
                </View>
              </View>
              <Text style={styles.limitValue}>{localSettings.timeLimit} days</Text>
            </View>
          </View>
        </View>
      )}

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
        <Text style={styles.saveBtnText}>Save Settings</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1d29',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statusSection: {
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#23262f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  statusCardWarning: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconActive: {
    backgroundColor: '#3b82f6',
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  statusSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  negative: {
    color: '#ef4444',
  },
  warning: {
    color: '#f59e0b',
  },
  warningsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.2)',
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#ef4444',
  },
  providerSection: {
    marginBottom: 24,
  },
  providerGrid: {
    gap: 10,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#23262f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
  },
  providerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  providerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  limitsSection: {
    marginBottom: 24,
  },
  limitCard: {
    backgroundColor: '#23262f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  limitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  limitDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  limitValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default PropFirmScreen;
