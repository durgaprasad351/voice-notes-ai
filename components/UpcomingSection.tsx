import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Entity } from '../types';
import { EntityCard } from './EntityCard';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { useRouter } from 'expo-router';

interface UpcomingSectionProps {
  items: Entity[];
  onComplete: (id: string) => void;
}

export function UpcomingSection({ items, onComplete }: UpcomingSectionProps) {
  const router = useRouter();
  
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>✨</Text>
        <Text style={styles.emptyText}>All caught up!</Text>
        <Text style={styles.emptySubtext}>No upcoming tasks or reminders</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coming Up</Text>
        <TouchableOpacity onPress={() => router.push('/all')}>
          <Text style={styles.viewAll}>View All →</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.slice(0, 5).map((item) => (
          <View key={item.id} style={styles.cardWrapper}>
            <EntityCard 
              entity={item} 
              onComplete={() => onComplete(item.id)}
              compact
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAll: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  cardWrapper: {
    width: 280,
    marginRight: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
});

