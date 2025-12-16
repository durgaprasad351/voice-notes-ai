import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { runBenchmark, BenchmarkResult } from '../services/benchmark';
import { resetModel, getLlamaStatus } from '../services/llamaService';

export default function SettingsScreen() {
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[] | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [modelStatus, setModelStatus] = useState(getLlamaStatus());

  const handleResetModel = async () => {
    Alert.alert(
      'Reset Model',
      'This will delete the local AI model and force it to re-download on next use. Use this if the model is corrupted or stuck.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await resetModel();
              setModelStatus(getLlamaStatus());
              Alert.alert('Success', 'Model deleted. Restart the app or try recording to re-download.');
            } catch (e) {
              Alert.alert('Error', String(e));
            }
          }
        }
      ]
    );
  };

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    setBenchmarkResults(null);
    try {
      const results = await runBenchmark((current, total) => {
        setProgress({ current, total });
      });
      setBenchmarkResults(results);
    } catch (error) {
      Alert.alert('Benchmark Failed', String(error));
    } finally {
      setIsBenchmarking(false);
    }
  };

  const getAverageTime = (results: BenchmarkResult[]) => {
    const total = results.reduce((acc, r) => acc + r.durationMs, 0);
    return (total / results.length).toFixed(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
      {/* Developer Tools (hidden for production) */}
      {false && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Tools</Text>
          <View style={styles.card}>
            <Text style={styles.featureTitle}>Model Efficiency Test</Text>
            <Text style={styles.featureDescription}>
              Run a test suite to evaluate the speed and accuracy of the local Llama model.
            </Text>
            
            <TouchableOpacity 
              style={[styles.benchmarkButton, isBenchmarking && styles.benchmarkButtonDisabled]} 
              onPress={handleRunBenchmark}
              disabled={isBenchmarking}
            >
              {isBenchmarking ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.benchmarkButtonText}>
                    Testing {progress.current}/{progress.total}...
                  </Text>
                </View>
              ) : (
                <Text style={styles.benchmarkButtonText}>Run Benchmark</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />
            
            <Text style={styles.featureTitle}>Model Management</Text>
            <Text style={styles.featureDescription}>
              Status: {modelStatus.isReady ? 'Ready' : modelStatus.isInitializing ? 'Initializing...' : 'Not Ready'}
            </Text>
            {modelStatus.error && (
              <Text style={styles.resultError}>Error: {modelStatus.error}</Text>
            )}
            
            <TouchableOpacity 
              style={[styles.benchmarkButton, { backgroundColor: colors.error, marginTop: 8 }]} 
              onPress={handleResetModel}
            >
              <Text style={styles.benchmarkButtonText}>Reset Model Cache</Text>
            </TouchableOpacity>

            {benchmarkResults && (
              <View style={styles.resultsContainer}>
                <View style={styles.resultSummary}>
                  <Text style={styles.resultLabel}>Avg Time:</Text>
                  <Text style={styles.resultValue}>{getAverageTime(benchmarkResults)}ms</Text>
                </View>
                <View style={styles.resultSummary}>
                  <Text style={styles.resultLabel}>Success Rate:</Text>
                  <Text style={styles.resultValue}>
                    {benchmarkResults.filter(r => r.success).length}/{benchmarkResults.length}
                  </Text>
                </View>
                
                <View style={styles.divider} />
                
                {benchmarkResults.map((result, index) => (
                  <View key={index} style={styles.resultItem}>
                    <View style={styles.resultHeader}>
                      <Text style={[styles.statusIcon, { color: result.success ? colors.success : colors.error }]}>
                        {result.success ? '✓' : '✗'}
                      </Text>
                      <Text style={styles.resultId}>{result.testId}</Text>
                      <Text style={styles.resultTime}>{result.durationMs.toFixed(0)}ms</Text>
                    </View>
                    <Text style={styles.resultInput} numberOfLines={1}>{result.input}</Text>
                    {!result.success && result.error && (
                      <Text style={styles.resultError}>{result.error}</Text>
                    )}
                    {!result.success && !result.error && (
                       <Text style={styles.resultError}>
                         Expected: {JSON.stringify(result.extractedTypes)}
                       </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

        {/* How It Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.card}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎤</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Voice Recording</Text>
                <Text style={styles.featureDescription}>
                  Tap the mic button and speak naturally
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📱</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>On-Device Speech</Text>
                <Text style={styles.featureDescription}>
                  Apple's speech recognition - fast, private, free
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🧠</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Smart Extraction</Text>
                <Text style={styles.featureDescription}>
                  Automatically categorizes your notes locally
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💾</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Local Storage</Text>
                <Text style={styles.featureDescription}>
                  All data stays on your device
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Supported Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Commands</Text>
          
          <View style={styles.card}>
            <Text style={styles.tipText}>Try saying things like:</Text>
            
            <View style={styles.exampleList}>
              <Text style={styles.example}>• "Remind me to call mom tomorrow"</Text>
              <Text style={styles.example}>• "Buy milk and eggs"</Text>
              <Text style={styles.example}>• "Meeting with John on Friday"</Text>
              <Text style={styles.example}>• "I need to finish the report"</Text>
              <Text style={styles.example}>• "New idea for the project"</Text>
              <Text style={styles.example}>• "Feeling great today"</Text>
            </View>
          </View>
        </View>
        
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.card}>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>2.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Speech Recognition</Text>
              <Text style={styles.aboutValue}>On-Device (Apple)</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Entity Extraction</Text>
              <Text style={styles.aboutValue}>Local (Free)</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Data Storage</Text>
              <Text style={styles.aboutValue}>On-Device Only</Text>
            </View>
          </View>
        </View>
        
        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.card}>
            <View style={styles.privacyBadge}>
              <Text style={styles.privacyIcon}>🔒</Text>
              <Text style={styles.privacyTitle}>100% Private</Text>
            </View>
            <Text style={styles.privacyText}>
              All processing happens on your device. Your voice recordings and notes 
              never leave your phone. No accounts, no cloud, no tracking.
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
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: spacing.md,
    width: 40,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  tipText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  exampleList: {
    gap: spacing.sm,
  },
  example: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * 1.5,
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
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  privacyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.success,
  },
  privacyText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: typography.sizes.md * 1.6,
  },
  benchmarkButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  benchmarkButtonDisabled: {
    opacity: 0.7,
  },
  benchmarkButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: typography.sizes.md,
  },
  resultsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  resultLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  resultValue: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: typography.sizes.sm,
  },
  resultItem: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: 'bold',
  },
  resultId: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  resultTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resultInput: {
    fontSize: 12,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  resultError: {
    fontSize: 10,
    color: colors.error,
    marginTop: 4,
  },
});
