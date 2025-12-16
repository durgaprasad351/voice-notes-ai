import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { EntityCard } from '../components/EntityCard';
import { colors, spacing, typography, borderRadius, entityColors, entityIcons } from '../constants/theme';
import { Entity, EntityType } from '../types';

const FILTER_OPTIONS: Array<{ key: EntityType | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: '✅ Todo' },
  { key: 'reminder', label: '⏰ Reminder' },
  { key: 'event', label: '📅 Event' },
  { key: 'note', label: '📝 Note' },
  { key: 'idea', label: '💡 Idea' },
  { key: 'shopping', label: '🛒 Shopping' },
  { key: 'journal', label: '📔 Journal' },
  { key: 'person', label: '👤 Person' },
];

export default function AllItemsScreen() {
  const { entities, completeEntity, removeEntity, openVoiceNote } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<EntityType | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  
  const filteredEntities = useMemo(() => {
    let filtered = entities;
    
    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(e => e.type === selectedFilter);
    }
    
    // Filter by status
    if (!showCompleted) {
      filtered = filtered.filter(e => e.status === 'active');
    }
    
    return filtered;
  }, [entities, selectedFilter, showCompleted]);
  
  const renderItem = ({ item }: { item: Entity }) => (
    <EntityCard
      entity={item}
      onComplete={() => completeEntity(item.id)}
      onDelete={() => removeEntity(item.id)}
      onViewSource={openVoiceNote}
    />
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterPill,
                selectedFilter === item.key && styles.filterPillActive,
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Text style={[
                styles.filterPillText,
                selectedFilter === item.key && styles.filterPillTextActive,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      
      {/* Show Completed Toggle */}
      <TouchableOpacity 
        style={styles.toggleContainer}
        onPress={() => setShowCompleted(!showCompleted)}
      >
        <View style={[styles.checkbox, showCompleted && styles.checkboxChecked]}>
          {showCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.toggleText}>Show completed</Text>
      </TouchableOpacity>
      
      {/* Items List */}
      <FlatList
        data={filteredEntities}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>
              Try changing the filter or record a voice note
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundCard,
    marginRight: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.accent,
  },
  filterPillText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.textPrimary,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

