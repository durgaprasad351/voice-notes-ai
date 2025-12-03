import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
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
});
