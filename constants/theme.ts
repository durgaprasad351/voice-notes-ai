// VoiceNotes AI Design System - Modern Soft Minimal
// Inspired by: Amie, Cron, Rise

export const colors = {
  // Base
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB', // Very light grey for strips/backgrounds
  backgroundCard: '#FFFFFF',
  backgroundCardHover: '#F3F4F6',
  
  // Text
  textPrimary: '#111827', // Near black
  textSecondary: '#6B7280', // Cool grey
  textMuted: '#9CA3AF',
  textInverted: '#FFFFFF',
  
  // Brand / Interactive
  primary: '#111827', // Black primary actions
  accent: '#F43F5E', // Soft Red/Pink for highlights
  
  // Functional Colors
  recording: '#EF4444',
  recordingPulse: 'rgba(239, 68, 68, 0.2)',
  processing: '#F59E0B',
  
  // Soft Pastels for Entities (Backgrounds)
  noteBg: '#EEF2FF',      // Indigo 50
  journalBg: '#F5F3FF',   // Violet 50
  todoBg: '#ECFDF5',      // Emerald 50
  reminderBg: '#FFFBEB',  // Amber 50
  eventBg: '#EFF6FF',     // Blue 50
  shoppingBg: '#FDF2F8',  // Pink 50
  personBg: '#F0FDFA',    // Teal 50
  ideaBg: '#FFF7ED',      // Orange 50

  // Strong Accents for Entities (Icons/Text)
  note: '#6366F1',
  journal: '#8B5CF6',
  todo: '#10B981',
  reminder: '#F59E0B',
  event: '#3B82F6',
  shopping: '#EC4899',
  person: '#14B8A6',
  idea: '#F97316',
  
  // UI Elements
  border: '#E5E7EB', // Grey 200
  borderLight: '#F3F4F6',
  overlay: 'rgba(0, 0, 0, 0.4)',
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
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    serif: 'Georgia', // Native Serif fallback
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 32,
    xxxl: 42,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  }),
};

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

export const entityBgColors: Record<string, string> = {
  note: colors.noteBg,
  journal: colors.journalBg,
  todo: colors.todoBg,
  reminder: colors.reminderBg,
  event: colors.eventBg,
  shopping: colors.shoppingBg,
  person: colors.personBg,
  idea: colors.ideaBg,
};

export const entityIcons: Record<string, string> = {
  note: '📝',
  journal: '📔',
  todo: '✓',
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
