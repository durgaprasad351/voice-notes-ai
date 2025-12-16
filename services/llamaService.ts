import { initLlama, LlamaContext } from 'llama.rn';
import * as FileSystem from 'expo-file-system/legacy';
import { LLMExtractionResult } from '../types';
import { format } from 'date-fns';

// Model configuration - using Qwen 2.5 0.5B Instruct (q8_0 for better accuracy)
const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q8_0.gguf';
const MODEL_FILENAME = 'qwen2.5-0.5b-instruct-q8_0.gguf';

let llamaContext: LlamaContext | null = null;
let isInitializing = false;
let downloadProgress = 0;

let lastError: string | null = null;

export interface LlamaServiceStatus {
  isReady: boolean;
  isInitializing: boolean;
  downloadProgress: number;
  error: string | null;
}

// Get the model file path
function getModelPath(): string {
  return `${FileSystem.documentDirectory}models/${MODEL_FILENAME}`;
}

// Delete model to force re-download
export async function resetModel(): Promise<void> {
  try {
    const path = getModelPath();
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      await FileSystem.deleteAsync(path);
      console.log('Model deleted successfully');
    }
    llamaContext = null;
    lastError = null;
    downloadProgress = 0;
  } catch (error) {
    console.error('Failed to reset model:', error);
    throw error;
  }
}

// Check if model exists
async function modelExists(): Promise<boolean> {
  const path = getModelPath();
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

// Ensure models directory exists
async function ensureModelsDir(): Promise<void> {
  const modelDir = `${FileSystem.documentDirectory}models`;
  const dirInfo = await FileSystem.getInfoAsync(modelDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
  }
}

// Initialize the Llama context
export async function initializeLlama(onProgress?: (progress: number) => void): Promise<boolean> {
  if (llamaContext) {
    console.log('Llama already initialized');
    return true;
  }

  if (isInitializing) {
    console.log('Llama initialization already in progress');
    return false;
  }

  isInitializing = true;
  downloadProgress = 0;

  try {
    await ensureModelsDir();
    const modelPath = getModelPath();
    const exists = await modelExists();

    if (!exists) {
      console.log('Downloading model from:', MODEL_URL);
      const downloadResumable = FileSystem.createDownloadResumable(
        MODEL_URL,
        modelPath,
        {},
        (downloadProgressEvent) => {
          const progress = downloadProgressEvent.totalBytesWritten / downloadProgressEvent.totalBytesExpectedToWrite;
          downloadProgress = progress;
          console.log(`Model download progress: ${(progress * 100).toFixed(1)}%`);
          if (onProgress) onProgress(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) {
        throw new Error('Failed to download model');
      }
      console.log('Model downloaded to:', result.uri);
    } else {
      console.log('Model already exists at:', modelPath);
      downloadProgress = 1;
      if (onProgress) onProgress(1);
    }

    console.log('Initializing Llama context...');
    
    // Initialize the context with native binding
    llamaContext = await initLlama({
      model: modelPath,
      n_ctx: 2048,
      n_batch: 512,
      n_threads: 4,     // optimized for mobile
      use_mlock: true,  // keep model in memory
      n_gpu_layers: 0,  // CPU only for now to be safe
    });

    console.log('Llama initialized successfully!');
    isInitializing = false;
    lastError = null;
    return true;
  } catch (error) {
    console.error('Failed to initialize Llama:', error);
    lastError = error instanceof Error ? error.message : String(error);
    isInitializing = false;
    throw error;
  }
}

// Generate a completion
export async function generateCompletion(prompt: string): Promise<string> {
  if (!llamaContext) {
    throw new Error('Llama not initialized. Call initializeLlama first.');
  }

  try {
    const result = await llamaContext.completion({
      prompt,
      n_predict: 512,
      temperature: 0.1, // Low temp for precision
      top_p: 0.95,
      stop: ['</s>', '<|im_end|>', '```'],
    });

    return result.text;
  } catch (error) {
    console.error('Completion error:', error);
    throw error;
  }
}

// System prompt with explicit classification rules
const getSystemPrompt = (currentDate: string) => `You are a helpful assistant. Extract entities from the text into JSON.

Context:
- Current Date: ${currentDate}
- Calculate all relative dates (tomorrow, next monday) based on Current Date.

Rules:
1. "shopping": ONLY for physical items to buy (food, clothes, etc). Extract items individually.
2. "event": for meetings, appointments, lunch, dinner, calls. Use YYYY-MM-DD for dates.
3. "todo": for actions/tasks.

Examples:

Input: "I need milk and eggs and then lunch with Sarah"
Output:
{
  "entities": [
    { "type": "shopping", "content": "milk, eggs", "metadata": { "items": ["milk", "eggs"] } },
    { "type": "event", "content": "lunch with Sarah", "metadata": { "time": "lunch" } }
  ]
}

Input: "Meeting at 5pm and pick up bread"
Output:
{
  "entities": [
    { "type": "event", "content": "Meeting", "metadata": { "time": "17:00" } },
    { "type": "shopping", "content": "bread", "metadata": { "items": ["bread"] } }
  ]
}

Respond ONLY with valid JSON.`;

// Extract entities from transcript using Llama
export async function extractEntitiesWithLlama(transcript: string): Promise<LLMExtractionResult | null> {
  if (!llamaContext) {
    return null;
  }

  const currentDate = format(new Date(), 'EEEE, yyyy-MM-dd');
  const systemPrompt = getSystemPrompt(currentDate);

  // Qwen prompt format
  const prompt = `<|im_start|>system
${systemPrompt}
<|im_end|>
<|im_start|>user
Input: "${transcript}"
Output:
<|im_end|>
<|im_start|>assistant
`;

  try {
    const response = await generateCompletion(prompt);
    console.log('Llama raw response:', response);

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        entities: parsed.entities || [],
        completions: [],
        summary: parsed.summary || 'Extracted from voice note',
      };
    }
  } catch (error) {
    console.error('Failed to extract with Llama:', error);
  }

  return null;
}

// Get the current status
export function getLlamaStatus(): LlamaServiceStatus {
  return {
    isReady: llamaContext !== null,
    isInitializing,
    downloadProgress,
    error: lastError,
  };
}
