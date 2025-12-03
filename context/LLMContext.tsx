import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { LLMExtractionResult } from '../types';
import { 
  buildExtractionPrompt, 
  parseExtractionResponse, 
  fallbackExtraction,
  LocalModelType,
} from '../services/localLLM';
import { extractEntities as extractWithOpenAI } from '../services/openai';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Try to import executorch, but handle gracefully if not available
let useLLM: any = null;
let LLAMA3_2_1B: any = null;
let LLAMA3_2_3B: any = null;

try {
  const executorch = require('react-native-executorch');
  useLLM = executorch.useLLM;
  LLAMA3_2_1B = executorch.LLAMA3_2_1B;
  LLAMA3_2_3B = executorch.LLAMA3_2_3B;
} catch (e) {
  console.log('react-native-executorch not available, using fallback');
}

const LLM_MODE_KEY = 'llm_mode';
const LOCAL_MODEL_KEY = 'local_model_type';

export type LLMMode = 'local' | 'openai' | 'hybrid';

interface LLMContextType {
  // State
  llmMode: LLMMode;
  localModelType: LocalModelType;
  isModelReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  error: string | null;
  
  // Actions
  setLLMMode: (mode: LLMMode) => Promise<void>;
  setLocalModelType: (type: LocalModelType) => Promise<void>;
  extractEntities: (transcript: string) => Promise<LLMExtractionResult>;
}

const LLMContext = createContext<LLMContextType | null>(null);

export function LLMProvider({ children }: { children: ReactNode }) {
  const [llmMode, setLLMModeState] = useState<LLMMode>('hybrid');
  const [localModelType, setLocalModelTypeState] = useState<LocalModelType>('llama3.2-1b');
  const [error, setError] = useState<string | null>(null);
  
  // Use local LLM hook if available
  const localLLM = useLLM ? useLLM({
    modelSource: localModelType === 'llama3.2-1b' ? LLAMA3_2_1B : LLAMA3_2_3B,
    tokenizerSource: localModelType === 'llama3.2-1b' ? LLAMA3_2_1B : LLAMA3_2_3B,
    contextWindowLength: 2048,
  }) : {
    isReady: false,
    isGenerating: false,
    downloadProgress: 0,
    error: null,
    generate: async () => '',
    response: '',
  };
  
  // Load saved settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const [savedMode, savedModel] = await Promise.all([
          AsyncStorage.getItem(LLM_MODE_KEY),
          AsyncStorage.getItem(LOCAL_MODEL_KEY),
        ]);
        
        if (savedMode) {
          setLLMModeState(savedMode as LLMMode);
        }
        if (savedModel) {
          setLocalModelTypeState(savedModel as LocalModelType);
        }
      } catch (e) {
        console.error('Failed to load LLM settings:', e);
      }
    }
    loadSettings();
  }, []);
  
  // Save LLM mode
  const setLLMMode = useCallback(async (mode: LLMMode) => {
    await AsyncStorage.setItem(LLM_MODE_KEY, mode);
    setLLMModeState(mode);
  }, []);
  
  // Save local model type
  const setLocalModelType = useCallback(async (type: LocalModelType) => {
    await AsyncStorage.setItem(LOCAL_MODEL_KEY, type);
    setLocalModelTypeState(type);
  }, []);
  
  // Extract entities using configured method
  const extractEntities = useCallback(async (transcript: string): Promise<LLMExtractionResult> => {
    setError(null);
    
    try {
      // Local-only mode
      if (llmMode === 'local') {
        if (localLLM.isReady) {
          const prompt = await buildExtractionPrompt(transcript);
          const response = await localLLM.generate(prompt);
          return parseExtractionResponse(response);
        } else {
          // Model not ready, use fallback
          console.log('Local model not ready, using fallback extraction');
          return fallbackExtraction(transcript);
        }
      }
      
      // OpenAI-only mode
      if (llmMode === 'openai') {
        return await extractWithOpenAI(transcript);
      }
      
      // Hybrid mode: try local first, fallback to OpenAI
      if (llmMode === 'hybrid') {
        if (localLLM.isReady) {
          try {
            const prompt = await buildExtractionPrompt(transcript);
            const response = await localLLM.generate(prompt);
            const result = parseExtractionResponse(response);
            
            // If local extraction found entities, use it
            if (result.entities.length > 0) {
              return result;
            }
          } catch (localError) {
            console.log('Local extraction failed, falling back to OpenAI:', localError);
          }
        }
        
        // Fallback to OpenAI
        try {
          return await extractWithOpenAI(transcript);
        } catch (openaiError) {
          console.log('OpenAI also failed, using pattern matching:', openaiError);
          return fallbackExtraction(transcript);
        }
      }
      
      // Default fallback
      return fallbackExtraction(transcript);
      
    } catch (err) {
      console.error('Entity extraction failed:', err);
      setError(err instanceof Error ? err.message : 'Extraction failed');
      return fallbackExtraction(transcript);
    }
  }, [llmMode, localLLM]);
  
  return (
    <LLMContext.Provider
      value={{
        llmMode,
        localModelType,
        isModelReady: localLLM.isReady,
        isGenerating: localLLM.isGenerating,
        downloadProgress: localLLM.downloadProgress || 0,
        error: error || localLLM.error,
        setLLMMode,
        setLocalModelType,
        extractEntities,
      }}
    >
      {children}
    </LLMContext.Provider>
  );
}

export function useLLMContext(): LLMContextType {
  const context = useContext(LLMContext);
  if (!context) {
    throw new Error('useLLMContext must be used within an LLMProvider');
  }
  return context;
}

