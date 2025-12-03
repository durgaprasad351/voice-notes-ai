import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Entity, EntityType, LLMExtractionResult } from '../types';
import { 
  initDatabase, 
  getActiveEntities, 
  getUpcomingItems, 
  createEntity, 
  updateEntity, 
  markEntityComplete,
  getEntitiesByType,
  deleteEntity,
  getAllEntities,
} from '../services/database';
import { initOpenAI, processRecording } from '../services/openai';
import { setupAudio, startRecording, stopRecording, generateEntityId } from '../services/audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE = 'openai_api_key';

interface AppContextType {
  // State
  isInitialized: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  entities: Entity[];
  upcomingItems: Entity[];
  apiKey: string | null;
  lastTranscript: string | null;
  lastExtraction: LLMExtractionResult | null;
  error: string | null;
  
  // Actions
  setApiKey: (key: string) => Promise<void>;
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
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [lastExtraction, setLastExtraction] = useState<LLMExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize app
  useEffect(() => {
    async function init() {
      try {
        // Initialize database
        await initDatabase();
        
        // Setup audio permissions
        await setupAudio();
        
        // Load saved API key or use hardcoded default
        const savedKey = await AsyncStorage.getItem(API_KEY_STORAGE);
        if (savedKey) {
          setApiKeyState(savedKey);
          initOpenAI(savedKey);
        } else {
          // Auto-initialize with hardcoded key
          setApiKeyState('configured');
          initOpenAI();
        }
        
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
  
  // Save and set API key
  const setApiKey = useCallback(async (key: string) => {
    await AsyncStorage.setItem(API_KEY_STORAGE, key);
    setApiKeyState(key);
    initOpenAI(key);
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
  
  // Start recording
  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);
      await startRecording();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
    }
  }, []);
  
  // Stop recording and process
  const handleStopRecording = useCallback(async () => {
    if (!apiKey) {
      setError('Please set your OpenAI API key first');
      return;
    }
    
    try {
      setIsRecording(false);
      setIsProcessing(true);
      setError(null);
      
      // Stop recording and get audio
      const result = await stopRecording();
      if (!result) {
        throw new Error('No recording to process');
      }
      
      // Process with OpenAI
      const { transcript, extraction } = await processRecording(result.uri);
      
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
  }, [apiKey, refreshData]);
  
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
        apiKey,
        lastTranscript,
        lastExtraction,
        error,
        setApiKey,
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

