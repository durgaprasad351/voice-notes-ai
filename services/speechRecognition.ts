import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

// Check if on-device speech recognition is available
export async function isOnDeviceSpeechAvailable(): Promise<boolean> {
  try {
    const status = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    return status.granted || status.canAskAgain;
  } catch {
    return false;
  }
}

// Request speech recognition permissions
export async function requestSpeechPermissions(): Promise<boolean> {
  try {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return result.granted;
  } catch (error) {
    console.error('Failed to request speech permissions:', error);
    return false;
  }
}

// Get available locales for speech recognition
export async function getSupportedLocales(): Promise<string[]> {
  try {
    return await ExpoSpeechRecognitionModule.getSupportedLocales({});
  } catch {
    return ['en-US'];
  }
}

// Start real-time speech recognition (returns a promise that resolves when done)
export function startRealtimeRecognition(
  onPartialResult: (text: string) => void,
  onFinalResult: (text: string) => void,
  onError: (error: string) => void
): { stop: () => void } {
  let finalTranscript = '';
  
  // Start recognition
  ExpoSpeechRecognitionModule.start({
    lang: 'en-US',
    interimResults: true,
    maxAlternatives: 1,
    continuous: true,
    requiresOnDeviceRecognition: false, // Allow cloud fallback if needed
    addsPunctuation: true,
  });
  
  return {
    stop: () => {
      ExpoSpeechRecognitionModule.stop();
    },
  };
}

// Simple one-shot transcription from audio file
// Note: expo-speech-recognition works with live audio, not files
// For file-based transcription, we'll still use Whisper as the primary method
// But we can use real-time recognition during recording for instant feedback

export async function transcribeWithOnDeviceSpeech(
  onResult: (text: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  options?: { language?: string }
): Promise<{ stop: () => Promise<string> }> {
  const lang = options?.language || 'en-US';
  let fullTranscript = '';
  let resolveStop: ((transcript: string) => void) | null = null;
  
  // Request permissions first
  const hasPermission = await requestSpeechPermissions();
  if (!hasPermission) {
    onError('Speech recognition permission denied');
    return { 
      stop: async () => '' 
    };
  }
  
  // Set up event listeners using the module's addListener
  const resultSubscription = ExpoSpeechRecognitionModule.addListener('result', (event) => {
    if (event.results && event.results.length > 0) {
      const result = event.results[0];
      const transcript = result.transcript || '';
      const isFinal = result.isFinal || false;
      
      if (isFinal) {
        fullTranscript += transcript + ' ';
      }
      
      onResult(isFinal ? fullTranscript.trim() : transcript, isFinal);
    }
  });
  
  const errorSubscription = ExpoSpeechRecognitionModule.addListener('error', (event) => {
    onError(event.error || 'Speech recognition error');
  });
  
  const endSubscription = ExpoSpeechRecognitionModule.addListener('end', () => {
    // Clean up subscriptions
    resultSubscription.remove();
    errorSubscription.remove();
    endSubscription.remove();
    
    if (resolveStop) {
      resolveStop(fullTranscript.trim());
    }
  });
  
  // Start recognition
  ExpoSpeechRecognitionModule.start({
    lang,
    interimResults: true,
    maxAlternatives: 1,
    continuous: true,
    requiresOnDeviceRecognition: false,
    addsPunctuation: true,
  });
  
  return {
    stop: () => {
      return new Promise((resolve) => {
        resolveStop = resolve;
        ExpoSpeechRecognitionModule.stop();
        
        // Fallback timeout in case end event doesn't fire
        setTimeout(() => {
          if (resolveStop) {
            resolve(fullTranscript.trim());
            resolveStop = null;
          }
        }, 1000);
      });
    },
  };
}

