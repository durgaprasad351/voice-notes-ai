// Entity Types for VoiceNotes AI

export type EntityType = 
  | 'note'
  | 'journal'
  | 'todo'
  | 'reminder'
  | 'event'
  | 'shopping'
  | 'person'
  | 'idea';

export type EntityStatus = 'active' | 'completed' | 'cancelled';

export interface BaseEntity {
  id: string;
  type: EntityType;
  content: string;
  createdAt: string;
  updatedAt: string;
  status: EntityStatus;
  rawTranscript?: string;
}

export interface NoteEntity extends BaseEntity {
  type: 'note';
}

export interface JournalEntity extends BaseEntity {
  type: 'journal';
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious';
}

export interface TodoEntity extends BaseEntity {
  type: 'todo';
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface ReminderEntity extends BaseEntity {
  type: 'reminder';
  reminderTime: string;
  isRecurring?: boolean;
  recurringPattern?: string;
}

export interface EventEntity extends BaseEntity {
  type: 'event';
  eventDate: string;
  eventTime?: string;
  location?: string;
  duration?: number; // in minutes
}

export interface ShoppingEntity extends BaseEntity {
  type: 'shopping';
  quantity?: number;
  unit?: string;
  category?: string;
}

export interface PersonEntity extends BaseEntity {
  type: 'person';
  name: string;
  relationship?: string;
  notes?: string;
}

export interface IdeaEntity extends BaseEntity {
  type: 'idea';
  category?: string;
  tags?: string[];
}

export type Entity = 
  | NoteEntity 
  | JournalEntity 
  | TodoEntity 
  | ReminderEntity 
  | EventEntity 
  | ShoppingEntity 
  | PersonEntity 
  | IdeaEntity;

// LLM Response Types
export interface LLMExtractionResult {
  entities: ExtractedEntity[];
  completions: CompletionMatch[];
  summary?: string;
}

export interface ExtractedEntity {
  type: EntityType;
  content: string;
  metadata: Record<string, unknown>;
}

export interface CompletionMatch {
  entityId: string;
  confidence: number;
  reason: string;
}

// Audio Recording
export interface Recording {
  id: string;
  uri: string;
  duration: number;
  createdAt: string;
  transcript?: string;
  processed: boolean;
}

// UI State
export interface DashboardItem {
  id: string;
  type: EntityType;
  content: string;
  dueDate?: string;
  priority?: string;
  isOverdue?: boolean;
}

export const ENTITY_LABELS: Record<EntityType, string> = {
  note: '📝 Note',
  journal: '📔 Journal',
  todo: '✅ Todo',
  reminder: '⏰ Reminder',
  event: '📅 Event',
  shopping: '🛒 Shopping',
  person: '👤 Person',
  idea: '💡 Idea',
};

export const ENTITY_COLORS: Record<EntityType, string> = {
  note: '#6366F1',
  journal: '#8B5CF6',
  todo: '#22C55E',
  reminder: '#F59E0B',
  event: '#3B82F6',
  shopping: '#EC4899',
  person: '#14B8A6',
  idea: '#F97316',
};

