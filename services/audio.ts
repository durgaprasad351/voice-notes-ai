import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

let currentRecording: Audio.Recording | null = null;
let speechRecognitionActive = false;
let transcriptAccumulator = '';

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
        // Set up listeners
        const resultSub = ExpoSpeechRecognitionModule.addListener('result', (event) => {
          if (event.results && event.results.length > 0) {
            const result = event.results[0];
            const transcript = result.transcript || '';
            const isFinal = result.isFinal || false;
            
            if (isFinal && transcript) {
              transcriptAccumulator += transcript + ' ';
              onTranscriptUpdate(transcriptAccumulator.trim(), false);
            } else if (transcript) {
              onTranscriptUpdate(transcriptAccumulator + transcript, false);
            }
          }
        });
        
        const errorSub = ExpoSpeechRecognitionModule.addListener('error', (event) => {
          console.log('Speech recognition error:', event.error);
          // Don't fail - we have audio recording as backup
        });
        
        // Start speech recognition
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: true,
          maxAlternatives: 1,
          continuous: true,
          requiresOnDeviceRecognition: false,
          addsPunctuation: true,
        });
        
        speechRecognitionActive = true;
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
    
    // Stop speech recognition first
    let onDeviceTranscript: string | null = null;
    if (speechRecognitionActive) {
      try {
        ExpoSpeechRecognitionModule.stop();
        onDeviceTranscript = transcriptAccumulator.trim() || null;
        speechRecognitionActive = false;
      } catch (e) {
        console.log('Error stopping speech recognition:', e);
      }
    }
    
    // Now stop audio recording
    await currentRecording.stopAndUnloadAsync();
    const uri = currentRecording.getURI();
    
    currentRecording = null;
    transcriptAccumulator = '';
    
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
  } catch (error) {
    console.error('Failed to cancel recording:', error);
    currentRecording = null;
    speechRecognitionActive = false;
    transcriptAccumulator = '';
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
