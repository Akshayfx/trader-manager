/**
 * MetaTrader Connection Screen
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

const MTConnectionScreen = () => {
  const { mtStatus, setMTStatus, settings, updateSettings } = useStore();
  const [localSettings, setLocalSettings] = useState(settings.mtConnection);

  useEffect(() => {
    fetchMTStatus();
  }, []);

  const fetchMTStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('chartwise_token');
      const response = await fetch('http://localhost:3001/api/mt/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setMTStatus(data.status);
      }
    } catch (error) {
      console.error('Fetch MT status error:', error);
    }
  };

  const connectMT = async (version) => {
    try {
      const token = await AsyncStorage.getItem('chartwise_token');
      await fetch('http://localhost:3001/api/mt/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ version })
      });
      
      // Show instructions
      alert(`To connect ${version.toUpperCase()}:\n\n1. Open MetaTrader ${version === 'mt4' ? '4' : '5'}\n2. Attach ChartWise_Manager EA to any chart\n3. Enable "Allow DLL imports" in EA properties`);
    } catch (error) {
      console.error('Connect MT error:', error);
    }
  };

  const disconnectMT = async () => {
    try {
      const token = await AsyncStorage.getItem('chartwise_token');
      await fetch('http://localhost:3001/api/mt/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setMTStatus({
        mt4: { connected: false, info: null },
        mt5: { connected: false, info: null },
        anyConnected: false
      });
    } catch (error) {
      console.error('Disconnect MT error:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const token = await AsyncStorage.getItem('chartwise_token');
      await fetch('http://localhost:3001/api/mt/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(localSettings)
      });
      
      updateSettings('mtConnection', null, localSettings);
      alert('Settings saved');
    } catch (error) {
      console.error('Save settings error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Connection Status Cards */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Connection Status</Text>
        
        {/* MT4 Status */}
        <View style={[styles.statusCard, mtStatus.mt4.connected && styles.statusCardConnected]}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusIcon, mtStatus.mt4.connected && styles.statusIconConnected]}>
                <Icon name="chart-areaspline" size={24} color={mtStatus.mt4.connected ? '#10b981' : '#6b7280'} />
              </View>
              <View>
                <Text style={styles.statusTitle}>MetaTrader 4</Text>
                <Text style={styles.statusSubtitle}>
                  {mtStatus.mt4.connected ? 'Connected' : 'Not Connected'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, mtStatus.mt4.connected && styles.statusBadgeConnected]}>
              <Text style={[styles.statusBadgeText, mtStatus.mt4.connected && styles.statusBadgeTextConnected]}>
                {mtStatus.mt4.connected ? 'LIVE' : 'OFFLINE'}
              </Text>
            </View>
          </View>
          {mtStatus.mt4.connected && mtStatus.mt4.info && (
            <View style={styles.accountInfo}>
              <Text style={styles.accountText}>Account: {mtStatus.mt4.info.accountNumber}</Text>
              <Text style={styles.accountText}>Balance: ${mtStatus.mt4.info.balance}</Text>
            </View>
          )}
        </View>

        {/* MT5 Status */}
        <View style={[styles.statusCard, mtStatus.mt5.connected && styles.statusCardConnected]}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusIcon, mtStatus.mt5.connected && styles.statusIconConnected]}>
                <Icon name="chart-line" size={24} color={mtStatus.mt5.connected ? '#10b981' : '#6b7280'} />
              </View>
              <View>
                <Text style={styles.statusTitle}>MetaTrader 5</Text>
                <Text style={styles.statusSubtitle}>
                  {mtStatus.mt5.connected ? 'Connected' : 'Not Connected'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, mtStatus.mt5.connected && styles.statusBadgeConnected]}>
              <Text style={[styles.statusBadgeText, mtStatus.mt5.connected && styles.statusBadgeTextConnected]}>
                {mtStatus.mt5.connected ? 'LIVE' : 'OFFLINE'}
              </Text>
            </View>
          </View>
          {mtStatus.mt5.connected && mtStatus.mt5.info && (
            <View style={styles.accountInfo}>
              <Text style={styles.accountText}>Account: {mtStatus.mt5.info.accountNumber}</Text>
              <Text style={styles.accountText}>Balance: ${mtStatus.mt5.info.balance}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Connection Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.connectBtn]}
            onPress={() => connectMT('mt4')}
          >
            <Icon name="connection" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Connect MT4</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.connectBtn]}
            onPress={() => connectMT('mt5')}
          >
            <Icon name="connection" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Connect MT5</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.disconnectBtn]}
          onPress={disconnectMT}
        >
          <Icon name="close-circle" size={20} color="#ef4444" />
          <Text style={[styles.actionBtnText, styles.disconnectText]}>Disconnect All</Text>
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Auto-Connect on Startup</Text>
          <Switch
            value={localSettings.autoConnect}
            onValueChange={(v) => setLocalSettings({ ...localSettings, autoConnect: v })}
            trackColor={{ false: '#3e3e3e', true: '#3b82f6' }}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Preferred Version</Text>
          <View style={styles.selectContainer}>
            {['auto', 'mt4', 'mt5'].map((version) => (
              <TouchableOpacity
                key={version}
                style={[
                  styles.selectOption,
                  localSettings.preferredVersion === version && styles.selectOptionActive
                ]}
                onPress={() => setLocalSettings({ ...localSettings, preferredVersion: version })}
              >
                <Text style={[
                  styles.selectOptionText,
                  localSettings.preferredVersion === version && styles.selectOptionTextActive
                ]}>
                  {version.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Reconnect Interval (ms)</Text>
          <View style={styles.intervalButtons}>
            {[3000, 5000, 10000].map((interval) => (
              <TouchableOpacity
                key={interval}
                style={[
                  styles.intervalBtn,
                  localSettings.reconnectInterval === interval && styles.intervalBtnActive
                ]}
                onPress={() => setLocalSettings({ ...localSettings, reconnectInterval: interval })}
              >
                <Text style={[
                  styles.intervalBtnText,
                  localSettings.reconnectInterval === interval && styles.intervalBtnTextActive
                ]}>
                  {interval / 1000}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>How to Connect</Text>
        <View style={styles.instructionsCard}>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>Open MetaTrader 4 or 5 on your computer</Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>Attach <Text style={styles.stepHighlight}>ChartWise_Manager</Text> EA to any chart</Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepText}>Enable <Text style={styles.stepHighlight}>"Allow DLL imports"</Text> in EA properties</Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
            <Text style={styles.stepText}>Click "Connect" button above</Text>
          </View>
        </View>
      </View>

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
    marginBottom: 12,
  },
  statusCardConnected: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  statusIconConnected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeConnected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  statusBadgeTextConnected: {
    color: '#10b981',
  },
  accountInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  accountText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  connectBtn: {
    backgroundColor: '#3b82f6',
  },
  disconnectBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  disconnectText: {
    color: '#ef4444',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#23262f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  selectContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  selectOptionActive: {
    backgroundColor: '#3b82f6',
  },
  selectOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  selectOptionTextActive: {
    color: '#fff',
  },
  intervalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  intervalBtnActive: {
    backgroundColor: '#3b82f6',
  },
  intervalBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  intervalBtnTextActive: {
    color: '#fff',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  instructionsSection: {
    marginBottom: 24,
  },
  instructionsCard: {
    backgroundColor: '#23262f',
    borderRadius: 16,
    padding: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  stepHighlight: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default MTConnectionScreen;
