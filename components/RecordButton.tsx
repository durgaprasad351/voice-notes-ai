import React, { useEffect, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Text,
  ActivityIndicator,
} from 'react-native';
import { colors, shadows, spacing, typography } from '../constants/theme';

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function RecordButton({ 
  isRecording, 
  isProcessing, 
  onPress, 
  disabled 
}: RecordButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Pulse animation when recording
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    
    // Cleanup: stop animation when component unmounts or recording stops
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isRecording, pulseAnim]);
  
  // Press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  return (
    <View style={styles.container}>
      {/* Pulse ring (visible when recording) */}
      {isRecording && (
        <Animated.View 
          style={[
            styles.pulseRing,
            { transform: [{ scale: pulseAnim }] }
          ]} 
        />
      )}
      
      {/* Main button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.button,
            isRecording && styles.buttonRecording,
            isProcessing && styles.buttonProcessing,
            disabled && styles.buttonDisabled,
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isProcessing}
          activeOpacity={0.9}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.textPrimary} size="large" />
          ) : isRecording ? (
            <View style={styles.stopIcon} />
          ) : (
            <View style={styles.micIcon}>
              <Text style={styles.micEmoji}>🎙️</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      
      {/* Status text */}
      <Text style={styles.statusText}>
        {isProcessing 
          ? 'Processing...' 
          : isRecording 
            ? 'Tap to stop' 
            : 'Tap to speak'}
      </Text>
    </View>
  );
}

const BUTTON_SIZE = 100;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: BUTTON_SIZE + 40,
    height: BUTTON_SIZE + 40,
    borderRadius: (BUTTON_SIZE + 40) / 2,
    backgroundColor: colors.recordingPulse,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  buttonRecording: {
    backgroundColor: colors.recording,
    ...shadows.glow(colors.recording),
  },
  buttonProcessing: {
    backgroundColor: colors.processing,
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.textPrimary,
  },
  micIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micEmoji: {
    fontSize: 40,
  },
  statusText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

