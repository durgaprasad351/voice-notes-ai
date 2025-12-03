import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Entity } from '../types';
import { colors, spacing, typography, borderRadius, entityColors, entityIcons } from '../constants/theme';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

interface EntityCardProps {
  entity: Entity;
  onPress?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function EntityCard({ 
  entity, 
  onPress, 
  onComplete, 
  onDelete,
  compact = false 
}: EntityCardProps) {
  const typeColor = entityColors[entity.type] || colors.accent;
  const typeIcon = entityIcons[entity.type] || '📌';
  
  // Get due date display
  const getDueDateDisplay = (): { text: string; isOverdue: boolean } | null => {
    let dateStr: string | undefined;
    
    if (entity.type === 'todo' && 'dueDate' in entity) {
      dateStr = entity.dueDate;
    } else if (entity.type === 'reminder' && 'reminderTime' in entity) {
      dateStr = entity.reminderTime;
    } else if (entity.type === 'event' && 'eventDate' in entity) {
      dateStr = entity.eventDate;
    }
    
    if (!dateStr) return null;
    
    try {
      const date = parseISO(dateStr);
      const isOverdue = isPast(date) && entity.status === 'active';
      
      let text: string;
      if (isToday(date)) {
        text = 'Today';
      } else if (isTomorrow(date)) {
        text = 'Tomorrow';
      } else {
        text = format(date, 'MMM d');
      }
      
      // Add time if available
      if (entity.type === 'reminder' || (entity.type === 'event' && 'eventTime' in entity)) {
        const timeStr = entity.type === 'event' && 'eventTime' in entity 
          ? entity.eventTime 
          : format(date, 'h:mm a');
        if (timeStr) {
          text += ` • ${entity.type === 'reminder' ? format(date, 'h:mm a') : timeStr}`;
        }
      }
      
      return { text, isOverdue };
    } catch {
      return null;
    }
  };
  
  const dateDisplay = getDueDateDisplay();
  
  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.compactTypeIndicator, { backgroundColor: typeColor }]} />
        <Text style={styles.compactIcon}>{typeIcon}</Text>
        <Text style={styles.compactContent} numberOfLines={1}>
          {entity.content}
        </Text>
        {dateDisplay && (
          <Text style={[
            styles.compactDate,
            dateDisplay.isOverdue && styles.overdueText
          ]}>
            {dateDisplay.text}
          </Text>
        )}
      </TouchableOpacity>
    );
  }
  
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
    >
      {/* Type indicator bar */}
      <View style={[styles.typeBar, { backgroundColor: typeColor }]} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeIcon}>{typeIcon}</Text>
            <Text style={[styles.typeLabel, { color: typeColor }]}>
              {entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}
            </Text>
          </View>
          
          {entity.type === 'todo' && 'priority' in entity && entity.priority && (
            <View style={[
              styles.priorityBadge,
              entity.priority === 'high' && styles.priorityHigh,
              entity.priority === 'medium' && styles.priorityMedium,
              entity.priority === 'low' && styles.priorityLow,
            ]}>
              <Text style={styles.priorityText}>
                {entity.priority.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        {/* Main content */}
        <Text style={styles.mainContent} numberOfLines={3}>
          {entity.content}
        </Text>
        
        {/* Footer */}
        <View style={styles.footer}>
          {dateDisplay && (
            <Text style={[
              styles.dateText,
              dateDisplay.isOverdue && styles.overdueText
            ]}>
              {dateDisplay.isOverdue ? '⚠️ ' : ''}
              {dateDisplay.text}
            </Text>
          )}
          
          <View style={styles.actions}>
            {entity.status === 'active' && (entity.type === 'todo' || entity.type === 'shopping') && onComplete && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={onComplete}
              >
                <Text style={styles.actionButtonText}>✓ Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  compactTypeIndicator: {
    width: 3,
    height: 24,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  compactContent: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  compactDate: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  
  // Full card styles
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  containerPressed: {
    backgroundColor: colors.backgroundCardHover,
  },
  typeBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  typeLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSecondary,
  },
  priorityHigh: {
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
  },
  priorityMedium: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  priorityLow: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
  },
  priorityText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  mainContent: {
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    lineHeight: typography.sizes.lg * typography.lineHeights.normal,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  dateText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  overdueText: {
    color: colors.error,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
  },
  actionButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.background,
    fontWeight: '600',
  },
});

