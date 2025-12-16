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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { RecordButton } from '../components/RecordButton';
import { CalendarStrip } from '../components/CalendarStrip';
import { TimelineView } from '../components/TimelineView';
import { CategoryGrid } from '../components/CategoryGrid';
import { ProcessingResult } from '../components/ProcessingResult';
import { ModelDownloadModal } from '../components/ModelDownloadModal';
import { colors, spacing, typography } from '../constants/theme';
import { EntityType } from '../types';
import { isSameDay, parseISO, isValid, format } from 'date-fns';

export default function HomeScreen() {
  const router = useRouter();
  const { 
    isInitialized,
    isRecording,
    isProcessing,
    entities,
    lastTranscript,
    lastExtraction,
    error,
    liveTranscript,
    llmReady,
    llmDownloadProgress,
    handleStartRecording,
    handleStopRecording,
    processTextInput,
    completeEntity,
    removeEntity,
    openVoiceNote,
    clearError,
  } = useApp();
  
  const [showResult, setShowResult] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Get all dates with events/todos/reminders
  const markedDates = useMemo(() => {
    const dates = new Set<string>();
    
    entities.forEach(item => {
      if (item.status !== 'active') return;
      
      let dateStr: string | undefined;
      
      if (item.type === 'todo' && 'dueDate' in item) {
        dateStr = item.dueDate;
      } else if (item.type === 'reminder' && 'reminderTime' in item) {
        // Handle ISO string or simple date
        dateStr = item.reminderTime.includes('T') ? item.reminderTime.split('T')[0] : item.reminderTime;
      } else if (item.type === 'event' && 'eventDate' in item) {
        dateStr = item.eventDate;
      }
      
      if (dateStr && dateStr.length >= 10) {
        // Ensure strictly YYYY-MM-DD
        dates.add(dateStr.substring(0, 10));
      }
    });
    
    return Array.from(dates);
  }, [entities]);
  
  // Filter entities for selected date
  const timelineItems = useMemo(() => {
    return entities.filter(item => {
      // 1. Must be active
      if (item.status !== 'active') return false;

      // 2. Check date match
      let dateStr: string | undefined;
      
      if (item.type === 'todo' && 'dueDate' in item) {
        dateStr = item.dueDate;
      } else if (item.type === 'reminder' && 'reminderTime' in item) {
        dateStr = item.reminderTime;
      } else if (item.type === 'event' && 'eventDate' in item) {
        dateStr = item.eventDate;
      }
      
      if (dateStr) {
        try {
          let date: Date;
          if (dateStr.length === 10 && dateStr.includes('-')) {
            const [y, m, d] = dateStr.split('-').map(Number);
            date = new Date(y, m - 1, d);
          } else {
            date = parseISO(dateStr);
          }
          
          if (isValid(date)) {
            return isSameDay(date, selectedDate);
          }
        } catch (e) {}
      }
      
      // If no date, do not show in timeline (user can find them in categories)
      if (!dateStr) {
        return false;
      }
      
      return false;
    });
  }, [entities, selectedDate]);

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

  // Handle manual text submission
  const handleTextSubmit = async () => {
    if (manualText.trim()) {
      await processTextInput(manualText);
      setManualText('');
      setShowTextInput(false);
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
          <Text style={styles.greeting}>NoteOnGo AI</Text>
          <Text style={styles.subtitle}>{format(new Date(), 'EEEE, MMMM d').toUpperCase()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.settingsIcon}>•••</Text>
        </TouchableOpacity>
      </View>
      
      <CalendarStrip 
        selectedDate={selectedDate} 
        onSelectDate={setSelectedDate}
        markedDates={markedDates}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TimelineView 
          items={timelineItems}
          onComplete={completeEntity}
          onDelete={removeEntity}
          onViewSource={openVoiceNote}
        />
        
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
        {/* Manual text input button */}
        <TouchableOpacity 
          style={styles.textInputButton}
          onPress={() => setShowTextInput(true)}
        >
          <Text style={styles.textInputButtonText}>✏️ Type instead</Text>
        </TouchableOpacity>
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

      {/* Manual Text Input Modal */}
      <Modal
        visible={showTextInput}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTextInput(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.textInputOverlay}
        >
          <View style={styles.textInputModal}>
            <View style={styles.textInputHeader}>
              <Text style={styles.textInputTitle}>Type your note</Text>
              <TouchableOpacity onPress={() => setShowTextInput(false)}>
                <Text style={styles.textInputClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="E.g., Remind me to call mom tomorrow at 3pm"
              placeholderTextColor={colors.textSecondary}
              value={manualText}
              onChangeText={setManualText}
              multiline
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.submitButton, !manualText.trim() && styles.submitButtonDisabled]}
              onPress={handleTextSubmit}
              disabled={!manualText.trim() || isProcessing}
            >
              <Text style={styles.submitButtonText}>
                {isProcessing ? 'Processing...' : 'Save Note'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Model Download Modal */}
      <ModelDownloadModal 
        visible={!llmReady && llmDownloadProgress < 1 && isInitialized}
        progress={llmDownloadProgress}
      />
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
    paddingBottom: spacing.sm,
  },
  greeting: {
    fontSize: typography.sizes.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    letterSpacing: 1.5, // Wide spacing for date
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 6, // Visually center the dots
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 200, // Space for record button
  },
  categoryHeader: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
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
  textInputButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  textInputButtonText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  textInputOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  textInputModal: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  textInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  textInputTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  textInputClose: {
    fontSize: 24,
    color: colors.textSecondary,
    padding: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
});
