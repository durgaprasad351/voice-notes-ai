import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LLMExtractionResult } from '../types';
import { colors, spacing, typography, borderRadius, entityColors, entityIcons } from '../constants/theme';

interface ProcessingResultProps {
  transcript: string;
  extraction: LLMExtractionResult;
  onDismiss: () => void;
}

export function ProcessingResult({ transcript, extraction, onDismiss }: ProcessingResultProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Captured!</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.dismissButton}>Done</Text>
        </TouchableOpacity>
      </View>
      
      {/* Transcript */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transcript</Text>
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptText}>"{transcript}"</Text>
        </View>
      </View>
      
      {/* Extracted Items */}
      {extraction.entities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Extracted ({extraction.entities.length} items)
          </Text>
          <ScrollView style={styles.entitiesList} nestedScrollEnabled>
            {extraction.entities.map((entity, index) => (
              <View 
                key={index} 
                style={[
                  styles.entityItem,
                  { borderLeftColor: entityColors[entity.type] || colors.accent }
                ]}
              >
                <Text style={styles.entityIcon}>{entityIcons[entity.type]}</Text>
                <View style={styles.entityContent}>
                  <Text style={styles.entityType}>
                    {entity.type.toUpperCase()}
                  </Text>
                  <Text style={styles.entityText}>{entity.content}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Completions */}
      {extraction.completions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Marked Complete ({extraction.completions.length})
          </Text>
          {extraction.completions.map((completion, index) => (
            <View key={index} style={styles.completionItem}>
              <Text style={styles.completionIcon}>✓</Text>
              <Text style={styles.completionText}>{completion.reason}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Summary */}
      {extraction.summary && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>{extraction.summary}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    margin: spacing.md,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dismissButton: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.accent,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  transcriptBox: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  transcriptText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  entitiesList: {
    maxHeight: 200,
  },
  entityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
  },
  entityIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  entityContent: {
    flex: 1,
  },
  entityType: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  entityText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  completionIcon: {
    fontSize: 16,
    color: colors.success,
    marginRight: spacing.sm,
    fontWeight: '700',
  },
  completionText: {
    fontSize: typography.sizes.md,
    color: colors.success,
    flex: 1,
  },
  summaryBox: {
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  summaryText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
});

