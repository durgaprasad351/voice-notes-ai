import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface ModelDownloadModalProps {
  visible: boolean;
  progress: number;
  error?: string | null;
}

export function ModelDownloadModal({ visible, progress, error }: ModelDownloadModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🧠</Text>
          </View>
          
          <Text style={styles.title}>Setting Up AI</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to download model</Text>
              <Text style={styles.errorSubtext}>{error}</Text>
              <Text style={styles.errorHelp}>Please restart the app to try again.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.description}>
                Downloading the AI model to your device. This happens only once.
              </Text>
              
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
              </View>
              
              <View style={styles.statsRow}>
                <Text style={styles.percentage}>{(progress * 100).toFixed(0)}%</Text>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
              
              <Text style={styles.subtext}>
                Please keep the app open (~400 MB)
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xs,
  },
  percentage: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  subtext: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    opacity: 0.7,
    marginTop: spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorSubtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorHelp: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
  }
});

