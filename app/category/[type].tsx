import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SectionList,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { EntityCard } from '../../components/EntityCard';
import { colors, spacing, typography, entityColors, entityIcons, entityLabels } from '../../constants/theme';
import { Entity, EntityType } from '../../types';
import { format, parseISO, isValid, isToday, isTomorrow } from 'date-fns';

export default function CategoryScreen() {
  const { type } = useLocalSearchParams<{ type: EntityType }>();
  const { getEntitiesOfType, completeEntity, removeEntity, openVoiceNote } = useApp();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadEntities() {
      if (type) {
        const items = await getEntitiesOfType(type);
        setEntities(items.filter(e => e.status === 'active'));
        setLoading(false);
      }
    }
    loadEntities();
  }, [type, getEntitiesOfType]);
  
  const handleComplete = async (id: string) => {
    await completeEntity(id);
    setEntities(prev => prev.filter(e => e.id !== id));
  };
  
  const handleDelete = async (id: string) => {
    await removeEntity(id);
    setEntities(prev => prev.filter(e => e.id !== id));
  };
  
  const icon = type ? entityIcons[type] : '📌';
  const label = type ? entityLabels[type] : 'Items';
  const color = type ? entityColors[type] : colors.accent;
  
  const renderItem = ({ item }: { item: Entity }) => (
    <EntityCard
      entity={item}
      onComplete={() => handleComplete(item.id)}
      onDelete={() => handleDelete(item.id)}
      onViewSource={openVoiceNote}
    />
  );

  // Grouped sections for Events
  const sections = useMemo(() => {
    if (type !== 'event') return [];

    const groups: Record<string, Entity[]> = {};
    
    entities.forEach(item => {
      let dateKey = 'Undated';
      if ('eventDate' in item && item.eventDate) {
        dateKey = item.eventDate;
      }
      
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });

    return Object.keys(groups)
      .sort((a, b) => {
        if (a === 'Undated') return 1;
        if (b === 'Undated') return -1;
        return a.localeCompare(b);
      })
      .map(dateKey => ({
        title: dateKey,
        data: groups[dateKey]
      }));
  }, [entities, type]);

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => {
    let displayTitle = title;
    if (title !== 'Undated') {
      try {
        const date = parseISO(title);
        if (isValid(date)) {
          if (isToday(date)) displayTitle = 'Today';
          else if (isTomorrow(date)) displayTitle = 'Tomorrow';
          else displayTitle = format(date, 'EEEE, MMM d');
        }
      } catch (e) {}
    }

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{displayTitle}</Text>
      </View>
    );
  };
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `${icon} ${label}`,
          headerStyle: {
            backgroundColor: colors.background,
          },
        }} 
      />
      <SafeAreaView style={styles.container}>
        {/* Header Stats */}
        <View style={[styles.statsCard, { borderLeftColor: color }]}>
          <Text style={styles.statsNumber}>{entities.length}</Text>
          <Text style={styles.statsLabel}>Active {label}s</Text>
        </View>
        
        {/* Items List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : type === 'event' && sections.length > 0 ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        ) : (
          <FlatList
            data={entities}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>{icon}</Text>
                <Text style={styles.emptyText}>No {label.toLowerCase()}s yet</Text>
                <Text style={styles.emptySubtext}>
                  Record a voice note to add {label.toLowerCase()}s
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsCard: {
    backgroundColor: colors.backgroundCard,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statsLabel: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
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
    paddingHorizontal: spacing.xl,
  },
});

