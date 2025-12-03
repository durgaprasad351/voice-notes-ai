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
} from '../services/database';
import { setupAudio, startRecording, stopRecording, generateEntityId } from '../services/audio';
import { fallbackExtraction } from '../services/localLLM';

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
  
  // Actions
  refreshData: () => Promise<void>;
  handleStartRecording: () => Promise<void>;
  handleStopRecording: () => Promise<void>;
  completeEntity: (id: string) => Promise<void>;
  removeEntity: (id: string) => Promise<void>;
  getEntitiesOfType: (type: EntityType) => Promise<Entity[]>;
  clearError: () => void;
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
        throw new Error('Could not transcribe audio. Please try again.');
      }
      
      console.log('Using on-device transcript:', transcript);
      
      // Extract entities using local pattern matching
      const extraction = fallbackExtraction(transcript);
      
      setLastTranscript(transcript);
      setLastExtraction(extraction);
      setLiveTranscript('');
      
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
        refreshData,
        handleStartRecording,
        handleStopRecording,
        completeEntity,
        removeEntity,
        getEntitiesOfType,
        clearError,
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
