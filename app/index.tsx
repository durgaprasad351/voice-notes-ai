import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { RecordButton } from '../components/RecordButton';
import { UpcomingSection } from '../components/UpcomingSection';
import { CategoryGrid } from '../components/CategoryGrid';
import { ProcessingResult } from '../components/ProcessingResult';
import { colors, spacing, typography } from '../constants/theme';
import { EntityType } from '../types';

export default function HomeScreen() {
  const router = useRouter();
  const { 
    isInitialized,
    isRecording,
    isProcessing,
    entities,
    upcomingItems,
    lastTranscript,
    lastExtraction,
    error,
    liveTranscript,
    handleStartRecording,
    handleStopRecording,
    completeEntity,
    clearError,
  } = useApp();
  
  const [showResult, setShowResult] = useState(false);
  
  // Show result when processing completes
  useEffect(() => {
    if (lastExtraction && !isProcessing) {
      setShowResult(true);
    }
  }, [lastExtraction, isProcessing]);
  
  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);
  
  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<EntityType, number> = {
      note: 0,
      journal: 0,
      todo: 0,
      reminder: 0,
      event: 0,
      shopping: 0,
      person: 0,
      idea: 0,
    };
    
    entities.forEach(entity => {
      if (entity.status === 'active') {
        counts[entity.type]++;
      }
    });
    
    return counts;
  }, [entities]);
  
  // Handle record button press
  const handleRecordPress = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };
  
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>VoiceNotes</Text>
          <Text style={styles.subtitle}>Capture your thoughts</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Section */}
        <UpcomingSection 
          items={upcomingItems}
          onComplete={completeEntity}
        />
        
        {/* Category Grid */}
        <CategoryGrid counts={categoryCounts} />
      </ScrollView>
      
      {/* Record Button - Fixed at bottom */}
      <View style={styles.recordContainer}>
        <RecordButton
          isRecording={isRecording}
          isProcessing={isProcessing}
          onPress={handleRecordPress}
          liveTranscript={liveTranscript}
        />
      </View>
      
      {/* Processing Result Modal */}
      <Modal
        visible={showResult && !!lastExtraction}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResult(false)}
      >
        <View style={styles.resultOverlay}>
          {lastTranscript && lastExtraction && (
            <ProcessingResult
              transcript={lastTranscript}
              extraction={lastExtraction}
              onDismiss={() => setShowResult(false)}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: typography.sizes.xxxl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: 200, // Space for record button
  },
  recordContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.background,
    // Gradient fade effect
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
});
