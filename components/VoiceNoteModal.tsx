import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView 
} from 'react-native';
import { Audio } from 'expo-av';
import { VoiceNote } from '../types';
import { getVoiceNoteById } from '../services/database';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { format } from 'date-fns';

interface VoiceNoteModalProps {
  visible: boolean;
  voiceNoteId: string | null;
  onClose: () => void;
}

export function VoiceNoteModal({ visible, voiceNoteId, onClose }: VoiceNoteModalProps) {
  const [note, setNote] = useState<VoiceNote | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (visible && voiceNoteId) {
      loadNote(voiceNoteId);
    } else {
      setNote(null);
      unloadSound();
    }
  }, [visible, voiceNoteId]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      unloadSound();
    };
  }, []);

  const loadNote = async (id: string) => {
    try {
      const data = await getVoiceNoteById(id);
      setNote(data);
      if (data?.audioUri) {
        await loadAudio(data.audioUri);
      }
    } catch (e) {
      console.error('Failed to load voice note:', e);
    }
  };

  const loadAudio = async (uri: string) => {
    try {
      await unloadSound();
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
    } catch (e) {
      console.log('Failed to load audio:', e);
    }
  };

  const unloadSound = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPosition(0);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        sound?.setPositionAsync(0);
      }
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Original Recording</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {note ? (
            <View style={styles.content}>
              <View style={styles.audioCard}>
                <View style={styles.waveformIcon}>
                  <Text style={{ fontSize: 24 }}>🎙️</Text>
                </View>
                <View style={styles.audioInfo}>
                  <Text style={styles.audioDate}>
                    {format(new Date(note.createdAt), 'MMM d, h:mm a')}
                  </Text>
                  <Text style={styles.audioDuration}>
                    {formatDuration(position)} / {formatDuration(note.duration || duration)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.playButton} 
                  onPress={togglePlayback}
                  disabled={!sound}
                >
                  <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.transcriptLabel}>Transcript:</Text>
              <ScrollView style={styles.transcriptScroll}>
                <Text style={styles.transcriptText}>{note.transcript}</Text>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function formatDuration(millis: number) {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '70%',
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  audioCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  waveformIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  audioInfo: {
    flex: 1,
  },
  audioDate: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  audioDuration: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  playIcon: {
    fontSize: 20,
    color: '#fff',
    marginLeft: 2,
  },
  transcriptLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcriptScroll: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  transcriptText: {
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    lineHeight: typography.sizes.lg * 1.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
  },
});

