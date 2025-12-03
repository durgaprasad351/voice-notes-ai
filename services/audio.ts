import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Recording } from '../types';

let currentRecording: Audio.Recording | null = null;

// Request permissions and configure audio
export async function setupAudio(): Promise<boolean> {
  try {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      console.error('Audio permission not granted');
      return false;
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

// Start recording
export async function startRecording(): Promise<void> {
  try {
    // Stop any existing recording
    if (currentRecording) {
      await stopRecording();
    }
    
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    
    currentRecording = recording;
  } catch (error) {
    console.error('Failed to start recording:', error);
    throw error;
  }
}

// Stop recording and return the URI
export async function stopRecording(): Promise<{ uri: string; duration: number } | null> {
  if (!currentRecording) {
    return null;
  }
  
  try {
    // Get status BEFORE stopping (to get duration)
    const status = await currentRecording.getStatusAsync();
    const duration = status.durationMillis || 0;
    
    // Now stop and unload
    await currentRecording.stopAndUnloadAsync();
    const uri = currentRecording.getURI();
    
    currentRecording = null;
    
    if (!uri) {
      return null;
    }
    
    return {
      uri,
      duration,
    };
  } catch (error) {
    console.error('Failed to stop recording:', error);
    currentRecording = null;
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
    await currentRecording.stopAndUnloadAsync();
    const uri = currentRecording.getURI();
    
    // Delete the file
    if (uri) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
    
    currentRecording = null;
  } catch (error) {
    console.error('Failed to cancel recording:', error);
    currentRecording = null;
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

