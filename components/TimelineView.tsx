import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Entity, EntityType } from '../types';
import { EntityCard } from './EntityCard';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { parseISO, getHours, isValid } from 'date-fns';

interface TimelineViewProps {
  items: Entity[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onViewSource: (id: string) => void;
}

type TimeSection = 'anytime' | 'morning' | 'afternoon' | 'evening';

const SECTIONS: { id: TimeSection; label: string; icon: string }[] = [
  { id: 'anytime', label: 'Anytime', icon: '🕒' },
  { id: 'morning', label: 'Morning', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { id: 'evening', label: 'Evening', icon: '🌙' },
];

export function TimelineView({ items, onComplete, onDelete, onViewSource }: TimelineViewProps) {
  
  // Group items by section
  const groupedItems = React.useMemo(() => {
    const groups: Record<TimeSection, Entity[]> = {
      anytime: [],
      morning: [],
      afternoon: [],
      evening: [],
    };

    items.forEach(item => {
      let timeStr: string | undefined;

      // Check if item has a specific time
      if (item.type === 'event' && 'eventTime' in item) {
        timeStr = item.eventTime; // e.g. "14:30"
      } else if (item.type === 'reminder' && 'reminderTime' in item) {
        // reminderTime is typically ISO string
        try {
            const date = parseISO(item.reminderTime);
            if (isValid(date)) {
                // Determine section based on hour
                const hour = getHours(date);
                if (hour < 12) groups.morning.push(item);
                else if (hour < 17) groups.afternoon.push(item);
                else groups.evening.push(item);
                return;
            }
        } catch (e) {}
      }

      // If we extracted a raw time string like "14:30" manually (from eventTime)
      if (timeStr) {
        const hour = parseInt(timeStr.split(':')[0], 10);
        if (!isNaN(hour)) {
             if (hour < 12) groups.morning.push(item);
             else if (hour < 17) groups.afternoon.push(item);
             else groups.evening.push(item);
             return;
        }
      }

      // Default to Anytime
      groups.anytime.push(item);
    });

    return groups;
  }, [items]);

  // If absolutely no items
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>✨</Text>
        <Text style={styles.emptyText}>No plans for this day</Text>
        <Text style={styles.emptySubtext}>Enjoy your free time!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {SECTIONS.map(section => {
        const sectionItems = groupedItems[section.id];
        if (sectionItems.length === 0) return null;

        return (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
               <View style={styles.sectionLabelContainer}>
                 <Text style={styles.sectionIcon}>{section.icon}</Text>
                 <Text style={styles.sectionTitle}>{section.label}</Text>
                 <Text style={styles.countBadge}>({sectionItems.length})</Text>
               </View>
            </View>

            <View style={styles.list}>
              {sectionItems.map(item => (
                <View key={item.id} style={styles.itemWrapper}>
                    {/* Time indicator line */}
                    <View style={styles.timelineLeft}>
                        <View style={styles.line} />
                        <View style={styles.dot} />
                    </View>
                    <View style={styles.cardContainer}>
                        <EntityCard
                            entity={item}
                            onComplete={() => onComplete(item.id)}
                            onDelete={() => onDelete(item.id)}
                            onViewSource={onViewSource}
                        />
                    </View>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptySubtext: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionIcon: {
    marginRight: spacing.xs,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countBadge: {
    marginLeft: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  itemWrapper: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 20,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderLight,
    borderRadius: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    position: 'absolute',
    top: 28, // Align with card center/top
  },
  cardContainer: {
    flex: 1,
    maxWidth: '88%', // reduce card width so it doesn't span full row
    alignSelf: 'flex-start',
  }
});

