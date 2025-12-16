import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Entity, EntityType, LLMExtractionResult } from '../types';
import { 
  initDatabase, 
  getActiveEntities, 
  getUpcomingItems, 
  createEntity, 
  markEntityComplete,
  getEntitiesByType,
  deleteEntity,
  createVoiceNote,
} from '../services/database';
import { setupAudio, startRecording, stopRecording, generateEntityId, generateRecordingId } from '../services/audio';
import { fallbackExtraction } from '../services/localLLM';
import { initializeLlama, extractEntitiesWithLlama } from '../services/llamaService';

interface AppContextType {
  // State
  isInitialized: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  entities: Entity[];
  upcomingItems: Entity[];
  lastTranscript: string | null;
  lastExtraction: LLMExtractionResult | null;
  error: string | null;
  liveTranscript: string;
  llmReady: boolean;
  llmDownloadProgress: number;
  activeVoiceNoteId: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  handleStartRecording: () => Promise<void>;
  handleStopRecording: () => Promise<void>;
  processTextInput: (text: string) => Promise<void>;
  completeEntity: (id: string) => Promise<void>;
  removeEntity: (id: string) => Promise<void>;
  getEntitiesOfType: (type: EntityType) => Promise<Entity[]>;
  clearError: () => void;
  openVoiceNote: (id: string) => void;
  closeVoiceNote: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<Entity[]>([]);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [lastExtraction, setLastExtraction] = useState<LLMExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [llmReady, setLlmReady] = useState(false);
  const [llmDownloadProgress, setLlmDownloadProgress] = useState(0);
  const [activeVoiceNoteId, setActiveVoiceNoteId] = useState<string | null>(null);
  
  // Voice Note Modal Actions
  const openVoiceNote = useCallback((id: string) => {
    setActiveVoiceNoteId(id);
  }, []);

  const closeVoiceNote = useCallback(() => {
    setActiveVoiceNoteId(null);
  }, []);

  // Initialize app
  useEffect(() => {
    async function init() {
      try {
        // Initialize database
        await initDatabase();
        
        // Setup audio permissions
        await setupAudio();
        
        // Load initial data
        const [allEntities, upcoming] = await Promise.all([
          getActiveEntities(),
          getUpcomingItems(),
        ]);
        
        setEntities(allEntities);
        setUpcomingItems(upcoming);
        setIsInitialized(true);

        // Initialize Llama in background
        initializeLlama((progress) => {
          setLlmDownloadProgress(progress);
        }).then((ready) => {
          setLlmReady(ready);
          console.log('Llama initialization complete:', ready);
        }).catch((err) => {
          console.log('Llama initialization failed (will use fallback):', err);
        });
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize app');
      }
    }
    
    init();
  }, []);
  
  // Refresh data from database
  const refreshData = useCallback(async () => {
    try {
      const [allEntities, upcoming] = await Promise.all([
        getActiveEntities(),
        getUpcomingItems(),
      ]);
      setEntities(allEntities);
      setUpcomingItems(upcoming);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  }, []);
  
  // Handle live transcript updates
  const handleTranscriptUpdate = useCallback((text: string) => {
    setLiveTranscript(text);
  }, []);
  
  // Start recording
  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);
      setLiveTranscript('');
      
      // Start recording with real-time transcription callback
      await startRecording(handleTranscriptUpdate);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
    }
  }, [handleTranscriptUpdate]);
  
  // Stop recording and process
  const handleStopRecording = useCallback(async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      setError(null);
      
      // Stop recording and get on-device transcript
      const result = await stopRecording();
      if (!result) {
        throw new Error('No recording to process');
      }
      
      // Use on-device transcript
      const transcript = result.onDeviceTranscript || '';
      
      if (!transcript || transcript.length < 3) {
        // Could be: permission denied, no speech detected, or simulator
        throw new Error(
          'No speech detected. Please check:\n' +
          '• Microphone & Speech Recognition permissions are granted in Settings\n' +
          '• You spoke clearly during recording\n' +
          '• Try recording for at least 2-3 seconds'
        );
      }
      
      console.log('Using on-device transcript:', transcript);
      
      // Try Llama first, then fallback
      let extraction;
      if (llmReady) {
        console.log('Using Llama for extraction...');
        const llamaResult = await extractEntitiesWithLlama(transcript);
        if (llamaResult && llamaResult.entities.length > 0) {
          console.log('Llama extraction successful:', llamaResult);
          extraction = {
            entities: llamaResult.entities.map(e => ({
              type: e.type as any,
              content: e.content,
              metadata: e.metadata,
            })),
            completions: [],
            summary: llamaResult.summary,
          };
        } else {
          console.log('Llama returned no entities, using fallback');
          extraction = fallbackExtraction(transcript);
        }
      } else {
        console.log('Llama not ready, using fallback');
        extraction = fallbackExtraction(transcript);
      }
      
      setLastTranscript(transcript);
      setLastExtraction(extraction);
      setLiveTranscript('');
      
      // 1. Save the Voice Note first
      const voiceNoteId = generateRecordingId();
      await createVoiceNote({
        id: voiceNoteId,
        transcript,
        audioUri: result.uri,
        createdAt: new Date().toISOString(),
        duration: result.duration,
      });

      // Save extracted entities to database
      const now = new Date().toISOString();
      for (const entity of extraction.entities) {
        const newEntity: Entity = {
          id: generateEntityId(),
          type: entity.type,
          content: entity.content,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          rawTranscript: transcript,
          voiceNoteId: voiceNoteId, // Link to voice note
          ...entity.metadata,
        } as Entity;
        
        await createEntity(newEntity);
      }
      
      // Process completions
      for (const completion of extraction.completions) {
        if (completion.confidence >= 0.7) {
          await markEntityComplete(completion.entityId);
        }
      }
      
      // Refresh data
      await refreshData();
      
    } catch (err) {
      console.error('Failed to process recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to process recording');
    } finally {
      setIsProcessing(false);
    }
  }, [refreshData]);

  // Process text input manually (fallback when speech recognition fails)
  const processTextInput = useCallback(async (text: string) => {
    if (!text || text.trim().length < 3) {
      setError('Please enter at least 3 characters');
      return;
    }

    setIsProcessing(true);
    try {
      const transcript = text.trim();
      
      // Try Llama first, then fallback
      let extraction;
      if (llmReady) {
        console.log('Using Llama for text extraction...');
        const llamaResult = await extractEntitiesWithLlama(transcript);
        if (llamaResult && llamaResult.entities.length > 0) {
          extraction = {
            entities: llamaResult.entities.map(e => ({
              type: e.type as any,
              content: e.content,
              metadata: e.metadata,
            })),
            completions: [],
            summary: llamaResult.summary,
          };
        } else {
          extraction = fallbackExtraction(transcript);
        }
      } else {
        extraction = fallbackExtraction(transcript);
      }
      
      setLastTranscript(transcript);
      setLastExtraction(extraction);
      
      // Save extracted entities to database
      const now = new Date().toISOString();
      for (const entity of extraction.entities) {
        const newEntity: Entity = {
          id: generateEntityId(),
          type: entity.type,
          content: entity.content,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          rawTranscript: transcript,
          ...entity.metadata,
        } as Entity;
        
        await createEntity(newEntity);
      }
      
      // Refresh data
      await refreshData();
      
    } catch (err) {
      console.error('Failed to process text input:', err);
      setError(err instanceof Error ? err.message : 'Failed to process text');
    } finally {
      setIsProcessing(false);
    }
  }, [refreshData]);
  
  // Complete an entity
  const completeEntity = useCallback(async (id: string) => {
    try {
      await markEntityComplete(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to complete entity:', err);
      setError('Failed to mark as complete');
    }
  }, [refreshData]);
  
  // Remove an entity
  const removeEntity = useCallback(async (id: string) => {
    try {
      await deleteEntity(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to remove entity:', err);
      setError('Failed to remove item');
    }
  }, [refreshData]);
  
  // Get entities by type
  const getEntitiesOfType = useCallback(async (type: EntityType) => {
    return await getEntitiesByType(type);
  }, []);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return (
    <AppContext.Provider
      value={{
        isInitialized,
        isRecording,
        isProcessing,
        entities,
        upcomingItems,
        lastTranscript,
        lastExtraction,
        error,
        liveTranscript,
        llmReady,
        llmDownloadProgress,
        activeVoiceNoteId,
        refreshData,
        handleStartRecording,
        handleStopRecording,
        processTextInput,
        completeEntity,
        removeEntity,
        getEntitiesOfType,
        clearError,
        openVoiceNote,
        closeVoiceNote,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
