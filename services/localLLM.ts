import { useLLM, LLAMA3_2_1B, LLAMA3_2_3B } from 'react-native-executorch';
import { Entity, LLMExtractionResult } from '../types';
import { getActiveEntities } from './database';

// Model configuration
export type LocalModelType = 'llama3.2-1b' | 'llama3.2-3b';

let isModelLoaded = false;
let currentModel: LocalModelType | null = null;

// System prompt for entity extraction (optimized for small models)
const EXTRACTION_SYSTEM_PROMPT = `You extract structured data from voice notes. Output valid JSON only.

Categories: todo, reminder, event, note, journal, shopping, person, idea

For each item found, output:
{"entities":[{"type":"TYPE","content":"DESCRIPTION","metadata":{}}],"completions":[],"summary":"BRIEF"}

Metadata by type:
- todo: {"dueDate":"ISO_DATE or null","priority":"low|medium|high"}
- reminder: {"reminderTime":"ISO_DATETIME"}
- event: {"eventDate":"ISO_DATE","eventTime":"HH:MM or null","location":"STRING or null"}
- shopping: {"quantity":NUMBER or null}
- person: {"name":"STRING"}
- journal: {"mood":"happy|neutral|sad|excited|anxious or null"}
- idea/note: {}

Current date: ${new Date().toISOString().split('T')[0]}

If user says "done/finished/completed X", add to completions with matching entityId.

Output ONLY valid JSON, no explanation.`;

// Hook for using the LLM (must be used in a React component)
export function useLocalLLM(modelType: LocalModelType = 'llama3.2-1b') {
  const modelConfig = modelType === 'llama3.2-1b' ? LLAMA3_2_1B : LLAMA3_2_3B;
  
  const llm = useLLM({
    modelSource: modelConfig,
    tokenizerSource: modelConfig,
    contextWindowLength: 2048,
  });
  
  return {
    isReady: llm.isReady,
    isGenerating: llm.isGenerating,
    downloadProgress: llm.downloadProgress,
    error: llm.error,
    generate: llm.generate,
    response: llm.response,
  };
}

// Format existing entities for context (shorter format for small models)
function formatExistingEntitiesShort(entities: Entity[]): string {
  if (entities.length === 0) return 'None';
  
  return entities
    .slice(0, 20) // Limit for smaller context
    .map(e => `[${e.id}] ${e.type}: ${e.content.substring(0, 50)}`)
    .join('\n');
}

// Build prompt for extraction
export async function buildExtractionPrompt(transcript: string): Promise<string> {
  const existingEntities = await getActiveEntities();
  const existingContext = formatExistingEntitiesShort(existingEntities);
  
  return `${EXTRACTION_SYSTEM_PROMPT}

Existing items (for completion matching):
${existingContext}

Voice note transcript:
"${transcript}"

JSON output:`;
}

// Parse LLM response to structured result
export function parseExtractionResponse(response: string): LLMExtractionResult {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', response);
      return { entities: [], completions: [], summary: 'Failed to parse response' };
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and clean up the response
    return {
      entities: Array.isArray(parsed.entities) ? parsed.entities.map((e: any) => ({
        type: e.type || 'note',
        content: e.content || '',
        metadata: e.metadata || {},
      })) : [],
      completions: Array.isArray(parsed.completions) ? parsed.completions : [],
      summary: parsed.summary || 'Extracted from voice note',
    };
  } catch (error) {
    console.error('Failed to parse LLM response:', error, response);
    return { entities: [], completions: [], summary: 'Failed to parse response' };
  }
}

// Fallback extraction using simple pattern matching (if LLM fails)
export function fallbackExtraction(transcript: string): LLMExtractionResult {
  const entities: LLMExtractionResult['entities'] = [];
  const lowerTranscript = transcript.toLowerCase();
  
  // Simple pattern matching for common phrases
  if (lowerTranscript.includes('remind') || lowerTranscript.includes('reminder')) {
    entities.push({
      type: 'reminder',
      content: transcript,
      metadata: { reminderTime: new Date(Date.now() + 3600000).toISOString() },
    });
  } else if (lowerTranscript.includes('buy') || lowerTranscript.includes('shopping') || lowerTranscript.includes('grocery')) {
    entities.push({
      type: 'shopping',
      content: transcript,
      metadata: {},
    });
  } else if (lowerTranscript.includes('meeting') || lowerTranscript.includes('appointment') || lowerTranscript.includes('event')) {
    entities.push({
      type: 'event',
      content: transcript,
      metadata: { eventDate: new Date().toISOString().split('T')[0] },
    });
  } else if (lowerTranscript.includes('todo') || lowerTranscript.includes('task') || lowerTranscript.includes('need to')) {
    entities.push({
      type: 'todo',
      content: transcript,
      metadata: { priority: 'medium' },
    });
  } else if (lowerTranscript.includes('idea') || lowerTranscript.includes('thought')) {
    entities.push({
      type: 'idea',
      content: transcript,
      metadata: {},
    });
  } else if (lowerTranscript.includes('feeling') || lowerTranscript.includes('today') || lowerTranscript.includes('day')) {
    entities.push({
      type: 'journal',
      content: transcript,
      metadata: {},
    });
  } else {
    // Default to note
    entities.push({
      type: 'note',
      content: transcript,
      metadata: {},
    });
  }
  
  return {
    entities,
    completions: [],
    summary: 'Extracted using fallback pattern matching',
  };
}

