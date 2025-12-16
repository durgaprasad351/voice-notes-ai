import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

let currentRecording: Audio.Recording | null = null;
let speechRecognitionActive = false;
let transcriptAccumulator = '';
let pendingFinalTranscript: string | null = null;
let speechEndResolver: ((transcript: string) => void) | null = null;

// Request permissions and configure audio
export async function setupAudio(): Promise<boolean> {
  try {
    // Request audio permission
    const { granted: audioGranted } = await Audio.requestPermissionsAsync();
    if (!audioGranted) {
      console.error('Audio permission not granted');
      return false;
    }
    
    // Request speech recognition permission
    try {
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    } catch (e) {
      console.log('Speech recognition permissions not available (Expo Go):', e);
    }
    
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to setup audio:', error);
    return false;
  }
}

// Start recording with optional real-time transcription
export async function startRecording(
  onTranscriptUpdate?: (text: string, isFinal: boolean) => void
): Promise<void> {
  try {
    // Stop any existing recording
    if (currentRecording) {
      await stopRecording();
    }
    
    transcriptAccumulator = '';
    
    // Start audio recording (for backup/Whisper fallback)
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    currentRecording = recording;
    
    // Try to start real-time speech recognition
    if (onTranscriptUpdate) {
      try {
        // Reset state
        pendingFinalTranscript = null;
        
        // Set up listeners
        const resultSub = ExpoSpeechRecognitionModule.addListener('result', (event: any) => {
          console.log('Speech result event:', JSON.stringify(event));
          if (event.results && event.results.length > 0) {
            const result = event.results[0];
            const transcript = result.transcript || '';
            // isFinal can be on the event OR on the result
            const isFinal = event.isFinal || result.isFinal || false;
            
            console.log('Parsed result - transcript:', transcript, 'isFinal:', isFinal);
            
            if (isFinal && transcript) {
              // Store the final transcript immediately - don't accumulate, replace
              const finalText = transcript.trim();
              pendingFinalTranscript = finalText;
              transcriptAccumulator = finalText;
              console.log('Final transcript captured:', finalText);
              onTranscriptUpdate(finalText, true);
            } else if (transcript) {
              onTranscriptUpdate(transcriptAccumulator + transcript, false);
            }
          }
        });
        
        const errorSub = ExpoSpeechRecognitionModule.addListener('error', (event) => {
          console.log('Speech recognition error:', event.error, event);
          // Resolve with whatever we have so far
          if (speechEndResolver) {
            speechEndResolver(pendingFinalTranscript || transcriptAccumulator.trim() || '');
            speechEndResolver = null;
          }
        });

        const startSub = ExpoSpeechRecognitionModule.addListener('start', () => {
          console.log('Speech recognition started successfully');
        });

        const endSub = ExpoSpeechRecognitionModule.addListener('end', () => {
          const finalTranscript = pendingFinalTranscript || transcriptAccumulator.trim();
          console.log('Speech recognition ended');
          console.log('- pendingFinalTranscript:', pendingFinalTranscript);
          console.log('- transcriptAccumulator:', transcriptAccumulator);
          console.log('- using:', finalTranscript);
          // Resolve the promise when speech recognition ends
          if (speechEndResolver) {
            speechEndResolver(finalTranscript);
            speechEndResolver = null;
          }
        });
        
        // Start speech recognition - try on-device first, then cloud
        console.log('Starting speech recognition...');
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: true,
          maxAlternatives: 1,
          continuous: true,
          requiresOnDeviceRecognition: false, // Allow cloud fallback
          addsPunctuation: true,
        });
        
        speechRecognitionActive = true;
        console.log('Speech recognition request sent');
      } catch (e) {
        console.log('Real-time speech recognition not available:', e);
        // Continue without real-time transcription - will use Whisper later
      }
    }
  } catch (error) {
    console.error('Failed to start recording:', error);
    throw error;
  }
}

// Stop recording and return the URI + transcript
export async function stopRecording(): Promise<{ 
  uri: string; 
  duration: number;
  onDeviceTranscript: string | null;
} | null> {
  if (!currentRecording) {
    return null;
  }
  
  try {
    // Get status BEFORE stopping (to get duration)
    const status = await currentRecording.getStatusAsync();
    const duration = status.durationMillis || 0;
    
    // Stop speech recognition and wait for final result
    let onDeviceTranscript: string | null = null;
    if (speechRecognitionActive) {
      try {
        // If we already have a final transcript, use it immediately
        if (pendingFinalTranscript) {
          console.log('Using pending final transcript:', pendingFinalTranscript);
          onDeviceTranscript = pendingFinalTranscript;
          ExpoSpeechRecognitionModule.stop();
        } else {
          // Wait for the speech recognition to end and give us the transcript
          console.log('Waiting for speech recognition to finish...');
          const transcriptPromise = new Promise<string>((resolve) => {
            speechEndResolver = resolve;
            // Timeout after 2 seconds
            setTimeout(() => {
              if (speechEndResolver) {
                console.log('Speech recognition timeout, using accumulated:', transcriptAccumulator.trim());
                resolve(pendingFinalTranscript || transcriptAccumulator.trim());
                speechEndResolver = null;
              }
            }, 2000);
          });
          
          ExpoSpeechRecognitionModule.stop();
          onDeviceTranscript = await transcriptPromise || null;
        }
        
        speechRecognitionActive = false;
      } catch (e) {
        console.log('Error stopping speech recognition:', e);
        onDeviceTranscript = pendingFinalTranscript || transcriptAccumulator.trim() || null;
      }
    }
    
    console.log('Final onDeviceTranscript:', onDeviceTranscript);
    
    // Now stop audio recording
    await currentRecording.stopAndUnloadAsync();
    const uri = currentRecording.getURI();
    
    currentRecording = null;
    transcriptAccumulator = '';
    pendingFinalTranscript = null;
    
    if (!uri) {
      return null;
    }
    
    return {
      uri,
      duration,
      onDeviceTranscript,
    };
  } catch (error) {
    console.error('Failed to stop recording:', error);
    currentRecording = null;
    speechRecognitionActive = false;
    transcriptAccumulator = '';
    pendingFinalTranscript = null;
    throw error;
  }
}

// Get recording status
export async function getRecordingStatus(): Promise<Audio.RecordingStatus | null> {
  if (!currentRecording) {
    return null;
  }
  
  try {
    return await currentRecording.getStatusAsync();
  } catch (error) {
    console.error('Failed to get recording status:', error);
    return null;
  }
}

// Check if currently recording
export function isRecording(): boolean {
  return currentRecording !== null;
}

// Cancel recording without saving
export async function cancelRecording(): Promise<void> {
  if (!currentRecording) {
    return;
  }
  
  try {
    // Stop speech recognition
    if (speechRecognitionActive) {
      try {
        ExpoSpeechRecognitionModule.stop();
        speechRecognitionActive = false;
      } catch (e) {
        console.log('Error stopping speech recognition:', e);
      }
    }
    
    await currentRecording.stopAndUnloadAsync();
    const uri = currentRecording.getURI();
    
    // Delete the file
    if (uri) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
    
    currentRecording = null;
    transcriptAccumulator = '';
    pendingFinalTranscript = null;
    speechEndResolver = null;
  } catch (error) {
    console.error('Failed to cancel recording:', error);
    currentRecording = null;
    speechRecognitionActive = false;
    transcriptAccumulator = '';
    pendingFinalTranscript = null;
    speechEndResolver = null;
  }
}

// Generate a unique ID for recordings
export function generateRecordingId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate a unique ID for entities
export function generateEntityId(): string {
  return `ent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
