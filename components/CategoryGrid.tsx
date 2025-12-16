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
            <View style={[styles.iconContainer, { backgroundColor: (entityColors[type] || colors.accent) + '20' }]}>
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
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  card: {
    width: '23%',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 32,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});

