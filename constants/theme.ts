// VoiceNotes AI Design System
// Inspired by: Midnight gradient with warm accents

export const colors = {
  // Primary palette - Deep midnight blues
  background: '#0A0A0F',
  backgroundSecondary: '#12121A',
  backgroundCard: '#1A1A24',
  backgroundCardHover: '#222230',
  
  // Text colors
  textPrimary: '#F8F8FC',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B80',
  
  // Accent colors - Warm coral gradient
  accent: '#FF6B6B',
  accentSecondary: '#FF8E53',
  accentGradientStart: '#FF6B6B',
  accentGradientEnd: '#FF8E53',
  
  // Recording states
  recording: '#FF4757',
  recordingPulse: 'rgba(255, 71, 87, 0.3)',
  processing: '#FFB347',
  
  // Entity type colors (vivid but not harsh)
  note: '#7C83FD',
  journal: '#A855F7',
  todo: '#4ADE80',
  reminder: '#FBBF24',
  event: '#38BDF8',
  shopping: '#F472B6',
  person: '#2DD4BF',
  idea: '#FB923C',
  
  // Status colors
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#38BDF8',
  
  // Borders and dividers
  border: '#2A2A3A',
  borderLight: '#3A3A4A',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  // Font family - Using system fonts with SF Pro fallback
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  
  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  }),
};

// Entity colors mapping
export const entityColors: Record<string, string> = {
  note: colors.note,
  journal: colors.journal,
  todo: colors.todo,
  reminder: colors.reminder,
  event: colors.event,
  shopping: colors.shopping,
  person: colors.person,
  idea: colors.idea,
};

// Entity icons (using emoji for simplicity - can be replaced with vector icons)
export const entityIcons: Record<string, string> = {
  note: '📝',
  journal: '📔',
  todo: '✅',
  reminder: '⏰',
  event: '📅',
  shopping: '🛒',
  person: '👤',
  idea: '💡',
};

export const entityLabels: Record<string, string> = {
  note: 'Note',
  journal: 'Journal',
  todo: 'Todo',
  reminder: 'Reminder',
  event: 'Event',
  shopping: 'Shopping',
  person: 'Person',
  idea: 'Idea',
};

