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
import { initOpenAI, transcribeAudio, extractEntities as extractWithOpenAI } from '../services/openai';
import { setupAudio, startRecording, stopRecording, generateEntityId } from '../services/audio';
import { fallbackExtraction } from '../services/localLLM';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE = 'openai_api_key';
const TRANSCRIPTION_MODE_KEY = 'transcription_mode';
const LLM_MODE_KEY = 'llm_mode';

export type TranscriptionMode = 'on-device' | 'whisper' | 'hybrid';
export type LLMMode = 'local' | 'openai' | 'hybrid';

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
  liveTranscript: string;
  transcriptionMode: TranscriptionMode;
  llmMode: LLMMode;
  
  // Actions
  setApiKey: (key: string) => Promise<void>;
  setTranscriptionMode: (mode: TranscriptionMode) => Promise<void>;
  setLLMMode: (mode: LLMMode) => Promise<void>;
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
  const [liveTranscript, setLiveTranscript] = useState('');
  const [transcriptionMode, setTranscriptionModeState] = useState<TranscriptionMode>('hybrid');
  const [llmMode, setLLMModeState] = useState<LLMMode>('openai');
  
  // Initialize app
  useEffect(() => {
    async function init() {
      try {
        // Initialize database
        await initDatabase();
        
        // Setup audio permissions
        await setupAudio();
        
        // Load saved settings
        const [savedKey, savedTransMode, savedLLMMode] = await Promise.all([
          AsyncStorage.getItem(API_KEY_STORAGE),
          AsyncStorage.getItem(TRANSCRIPTION_MODE_KEY),
          AsyncStorage.getItem(LLM_MODE_KEY),
        ]);
        
        if (savedKey) {
          setApiKeyState(savedKey);
          initOpenAI(savedKey);
        } else {
          // Auto-initialize with hardcoded key
          setApiKeyState('configured');
          initOpenAI();
        }
        
        if (savedTransMode) {
          setTranscriptionModeState(savedTransMode as TranscriptionMode);
        }
        
        if (savedLLMMode) {
          setLLMModeState(savedLLMMode as LLMMode);
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
  
  // Save and set transcription mode
  const setTranscriptionMode = useCallback(async (mode: TranscriptionMode) => {
    await AsyncStorage.setItem(TRANSCRIPTION_MODE_KEY, mode);
    setTranscriptionModeState(mode);
  }, []);
  
  // Save and set LLM mode
  const setLLMMode = useCallback(async (mode: LLMMode) => {
    await AsyncStorage.setItem(LLM_MODE_KEY, mode);
    setLLMModeState(mode);
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
  
  // Extract entities based on LLM mode
  const extractEntities = useCallback(async (transcript: string): Promise<LLMExtractionResult> => {
    if (llmMode === 'local') {
      // Use local pattern-based extraction (will be upgraded to on-device LLM)
      console.log('Using local extraction');
      return fallbackExtraction(transcript);
    } else if (llmMode === 'openai') {
      // Use OpenAI
      console.log('Using OpenAI extraction');
      return await extractWithOpenAI(transcript);
    } else {
      // Hybrid: try local first for simple cases, OpenAI for complex
      console.log('Using hybrid extraction');
      const localResult = fallbackExtraction(transcript);
      
      // If local found something meaningful, use it
      if (localResult.entities.length > 0 && localResult.entities[0].type !== 'note') {
        console.log('Hybrid: using local result');
        return localResult;
      }
      
      // Otherwise use OpenAI for better extraction
      try {
        console.log('Hybrid: using OpenAI for better extraction');
        return await extractWithOpenAI(transcript);
      } catch (e) {
        console.log('Hybrid: OpenAI failed, using local');
        return localResult;
      }
    }
  }, [llmMode]);
  
  // Start recording
  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);
      setLiveTranscript('');
      
      // Start recording with real-time transcription callback
      await startRecording(
        transcriptionMode !== 'whisper' ? handleTranscriptUpdate : undefined
      );
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
    }
  }, [transcriptionMode, handleTranscriptUpdate]);
  
  // Stop recording and process
  const handleStopRecording = useCallback(async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      setError(null);
      
      // Stop recording and get audio + on-device transcript
      const result = await stopRecording();
      if (!result) {
        throw new Error('No recording to process');
      }
      
      let transcript: string;
      
      // Determine which transcript to use based on mode
      if (transcriptionMode === 'on-device' && result.onDeviceTranscript) {
        // Use on-device transcript only
        transcript = result.onDeviceTranscript;
        console.log('Using on-device transcript:', transcript);
      } else if (transcriptionMode === 'whisper') {
        // Use Whisper only
        transcript = await transcribeAudio(result.uri);
        console.log('Using Whisper transcript:', transcript);
      } else {
        // Hybrid mode: use on-device if available, otherwise Whisper
        if (result.onDeviceTranscript && result.onDeviceTranscript.length > 10) {
          transcript = result.onDeviceTranscript;
          console.log('Hybrid: using on-device transcript:', transcript);
        } else {
          transcript = await transcribeAudio(result.uri);
          console.log('Hybrid: falling back to Whisper:', transcript);
        }
      }
      
      // Extract entities using configured LLM mode
      const extraction = await extractEntities(transcript);
      
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
  }, [refreshData, transcriptionMode, extractEntities]);
  
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
        liveTranscript,
        transcriptionMode,
        llmMode,
        setApiKey,
        setTranscriptionMode,
        setLLMMode,
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
