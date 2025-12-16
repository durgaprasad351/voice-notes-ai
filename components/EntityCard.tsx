import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import { Entity } from '../types';
import { colors, spacing, typography, borderRadius, entityColors, entityBgColors, entityIcons, shadows } from '../constants/theme';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

interface EntityCardProps {
  entity: Entity;
  onPress?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onViewSource?: (voiceNoteId: string) => void;
  compact?: boolean;
}

export function EntityCard({ 
  entity, 
  onPress, 
  onComplete, 
  onDelete,
  onViewSource,
  compact = false 
}: EntityCardProps) {
  const typeColor = entityColors?.[entity.type] || colors.accent;
  const bgColor = entityBgColors?.[entity.type] || colors.backgroundCard;
  const typeIcon = entityIcons?.[entity.type] || '📌';
  
  const handleDelete = () => {
    if (!onDelete) return;
    
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete this ${entity.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: onDelete
        }
      ]
    );
  };
  
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
      let date: Date;
      // Fix for timezone issues with date-only strings (YYYY-MM-DD)
      // parseISO treats them as UTC, which can shift to previous day in Western timezones
      if (dateStr.length === 10 && dateStr.includes('-')) {
        const [y, m, d] = dateStr.split('-').map(Number);
        date = new Date(y, m - 1, d);
      } else {
        date = parseISO(dateStr);
      }

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
        style={[styles.compactContainer, { backgroundColor: bgColor }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.compactIcon}>{typeIcon}</Text>
        <Text style={styles.compactContent} numberOfLines={1}>
          {entity.content}
        </Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: bgColor },
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        {/* Header: Icon, Type, Date */}
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
              <Text style={styles.typeIcon}>{typeIcon}</Text>
            </View>
            <Text style={[styles.typeLabel, { color: typeColor }]}>
              {entity.type.toUpperCase()}
            </Text>
          </View>
          
          {dateDisplay && (
            <Text style={[
              styles.dateText,
              dateDisplay.isOverdue && styles.overdueText
            ]}>
              {dateDisplay.isOverdue ? '⚠️ ' : ''}
              {dateDisplay.text}
            </Text>
          )}
        </View>
        
        {/* Main content */}
        <Text style={styles.mainContent} numberOfLines={3}>
          {entity.content}
        </Text>
        
        {/* Footer Actions */}
        <View style={styles.footer}>
          <View style={styles.leftActions}>
             {entity.voiceNoteId && onViewSource && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onViewSource(entity.voiceNoteId!)}
              >
                <Text style={styles.actionIcon}>🎙️</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rightActions}>
            {onDelete && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.deleteIcon}>×</Text>
              </TouchableOpacity>
            )}
            
            {entity.status === 'active' && (entity.type === 'todo' || entity.type === 'shopping') && onComplete && (
              <TouchableOpacity 
                style={[styles.completeButton, { borderColor: typeColor }]}
                onPress={onComplete}
              >
                <View style={[styles.completeCheck, { backgroundColor: typeColor }]} />
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
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  compactIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  compactContent: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  
  // Full card styles
  container: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  content: {
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
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  typeIcon: {
    fontSize: 14,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  mainContent: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 32,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  overdueText: {
    color: colors.error,
  },
  leftActions: {
    flexDirection: 'row',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 14,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 59, 48, 0.12)', // Soft red background
    borderWidth: 1.5,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 20,
    fontWeight: '400',
    color: '#FF3B30', // iOS red
    lineHeight: 20,
  },
  completeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  completeCheck: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
    opacity: 0.2, // Subtle indication
  },
});

