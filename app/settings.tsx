import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { useApp, TranscriptionMode, LLMMode } from '../context/AppContext';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const LLM_MODES: { key: LLMMode; label: string; description: string; icon: string }[] = [
  { 
    key: 'local', 
    label: 'Local Only (Free)', 
    description: 'On-device pattern matching. Free, private, offline.',
    icon: '📱',
  },
  { 
    key: 'openai', 
    label: 'OpenAI (Best Quality)', 
    description: 'GPT-4o-mini for best extraction accuracy.',
    icon: '☁️',
  },
  { 
    key: 'hybrid', 
    label: 'Hybrid (Recommended)', 
    description: 'Local for simple, OpenAI for complex queries.',
    icon: '🔄',
  },
];

const TRANSCRIPTION_MODES: { key: TranscriptionMode; label: string; description: string; icon: string }[] = [
  { 
    key: 'hybrid', 
    label: 'Hybrid (Recommended)', 
    description: 'Uses on-device when available, falls back to Whisper',
    icon: '🔄',
  },
  { 
    key: 'on-device', 
    label: 'On-Device Only', 
    description: 'Free, fast, works offline. Requires dev build.',
    icon: '📱',
  },
  { 
    key: 'whisper', 
    label: 'Whisper Only', 
    description: 'Best accuracy, requires internet. ~$0.006/min',
    icon: '☁️',
  },
];

export default function SettingsScreen() {
  const { apiKey, setApiKey, transcriptionMode, setTranscriptionMode, llmMode, setLLMMode } = useApp();
  const [showApiKey, setShowApiKey] = useState(false);
  const [editingKey, setEditingKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  
  const handleUpdateKey = async () => {
    if (newApiKey.trim()) {
      await setApiKey(newApiKey.trim());
      setEditingKey(false);
      setNewApiKey('');
      Alert.alert('Success', 'API key updated successfully');
    }
  };
  
  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };
  
  const handleModeChange = async (mode: TranscriptionMode) => {
    await setTranscriptionMode(mode);
    
    if (mode === 'on-device') {
      Alert.alert(
        'Development Build Required',
        'On-device speech recognition requires a development build. It won\'t work in Expo Go.\n\nRun: npx expo prebuild && npx expo run:ios',
        [{ text: 'OK' }]
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Transcription Mode Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speech Recognition</Text>
          
          <View style={styles.card}>
            {TRANSCRIPTION_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.modeOption,
                  transcriptionMode === mode.key && styles.modeOptionActive,
                ]}
                onPress={() => handleModeChange(mode.key)}
              >
                <View style={styles.modeHeader}>
                  <Text style={styles.modeIcon}>{mode.icon}</Text>
                  <View style={styles.modeTextContainer}>
                    <Text style={[
                      styles.modeLabel,
                      transcriptionMode === mode.key && styles.modeLabelActive,
                    ]}>
                      {mode.label}
                    </Text>
                    <Text style={styles.modeDescription}>{mode.description}</Text>
                  </View>
                  <View style={[
                    styles.radioOuter,
                    transcriptionMode === mode.key && styles.radioOuterActive,
                  ]}>
                    {transcriptionMode === mode.key && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* LLM Mode Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entity Extraction (LLM)</Text>
          
          <View style={styles.card}>
            {LLM_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.modeOption,
                  llmMode === mode.key && styles.modeOptionActive,
                ]}
                onPress={() => setLLMMode(mode.key)}
              >
                <View style={styles.modeHeader}>
                  <Text style={styles.modeIcon}>{mode.icon}</Text>
                  <View style={styles.modeTextContainer}>
                    <Text style={[
                      styles.modeLabel,
                      llmMode === mode.key && styles.modeLabelActive,
                    ]}>
                      {mode.label}
                    </Text>
                    <Text style={styles.modeDescription}>{mode.description}</Text>
                  </View>
                  <View style={[
                    styles.radioOuter,
                    llmMode === mode.key && styles.radioOuterActive,
                  ]}>
                    {llmMode === mode.key && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* API Key Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OpenAI Configuration</Text>
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🔑</Text>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>API Key</Text>
                <Text style={styles.cardSubtitle}>
                  {apiKey ? 'Connected' : 'Not configured'}
                </Text>
              </View>
              <View style={[
                styles.statusDot,
                apiKey ? styles.statusDotActive : styles.statusDotInactive
              ]} />
            </View>
            
            {apiKey && !editingKey && (
              <View style={styles.apiKeyDisplay}>
                <Text style={styles.apiKeyText}>
                  {showApiKey ? apiKey : maskApiKey(apiKey)}
                </Text>
                <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                  <Text style={styles.toggleButton}>
                    {showApiKey ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            {editingKey ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={newApiKey}
                  onChangeText={setNewApiKey}
                  placeholder="sk-..."
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditingKey(false);
                      setNewApiKey('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleUpdateKey}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.updateButton}
                onPress={() => setEditingKey(true)}
              >
                <Text style={styles.updateButtonText}>
                  {apiKey ? 'Update Key' : 'Add Key'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.card}>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.3.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Speech-to-Text</Text>
              <Text style={styles.aboutValue}>
                {transcriptionMode === 'whisper' ? 'OpenAI Whisper' : 
                 transcriptionMode === 'on-device' ? 'Apple/Android' : 'Hybrid'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Entity Extraction</Text>
              <Text style={styles.aboutValue}>
                {llmMode === 'local' ? 'Local (Free)' : 
                 llmMode === 'openai' ? 'OpenAI GPT-4o-mini' : 'Hybrid'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          
          <View style={styles.card}>
            <Text style={styles.dataNote}>
              {transcriptionMode === 'on-device' 
                ? '🔒 On-device mode: Audio is processed locally and never leaves your device. Only the text transcript is sent to OpenAI for entity extraction.'
                : '☁️ Cloud mode: Audio is sent to OpenAI Whisper for transcription, then text is processed by GPT. OpenAI does not store your data.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  // Mode selection styles
  modeOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modeOptionActive: {
    backgroundColor: colors.accent + '10',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderBottomColor: 'transparent',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeLabel: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  modeLabelActive: {
    color: colors.accent,
  },
  modeDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  // Card header styles
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotActive: {
    backgroundColor: colors.success,
  },
  statusDotInactive: {
    backgroundColor: colors.error,
  },
  apiKeyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  apiKeyText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  toggleButton: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  editContainer: {
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  editButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  cancelButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  updateButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
  },
  updateButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  aboutLabel: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  aboutValue: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  dataNote: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
});
