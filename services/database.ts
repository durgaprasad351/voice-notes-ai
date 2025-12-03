import * as SQLite from 'expo-sqlite';
import { Entity, EntityType, EntityStatus } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('voicenotes.db');
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      raw_transcript TEXT,
      metadata TEXT
    );
    
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      uri TEXT NOT NULL,
      duration INTEGER,
      created_at TEXT NOT NULL,
      transcript TEXT,
      processed INTEGER DEFAULT 0
    );
    
    CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
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

// Entity CRUD Operations
export async function createEntity(entity: Entity): Promise<void> {
  const db = await getDatabase();
  const metadata = JSON.stringify(extractMetadata(entity));
  
  await db.runAsync(
    `INSERT INTO entities (id, type, content, status, created_at, updated_at, raw_transcript, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entity.id,
      entity.type,
      entity.content,
      entity.status,
      entity.createdAt,
      entity.updatedAt,
      entity.rawTranscript || null,
      metadata,
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
  await db.runAsync('DELETE FROM entities WHERE id = ?', [id]);
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
  };
  
  return { ...base, ...metadata } as Entity;
}

function extractMetadata(entity: Entity): Record<string, unknown> {
  const { id, type, content, status, createdAt, updatedAt, rawTranscript, ...metadata } = entity;
  return metadata;
}

