import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { EntityCard } from '../../components/EntityCard';
import { colors, spacing, typography, entityColors, entityIcons, entityLabels } from '../../constants/theme';
import { Entity, EntityType } from '../../types';

export default function CategoryScreen() {
  const { type } = useLocalSearchParams<{ type: EntityType }>();
  const { getEntitiesOfType, completeEntity, removeEntity } = useApp();
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
  
  const icon = type ? entityIcons[type] : '📌';
  const label = type ? entityLabels[type] : 'Items';
  const color = type ? entityColors[type] : colors.accent;
  
  const renderItem = ({ item }: { item: Entity }) => (
    <EntityCard
      entity={item}
      onComplete={() => handleComplete(item.id)}
      onDelete={() => removeEntity(item.id)}
    />
  );
  
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

