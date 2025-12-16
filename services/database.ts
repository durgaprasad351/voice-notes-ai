import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Entity, EntityType, EntityStatus, VoiceNote } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('voicenotes.db');
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS voice_notes (
      id TEXT PRIMARY KEY,
      transcript TEXT NOT NULL,
      audio_uri TEXT NOT NULL,
      created_at TEXT NOT NULL,
      duration INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      raw_transcript TEXT,
      metadata TEXT,
      voice_note_id TEXT
    );
    
    -- Migration to add voice_note_id if missing
    PRAGMA user_version;
  `);

  // Simple migration system
  const userVersionResult = await db.getFirstAsync<{user_version: number}>('PRAGMA user_version');
  const userVersion = userVersionResult?.user_version || 0;

  if (userVersion < 1) {
    try {
      await db.execAsync('ALTER TABLE entities ADD COLUMN voice_note_id TEXT');
    } catch (e) {
      // Column might already exist if table was just created
    }
    await db.execAsync('PRAGMA user_version = 1');
  }
  
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_entities_voice_note ON entities(voice_note_id);
    CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
    CREATE INDEX IF NOT EXISTS idx_entities_created ON entities(created_at);
  `);
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await initDatabase();
  }
  return db!;
}

// VoiceNote Operations
export async function createVoiceNote(note: VoiceNote): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO voice_notes (id, transcript, audio_uri, created_at, duration)
     VALUES (?, ?, ?, ?, ?)`,
    [note.id, note.transcript, note.audioUri, note.createdAt, note.duration]
  );
}

export async function getVoiceNoteById(id: string): Promise<VoiceNote | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{
    id: string;
    transcript: string;
    audio_uri: string;
    created_at: string;
    duration: number;
  }>(
    'SELECT * FROM voice_notes WHERE id = ?',
    [id]
  );
  
  if (!result) return null;
  
  return {
    id: result.id,
    transcript: result.transcript,
    audioUri: result.audio_uri,
    createdAt: result.created_at,
    duration: result.duration
  };
}

// Entity CRUD Operations
export async function createEntity(entity: Entity): Promise<void> {
  const db = await getDatabase();
  const metadata = JSON.stringify(extractMetadata(entity));
  
  await db.runAsync(
    `INSERT INTO entities (id, type, content, status, created_at, updated_at, raw_transcript, metadata, voice_note_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entity.id,
      entity.type,
      entity.content,
      entity.status,
      entity.createdAt,
      entity.updatedAt,
      entity.rawTranscript || null,
      metadata,
      entity.voiceNoteId || null
    ]
  );
}

export async function updateEntity(id: string, updates: Partial<Entity>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];
  
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);
  
  await db.runAsync(
    `UPDATE entities SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteEntity(id: string): Promise<void> {
  const db = await getDatabase();
  
  // Get the voice_note_id before deleting
  const entity = await getEntityById(id);
  const voiceNoteId = entity?.voiceNoteId;
  
  await db.runAsync('DELETE FROM entities WHERE id = ?', [id]);
  
  // Check if we need to clean up the voice note
  if (voiceNoteId) {
    const remaining = await db.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) as count FROM entities WHERE voice_note_id = ?',
      [voiceNoteId]
    );
    
    if (remaining && remaining.count === 0) {
      console.log(`Deleting orphaned voice note: ${voiceNoteId}`);
      
      // Get the file URI to delete the audio file
      const note = await getVoiceNoteById(voiceNoteId);
      if (note?.audioUri) {
        try {
          await FileSystem.deleteAsync(note.audioUri, { idempotent: true });
        } catch (e) {
          console.error('Failed to delete audio file:', e);
        }
      }
      
      await db.runAsync('DELETE FROM voice_notes WHERE id = ?', [voiceNoteId]);
    }
  }
}

export async function getEntityById(id: string): Promise<Entity | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<EntityRow>(
    'SELECT * FROM entities WHERE id = ?',
    [id]
  );
  return result ? rowToEntity(result) : null;
}

export async function getEntitiesByType(type: EntityType): Promise<Entity[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<EntityRow>(
    'SELECT * FROM entities WHERE type = ? ORDER BY created_at DESC',
    [type]
  );
  return results.map(rowToEntity);
}

export async function getActiveEntities(): Promise<Entity[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<EntityRow>(
    'SELECT * FROM entities WHERE status = ? ORDER BY created_at DESC',
    ['active']
  );
  return results.map(rowToEntity);
}

export async function getUpcomingItems(): Promise<Entity[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  // Get todos, reminders, and events that are active and upcoming
  const results = await db.getAllAsync<EntityRow>(
    `SELECT * FROM entities 
     WHERE status = 'active' 
     AND type IN ('todo', 'reminder', 'event')
     ORDER BY 
       CASE 
         WHEN json_extract(metadata, '$.dueDate') IS NOT NULL THEN json_extract(metadata, '$.dueDate')
         WHEN json_extract(metadata, '$.reminderTime') IS NOT NULL THEN json_extract(metadata, '$.reminderTime')
         WHEN json_extract(metadata, '$.eventDate') IS NOT NULL THEN json_extract(metadata, '$.eventDate')
         ELSE created_at
       END ASC
     LIMIT 10`
  );
  
  return results.map(rowToEntity);
}

export async function markEntityComplete(id: string): Promise<void> {
  await updateEntity(id, { status: 'completed' });
}

export async function searchEntities(query: string): Promise<Entity[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<EntityRow>(
    `SELECT * FROM entities 
     WHERE content LIKE ? 
     ORDER BY created_at DESC 
     LIMIT 50`,
    [`%${query}%`]
  );
  return results.map(rowToEntity);
}

export async function getAllEntities(): Promise<Entity[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<EntityRow>(
    'SELECT * FROM entities ORDER BY created_at DESC'
  );
  return results.map(rowToEntity);
}

// Helper types and functions
interface EntityRow {
  id: string;
  type: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  raw_transcript: string | null;
  metadata: string | null;
  voice_note_id: string | null;
}

function rowToEntity(row: EntityRow): Entity {
  const metadata = row.metadata ? JSON.parse(row.metadata) : {};
  
  const base = {
    id: row.id,
    type: row.type as EntityType,
    content: row.content,
    status: row.status as EntityStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rawTranscript: row.raw_transcript || undefined,
    voiceNoteId: row.voice_note_id || undefined,
  };
  
  return { ...base, ...metadata } as Entity;
}

function extractMetadata(entity: Entity): Record<string, unknown> {
  const { id, type, content, status, createdAt, updatedAt, rawTranscript, voiceNoteId, ...metadata } = entity;
  return metadata;
}

