/**
 * AI Settings Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStore } from '../store/useStore';

const AISettingsScreen = () => {
  const { settings, updateSettings } = useStore();
  const [showModelModal, setShowModelModal] = useState(false);

  const models = [
    { id: 'conservative', name: 'Conservative', desc: 'Lower risk, more cautious' },
    { id: 'balanced', name: 'Balanced', desc: 'Recommended for most traders' },
    { id: 'aggressive', name: 'Aggressive', desc: 'Higher risk tolerance' },
    { id: 'scalper', name: 'Scalper', desc: 'Optimized for quick trades' },
    { id: 'swing', name: 'Swing Trader', desc: 'For longer-term positions' },
  ];

  const conditions = [
    {
      type: 'RISK PROTECTION',
      name: 'High Volatility Protection',
      description: 'Reduce position size when ATR spikes',
      enabled: true,
    },
    {
      type: 'CORRELATION',
      name: 'Correlation Risk Limiter',
      description: 'Prevent overexposure to correlated pairs',
      enabled: true,
    },
    {
      type: 'TIME-BASED',
      name: 'Session Close Protection',
      description: 'Close positions before market close',
      enabled: false,
    },
  ];

  const ConditionCard = ({ condition }) => (
    <View style={styles.conditionCard}>
      <View style={styles.conditionHeader}>
        <View>
          <Text style={styles.conditionType}>{condition.type}</Text>
          <Text style={styles.conditionName}>{condition.name}</Text>
          <Text style={styles.conditionDesc}>{condition.description}</Text>
        </View>
        <TouchableOpacity style={styles.conditionActions}>
          <Icon name="pencil" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* AI Core Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="robot" size={20} color="#a855f7" />
          <Text style={styles.sectionTitle}>AI Core</Text>
        </View>
        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowModelModal(true)}
          >
            <View>
              <Text style={styles.settingLabel}>AI Model</Text>
              <Text style={styles.settingValue}>
                {models.find(m => m.id === settings.ai.model)?.name || 'Balanced'}
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Conditions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="lightning-bolt" size={20} color="#f59e0b" />
          <Text style={styles.sectionTitle}>AI Conditions</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Define custom conditions for AI to monitor and act upon
        </Text>
        
        {conditions.map((condition, index) => (
          <ConditionCard key={index} condition={condition} />
        ))}
        
        <TouchableOpacity style={styles.addConditionBtn}>
          <Icon name="plus" size={18} color="#a855f7" />
          <Text style={styles.addConditionText}>ADD NEW CONDITION</Text>
        </TouchableOpacity>
      </View>

      {/* Prop Firm Mode */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="office-building" size={20} color="#3b82f6" />
          <Text style={styles.sectionTitle}>Prop Firm Mode</Text>
        </View>
        <View style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Enable Prop Firm Mode</Text>
            <View style={styles.toggle}>
              <View style={styles.toggleInactive} />
            </View>
          </View>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Prop Firm Provider</Text>
            <Text style={styles.settingValue}>Custom Rules</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Model Selection Modal */}
      <Modal
        visible={showModelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select AI Model</Text>
              <TouchableOpacity onPress={() => setShowModelModal(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {models.map((model) => (
              <TouchableOpacity
                key={model.id}
                style={[
                  styles.modelOption,
                  settings.ai.model === model.id && styles.modelOptionActive,
                ]}
                onPress={() => {
                  updateSettings('ai', 'model', model.id);
                  setShowModelModal(false);
                }}
              >
                <Text style={styles.modelName}>{model.name}</Text>
                <Text style={styles.modelDesc}>{model.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1d29',
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
    lineHeight: 18,
  },
  settingsCard: {
    backgroundColor: '#23262f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  settingValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 2,
  },
  toggleInactive: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  conditionCard: {
    backgroundColor: '#1a1d29',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  conditionType: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a855f7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  conditionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  conditionDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
  },
  conditionActions: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addConditionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
  },
  addConditionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a855f7',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#23262f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  modelOption: {
    backgroundColor: '#1a1d29',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  modelOptionActive: {
    borderColor: '#3b82f6',
  },
  modelName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  modelDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});

export default AISettingsScreen;
