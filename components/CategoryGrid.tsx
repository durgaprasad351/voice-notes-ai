import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { EntityType } from '../types';
import { colors, spacing, typography, borderRadius, entityColors, entityIcons, entityLabels } from '../constants/theme';

interface CategoryGridProps {
  counts?: Record<EntityType, number>;
}

const CATEGORIES: EntityType[] = [
  'todo',
  'reminder',
  'event',
  'note',
  'idea',
  'shopping',
  'journal',
  'person',
];

export function CategoryGrid({ counts = {} as Record<EntityType, number> }: CategoryGridProps) {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categories</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((type) => (
          <TouchableOpacity
            key={type}
            style={styles.card}
            onPress={() => router.push(`/category/${type}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: entityColors[type] + '20' }]}>
              <Text style={styles.icon}>{entityIcons[type]}</Text>
            </View>
            <Text style={styles.label}>{entityLabels[type]}</Text>
            <Text style={styles.count}>{counts[type] || 0}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});

