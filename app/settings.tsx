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
import { useApp } from '../context/AppContext';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function SettingsScreen() {
  const { apiKey, setApiKey } = useApp();
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
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
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
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Speech-to-Text</Text>
              <Text style={styles.aboutValue}>OpenAI Whisper</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>AI Model</Text>
              <Text style={styles.aboutValue}>GPT-4o-mini</Text>
            </View>
          </View>
        </View>
        
        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          
          <View style={styles.card}>
            <Text style={styles.dataNote}>
              All your data is stored locally on your device. Voice recordings are sent 
              to OpenAI for processing and are not stored on their servers.
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

