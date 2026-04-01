import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from './async-storage';
import { Character, Chapter, Project, Block, RichBlock, CustomBubble, Scene, TemplatePack, ReaderAccountSettings } from '@/types';

// Storage keys for web
const STORAGE_KEYS = {
  PROJECTS: 'chaptrr_projects',
  CHARACTERS: 'chaptrr_characters',
  CHAPTERS: 'chaptrr_chapters',
  BLOCKS: 'chaptrr_blocks',
  CUSTOM_BUBBLES: 'chaptrr_custom_bubbles',
  TEMPLATE_PACKS: 'chaptrr_template_packs',
  READER_SETTINGS: 'chaptrr_reader_settings',
  INITIALIZED: 'chaptrr_initialized'
};

let db: SQLite.SQLiteDatabase | null = null;

// Helper function to safely parse JSON
const safeJSONParse = <T = any>(value: any, defaultValue: T, fieldName: string = 'field'): T => {
  try {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value !== 'string') {
      if (typeof value === 'object') return value as T;
      return defaultValue;
    }
    if (value.trim() === '') return defaultValue;
    
    const trimmed = value.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('"')) {
      console.warn(`Invalid JSON format for ${fieldName}, returning default. Value does not start with valid JSON character`);
      return defaultValue;
    }
    
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
    if (typeof defaultValue === 'object' && defaultValue !== null && (typeof parsed !== 'object' || parsed === null)) return defaultValue;
    return parsed;
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error(`Error parsing ${fieldName}: ${errorMsg}`);
    return defaultValue;
  }
};

// Initialize database only on native platforms
if (Platform.OS !== 'web') {
  try {
    db = SQLite.openDatabaseSync('chaptrr.db');
    console.log('SQLite database connection established');
  } catch (error) {
    console.error('Failed to open SQLite database:', error);
    throw error;
  }
}

// Web storage helpers
const getWebData = async <T>(key: string): Promise<T[]> => {
  if (Platform.OS !== 'web') return [];
  try {
    const data = await AsyncStorage.getItem(key);
    if (!data || data.trim() === '') return [];
    
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      console.error(`[getWebData] Error parsing JSON for ${key}:`, errorMsg);
      console.error(`[getWebData] Corrupted data (first 200 chars):`, data.substring(0, 200));
      console.log(`[getWebData] Resetting ${key} to empty array`);
      await AsyncStorage.setItem(key, JSON.stringify([]));
      return [];
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[getWebData] Error getting web data for ${key}:`, errorMsg);
    return [];
  }
};

const setWebData = async <T>(key: string, data: T[]): Promise<void> => {
  if (Platform.OS !== 'web') return;
  try {
    const sanitizedData = data.map((item: any) => {
      const sanitized: any = {};
      for (const k in item) {
        const value = item[k];
        if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
          continue;
        }
        if (typeof value === 'string') {
          // For text content in blocks, preserve newlines but remove other control chars
          if (key === STORAGE_KEYS.BLOCKS && k === 'text') {
            sanitized[k] = value
              .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ''); // Remove control chars except \n (\x0A) and \r (\x0D)
          } else {
            // For all other strings, remove ALL control characters
            sanitized[k] = value.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
          }
        } else {
          sanitized[k] = value;
        }
      }
      return sanitized;
    });
    
    const jsonString = JSON.stringify(sanitizedData);
    if (!jsonString || jsonString.trim() === '') {
      console.error(`[setWebData] Empty JSON string for ${key}`);
      return;
    }
    await AsyncStorage.setItem(key, jsonString);
  } catch (error) {
    console.error(`Error setting web data for ${key}:`, error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Error message: ${errorMsg}`);
    try {
      console.error(`Data that failed (first 500 chars):`, JSON.stringify(data, null, 2).substring(0, 500));
    } catch (e) {
      console.error(`Could not stringify data for logging`);
    }
    throw new Error(`Failed to save data: ${errorMsg}`);
  }
};

// Initialize database schema
export const initializeDatabase = async (): Promise<void> => {
  console.log('Initializing database...');
  
  if (Platform.OS === 'web') {
    // Check if already initialized
    const initialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      // Initialize empty arrays
      await setWebData(STORAGE_KEYS.PROJECTS, []);
      await setWebData(STORAGE_KEYS.CHARACTERS, []);
      await setWebData(STORAGE_KEYS.CHAPTERS, []);
      await setWebData(STORAGE_KEYS.BLOCKS, []);
      await setWebData(STORAGE_KEYS.CUSTOM_BUBBLES, []);
      await setWebData(STORAGE_KEYS.TEMPLATE_PACKS, []);
      await setWebData(STORAGE_KEYS.READER_SETTINGS, []);
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
    console.log('Web storage initialized successfully');
    return;
  }

  if (!db) throw new Error('Database not initialized');
  
  try {
    // Projects table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        cover_url TEXT,
        tags TEXT,
        short_description TEXT,
        long_description TEXT,
        creator_id TEXT,
        updated_at TEXT,
        broadcast TEXT
      );
    `);
    
    try {
      db.execSync(`ALTER TABLE projects ADD COLUMN broadcast TEXT;`);
    } catch (e) {
      // Column already exists, ignore
    }

    // Characters table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        description TEXT,
        relationships TEXT,
        UNIQUE(project_id, name),
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    // Chapters table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        chapter_order INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'DRAFT',
        published_at TEXT,
        is_paid INTEGER NOT NULL DEFAULT 0,
        price REAL,
        updated_at TEXT,
        after_note TEXT,
        scenes TEXT,
        live_scenes TEXT,
        live INTEGER NOT NULL DEFAULT 0,
        scheduled TEXT,
        live_at TEXT,
        edited_since_live INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);
    
    // Add chapter_order column if it doesn't exist (for existing databases)
    try {
      db.execSync(`ALTER TABLE chapters ADD COLUMN chapter_order INTEGER NOT NULL DEFAULT 0;`);
    } catch (e) {
      // Column already exists, ignore
    }
    // New v4 chapter columns
    try { db.execSync(`ALTER TABLE chapters ADD COLUMN scenes TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE chapters ADD COLUMN live_scenes TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE chapters ADD COLUMN live INTEGER NOT NULL DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE chapters ADD COLUMN scheduled TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE chapters ADD COLUMN live_at TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE chapters ADD COLUMN edited_since_live INTEGER NOT NULL DEFAULT 0;`); } catch (e) {}

    // Blocks table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL,
        block_type TEXT NOT NULL,
        block_order INTEGER NOT NULL DEFAULT 0,
        content_url TEXT,
        text TEXT,
        alignment TEXT,
        formatting TEXT,
        bubble_style TEXT,
        character_id TEXT,
        background_span_id TEXT,
        image_style TEXT,
        background_style TEXT,
        FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
      );
    `);
    
    // Add new columns if they don't exist (for existing databases)
    try {
      db.execSync(`ALTER TABLE blocks ADD COLUMN image_style TEXT;`);
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      db.execSync(`ALTER TABLE blocks ADD COLUMN background_style TEXT;`);
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      db.execSync(`ALTER TABLE chapters ADD COLUMN spacing INTEGER DEFAULT 2;`);
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      db.execSync(`ALTER TABLE chapters ADD COLUMN after_note TEXT;`);
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      db.execSync(`ALTER TABLE chapters ADD COLUMN global_spacing INTEGER DEFAULT 0;`);
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      db.execSync(`ALTER TABLE projects ADD COLUMN bookmarked INTEGER DEFAULT 0;`);
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      db.execSync(`ALTER TABLE projects ADD COLUMN subscribed INTEGER DEFAULT 0;`);
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      db.execSync(`ALTER TABLE projects ADD COLUMN status TEXT;`);
    } catch (e) {
      // Column already exists, ignore
    }

    // Background spans table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS background_spans (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        repeat_mode TEXT NOT NULL,
        start_block_id TEXT NOT NULL,
        end_block_id TEXT NOT NULL,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    // Custom bubbles table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS custom_bubbles (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        cap_insets TEXT NOT NULL,
        tintable INTEGER NOT NULL DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    // Template packs table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS template_packs (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    // Reader settings table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS reader_settings (
        user_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    // Create indexes
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_chars_project ON characters(project_id);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_chapters_project ON chapters(project_id, live);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_blocks_chapter ON blocks(chapter_id, block_order);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_custom_bubbles_project ON custom_bubbles(project_id);`);

    console.log('SQLite database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Character operations
export const createCharacter = async (projectId: string, data: { name: string; color: string; description?: string }): Promise<{ id: string }> => {
  const id = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  if (Platform.OS === 'web') {
    const characters = await getWebData<any>(STORAGE_KEYS.CHARACTERS);
    characters.push({
      id,
      project_id: projectId,
      name: data.name,
      color: data.color,
      description: data.description || '',
      relationships: '[]'
    });
    await setWebData(STORAGE_KEYS.CHARACTERS, characters);
    console.log('Character created (web):', { id, name: data.name, color: data.color });
    return { id };
  }

  if (!db) throw new Error('Database not initialized');
  
  try {
    db.runSync(
      `INSERT INTO characters (id, project_id, name, color, description, relationships) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, projectId, data.name, data.color, data.description || '', '[]']
    );
    
    console.log('Character created:', { id, name: data.name, color: data.color });
    return { id };
  } catch (error) {
    console.error('Error creating character:', error);
    throw error;
  }
};

export const updateCharacter = async (id: string, patch: Partial<{ name: string; color: string; description: string; relationships: any[] }>): Promise<void> => {
  if (Platform.OS === 'web') {
    const characters = await getWebData<any>(STORAGE_KEYS.CHARACTERS);
    const index = characters.findIndex((c: any) => c.id === id);
    if (index === -1) throw new Error('Character not found');
    
    const character = characters[index];
    if (patch.name !== undefined) character.name = patch.name;
    if (patch.color !== undefined) character.color = patch.color;
    if (patch.description !== undefined) character.description = patch.description;
    if (patch.relationships !== undefined) character.relationships = JSON.stringify(patch.relationships);
    
    await setWebData(STORAGE_KEYS.CHARACTERS, characters);
    await touchProject(character.project_id);
    
    console.log('Character updated (web):', { id, patch });
    return;
  }

  if (!db) throw new Error('Database not initialized');
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (patch.name !== undefined) {
    updates.push('name = ?');
    values.push(patch.name);
  }
  if (patch.color !== undefined) {
    updates.push('color = ?');
    values.push(patch.color);
  }
  if (patch.description !== undefined) {
    updates.push('description = ?');
    values.push(patch.description);
  }
  if (patch.relationships !== undefined) {
    updates.push('relationships = ?');
    values.push(JSON.stringify(patch.relationships));
  }
  
  if (updates.length === 0) return;
  
  values.push(id);
  
  try {
    db.runSync(
      `UPDATE characters SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Get project_id and update project timestamp
    const character = db.getFirstSync('SELECT project_id FROM characters WHERE id = ?', [id]) as any;
    if (character?.project_id) {
      await touchProject(character.project_id);
    }
    
    console.log('Character updated:', { id, patch });
  } catch (error) {
    console.error('Error updating character:', error);
    throw error;
  }
};

export const deleteCharacter = async (id: string): Promise<void> => {
  if (Platform.OS === 'web') {
    const characters = await getWebData<any>(STORAGE_KEYS.CHARACTERS);
    const index = characters.findIndex((c: any) => c.id === id);
    if (index === -1) throw new Error('Character not found');
    
    const character = characters[index];
    characters.splice(index, 1);
    
    await setWebData(STORAGE_KEYS.CHARACTERS, characters);
    await touchProject(character.project_id);
    
    console.log('Character deleted (web):', { id });
    return;
  }

  if (!db) throw new Error('Database not initialized');
  
  try {
    // Get project_id before deletion
    const character = db.getFirstSync('SELECT project_id FROM characters WHERE id = ?', [id]) as any;
    
    db.runSync('DELETE FROM characters WHERE id = ?', [id]);
    
    if (character?.project_id) {
      await touchProject(character.project_id);
    }
    
    console.log('Character deleted:', { id });
  } catch (error) {
    console.error('Error deleting character:', error);
    throw error;
  }
};

export const getCharacter = async (id: string): Promise<Character | null> => {
  if (Platform.OS === 'web') {
    const characters = await getWebData<any>(STORAGE_KEYS.CHARACTERS);
    const row = characters.find((c: any) => c.id === id);
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      description: row.description || '',
      relationships: safeJSONParse(row.relationships, [], 'relationships'),
      appearances: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  if (!db) return null;
  
  try {
    const row = db.getFirstSync(
      `SELECT * FROM characters WHERE id = ?`,
      [id]
    ) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      description: row.description || '',
      relationships: safeJSONParse(row.relationships, [], 'relationships'),
      appearances: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting character:', error);
    return null;
  }
};

export const listCharacters = async (projectId: string): Promise<Character[]> => {
  if (Platform.OS === 'web') {
    const characters = await getWebData<any>(STORAGE_KEYS.CHARACTERS);
    return characters
      .filter((char: any) => char.project_id === projectId)
      .map((row: any) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        description: row.description || '',
        relationships: safeJSONParse(row.relationships, [], 'relationships'),
        appearances: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
  }

  if (!db) return [];
  
  try {
    const rows = db.getAllSync(
      `SELECT * FROM characters WHERE project_id = ? ORDER BY name`,
      [projectId]
    ) as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      description: row.description || '',
      relationships: safeJSONParse(row.relationships, [], 'relationships'),
      appearances: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error listing characters:', error);
    return [];
  }
};

// Chapter operations

const defaultScene = (): Scene => ({
  id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  order: 0,
  blocks: []
});

export const createChapter = async (projectId: string, data: { title: string }): Promise<{ id: string }> => {
  const id = `chapter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  const initialScenes: Scene[] = [defaultScene()];
  const scenesJson = JSON.stringify(initialScenes);

  if (Platform.OS === 'web') {
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    const existingOrders = chapters
      .filter((c: any) => c.project_id === projectId)
      .map((c: any) => c.chapter_order || 0);
    const nextOrder = existingOrders.length > 0 ? Math.max(0, Math.max(...existingOrders)) + 1 : 0;

    chapters.push({
      id,
      project_id: projectId,
      title: data.title,
      chapter_order: nextOrder,
      live: 0,
      edited_since_live: 0,
      scenes: scenesJson,
      live_scenes: null,
      scheduled: null,
      live_at: null,
      updated_at: now,
      after_note: ''
    });
    await setWebData(STORAGE_KEYS.CHAPTERS, chapters);
    await touchProject(projectId);
    console.log('Chapter created (web):', { id, title: data.title });
    return { id };
  }

  if (!db) throw new Error('Database not initialized');

  const maxOrderResult = db.getFirstSync(
    `SELECT MAX(chapter_order) as max_order FROM chapters WHERE project_id = ?`,
    [projectId]
  ) as any;
  const nextOrder = (maxOrderResult?.max_order || 0) + 1;

  try {
    db.runSync(
      `INSERT INTO chapters (id, project_id, title, chapter_order, status, live, edited_since_live, scenes, updated_at)
       VALUES (?, ?, ?, ?, 'DRAFT', 0, 0, ?, ?)`,
      [id, projectId, data.title, nextOrder, scenesJson, now]
    );
    await touchProject(projectId);
    console.log('Chapter created:', { id, title: data.title });
    return { id };
  } catch (error) {
    console.error('Error creating chapter:', error);
    throw error;
  }
};

export const updateChapter = async (
  id: string,
  patch: Partial<{
    title: string;
    afterNote: string;
    globalSpacing: number;
  }>
): Promise<void> => {
  if (Platform.OS === 'web') {
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    const index = chapters.findIndex((c: any) => c.id === id);
    if (index === -1) throw new Error('Chapter not found');
    const chapter = chapters[index];
    if (patch.title !== undefined) chapter.title = patch.title;
    if (patch.globalSpacing !== undefined) chapter.global_spacing = patch.globalSpacing;
    if (patch.afterNote !== undefined) chapter.after_note = patch.afterNote;
    chapter.updated_at = new Date().toISOString();
    await setWebData(STORAGE_KEYS.CHAPTERS, chapters);
    await touchProject(chapter.project_id);
    console.log('Chapter updated (web):', { id, patch });
    return;
  }

  if (!db) throw new Error('Database not initialized');
  const updates: string[] = [];
  const values: any[] = [];
  if (patch.title !== undefined) { updates.push('title = ?'); values.push(patch.title); }
  if (patch.globalSpacing !== undefined) { updates.push('global_spacing = ?'); values.push(patch.globalSpacing); }
  if (patch.afterNote !== undefined) { updates.push('after_note = ?'); values.push(patch.afterNote); }
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);
  try {
    db.runSync(`UPDATE chapters SET ${updates.join(', ')} WHERE id = ?`, values);
    const chapter = db.getFirstSync('SELECT project_id FROM chapters WHERE id = ?', [id]) as any;
    if (chapter?.project_id) await touchProject(chapter.project_id);
    console.log('Chapter updated:', { id, patch });
  } catch (error) {
    console.error('Error updating chapter:', error);
    throw error;
  }
};

// Save the writer's working scenes (does not affect what readers see)
export const updateChapterScenes = async (chapterId: string, scenes: Scene[]): Promise<void> => {
  const now = new Date().toISOString();
  const scenesJson = JSON.stringify(scenes);

  if (Platform.OS === 'web') {
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    const index = chapters.findIndex((c: any) => c.id === chapterId);
    if (index === -1) throw new Error('Chapter not found');
    chapters[index].scenes = scenesJson;
    // If live, mark as edited
    if (chapters[index].live === 1) chapters[index].edited_since_live = 1;
    chapters[index].updated_at = now;
    await setWebData(STORAGE_KEYS.CHAPTERS, chapters);
    await touchProject(chapters[index].project_id);
    return;
  }

  if (!db) throw new Error('Database not initialized');
  const row = db.getFirstSync('SELECT project_id, live FROM chapters WHERE id = ?', [chapterId]) as any;
  if (!row) throw new Error('Chapter not found');
  db.runSync(
    `UPDATE chapters SET scenes = ?, edited_since_live = ?, updated_at = ? WHERE id = ?`,
    [scenesJson, row.live ? 1 : 0, now, chapterId]
  );
  await touchProject(row.project_id);
};

// Go Live: make chapter visible to readers
export const goLive = async (chapterId: string): Promise<void> => {
  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    const index = chapters.findIndex((c: any) => c.id === chapterId);
    if (index === -1) throw new Error('Chapter not found');
    const ch = chapters[index];
    ch.live = 1;
    ch.live_scenes = ch.scenes;
    ch.live_at = now;
    ch.edited_since_live = 0;
    ch.scheduled = null;
    ch.updated_at = now;
    await setWebData(STORAGE_KEYS.CHAPTERS, chapters);
    await touchProject(ch.project_id);
    return;
  }

  if (!db) throw new Error('Database not initialized');
  const row = db.getFirstSync('SELECT project_id, scenes FROM chapters WHERE id = ?', [chapterId]) as any;
  if (!row) throw new Error('Chapter not found');
  db.runSync(
    `UPDATE chapters SET live = 1, live_scenes = ?, live_at = ?, edited_since_live = 0, scheduled = NULL, updated_at = ? WHERE id = ?`,
    [row.scenes, now, now, chapterId]
  );
  await touchProject(row.project_id);
};

// Push Update: push writer's current scenes to readers
export const pushUpdate = async (chapterId: string): Promise<void> => {
  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    const index = chapters.findIndex((c: any) => c.id === chapterId);
    if (index === -1) throw new Error('Chapter not found');
    const ch = chapters[index];
    ch.live_scenes = ch.scenes;
    ch.edited_since_live = 0;
    ch.updated_at = now;
    await setWebData(STORAGE_KEYS.CHAPTERS, chapters);
    await touchProject(ch.project_id);
    return;
  }

  if (!db) throw new Error('Database not initialized');
  const row = db.getFirstSync('SELECT project_id, scenes FROM chapters WHERE id = ?', [chapterId]) as any;
  if (!row) throw new Error('Chapter not found');
  db.runSync(
    `UPDATE chapters SET live_scenes = ?, edited_since_live = 0, updated_at = ? WHERE id = ?`,
    [row.scenes, now, chapterId]
  );
  await touchProject(row.project_id);
};

// Take Down: hide chapter from readers
export const takeDown = async (chapterId: string): Promise<void> => {
  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    const index = chapters.findIndex((c: any) => c.id === chapterId);
    if (index === -1) throw new Error('Chapter not found');
    const ch = chapters[index];
    ch.live = 0;
    ch.live_scenes = null;
    ch.edited_since_live = 0;
    ch.updated_at = now;
    await setWebData(STORAGE_KEYS.CHAPTERS, chapters);
    await touchProject(ch.project_id);
    return;
  }

  if (!db) throw new Error('Database not initialized');
  const row = db.getFirstSync('SELECT project_id FROM chapters WHERE id = ?', [chapterId]) as any;
  if (!row) throw new Error('Chapter not found');
  db.runSync(
    `UPDATE chapters SET live = 0, live_scenes = NULL, edited_since_live = 0, updated_at = ? WHERE id = ?`,
    [now, chapterId]
  );
  await touchProject(row.project_id);
};

// Schedule a chapter to go live at a specific date/time
export const scheduleChapter = async (
  chapterId: string,
  schedule: { date: string; time: string; timezone: string }
): Promise<void> => {
  const now = new Date().toISOString();
  const scheduledJson = JSON.stringify(schedule);

  if (Platform.OS === 'web') {
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    const index = chapters.findIndex((c: any) => c.id === chapterId);
    if (index === -1) throw new Error('Chapter not found');
    chapters[index].scheduled = scheduledJson;
    chapters[index].updated_at = now;
    await setWebData(STORAGE_KEYS.CHAPTERS, chapters);
    await touchProject(chapters[index].project_id);
    return;
  }

  if (!db) throw new Error('Database not initialized');
  const row = db.getFirstSync('SELECT project_id FROM chapters WHERE id = ?', [chapterId]) as any;
  if (!row) throw new Error('Chapter not found');
  db.runSync(
    `UPDATE chapters SET scheduled = ?, updated_at = ? WHERE id = ?`,
    [scheduledJson, now, chapterId]
  );
  await touchProject(row.project_id);
};

// Cancel a scheduled release
export const cancelSchedule = async (chapterId: string): Promise<void> => {
  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    const index = chapters.findIndex((c: any) => c.id === chapterId);
    if (index === -1) throw new Error('Chapter not found');
    chapters[index].scheduled = null;
    chapters[index].updated_at = now;
    await setWebData(STORAGE_KEYS.CHAPTERS, chapters);
    await touchProject(chapters[index].project_id);
    return;
  }

  if (!db) throw new Error('Database not initialized');
  const row = db.getFirstSync('SELECT project_id FROM chapters WHERE id = ?', [chapterId]) as any;
  if (!row) throw new Error('Chapter not found');
  db.runSync(
    `UPDATE chapters SET scheduled = NULL, updated_at = ? WHERE id = ?`,
    [now, chapterId]
  );
  await touchProject(row.project_id);
};

// Discard edits: revert working scenes to live scenes
export const discardEdits = async (chapterId: string): Promise<void> => {
  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    const index = chapters.findIndex((c: any) => c.id === chapterId);
    if (index === -1) throw new Error('Chapter not found');
    const ch = chapters[index];
    if (ch.live_scenes) ch.scenes = ch.live_scenes;
    ch.edited_since_live = 0;
    ch.updated_at = now;
    await setWebData(STORAGE_KEYS.CHAPTERS, chapters);
    await touchProject(ch.project_id);
    return;
  }

  if (!db) throw new Error('Database not initialized');
  const row = db.getFirstSync('SELECT project_id, live_scenes FROM chapters WHERE id = ?', [chapterId]) as any;
  if (!row) throw new Error('Chapter not found');
  if (row.live_scenes) {
    db.runSync(
      `UPDATE chapters SET scenes = ?, edited_since_live = 0, updated_at = ? WHERE id = ?`,
      [row.live_scenes, now, chapterId]
    );
  }
  await touchProject(row.project_id);
};

const rowToChapter = (row: any, scenes: Scene[], liveScenes?: Scene[]): Chapter => ({
  id: row.id,
  title: row.title,
  order: row.chapter_order || 0,
  projectId: row.project_id,
  scenes,
  liveScenes,
  live: row.live === 1 || row.live === true,
  scheduled: row.scheduled ? safeJSONParse(row.scheduled, undefined, 'scheduled') : undefined,
  liveAt: row.live_at || undefined,
  editedSinceLive: row.edited_since_live === 1 || row.edited_since_live === true,
  readTime: Math.max(1, Math.ceil(scenes.reduce((acc, s) => acc + s.blocks.length, 0) * 0.5)),
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: row.updated_at || new Date().toISOString(),
  characterAppearances: scenes
    .flatMap(s => s.blocks)
    .filter(b => b.textStyle?.characterId)
    .map(b => b.textStyle!.characterId!)
    .filter((id, i, arr) => arr.indexOf(id) === i),
  globalSpacing: row.global_spacing ?? 0,
  afterNote: row.after_note || ''
});

export const listChapters = async (projectId: string, options: { liveOnly?: boolean } = {}): Promise<Chapter[]> => {
  if (Platform.OS === 'web') {
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    let filtered = chapters.filter((c: any) => c.project_id === projectId);
    if (options.liveOnly) filtered = filtered.filter((c: any) => c.live === 1);
    return filtered
      .sort((a: any, b: any) => (a.chapter_order || 0) - (b.chapter_order || 0))
      .map((row: any) => {
        const scenes = safeJSONParse<Scene[]>(row.scenes, [{ id: 'default', order: 0, blocks: [] }], 'scenes');
        const liveScenes = row.live_scenes
          ? safeJSONParse<Scene[]>(row.live_scenes, undefined as unknown as Scene[], 'liveScenes')
          : undefined;
        return rowToChapter(row, scenes, liveScenes);
      });
  }

  if (!db) return [];
  try {
    let query = `SELECT * FROM chapters WHERE project_id = ?`;
    const params: any[] = [projectId];
    if (options.liveOnly) { query += ` AND live = 1`; }
    query += ` ORDER BY chapter_order ASC`;
    const rows = db.getAllSync(query, params) as any[];
    return rows.map(row => {
      const scenes = safeJSONParse<Scene[]>(row.scenes, [{ id: 'default', order: 0, blocks: [] }], 'scenes');
      const liveScenes = row.live_scenes
        ? safeJSONParse<Scene[]>(row.live_scenes, undefined as unknown as Scene[], 'liveScenes')
        : undefined;
      return rowToChapter(row, scenes, liveScenes);
    });
  } catch (error) {
    console.error('Error listing chapters:', error);
    return [];
  }
};

export const getChapter = async (id: string): Promise<Chapter | null> => {
  if (Platform.OS === 'web') {
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    const row = chapters.find((c: any) => c.id === id);
    if (!row) return null;
    const scenes = safeJSONParse<Scene[]>(row.scenes, [{ id: 'default', order: 0, blocks: [] }], 'scenes');
    const liveScenes = row.live_scenes
      ? safeJSONParse<Scene[]>(row.live_scenes, undefined as unknown as Scene[], 'liveScenes')
      : undefined;
    return rowToChapter(row, scenes, liveScenes);
  }

  if (!db) return null;
  try {
    const row = db.getFirstSync(`SELECT * FROM chapters WHERE id = ?`, [id]) as any;
    if (!row) return null;
    const scenes = safeJSONParse<Scene[]>(row.scenes, [{ id: 'default', order: 0, blocks: [] }], 'scenes');
    const liveScenes = row.live_scenes
      ? safeJSONParse<Scene[]>(row.live_scenes, undefined as unknown as Scene[], 'liveScenes')
      : undefined;
    return rowToChapter(row, scenes, liveScenes);
  } catch (error) {
    console.error('Error getting chapter:', error);
    return null;
  }
};

// Block operations
export const updateChapterBlocks = async (chapterId: string, blocks: Block[]): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      const allBlocks = await getWebData<any>(STORAGE_KEYS.BLOCKS);
      const filtered = allBlocks.filter((b: any) => b.chapter_id !== chapterId);
      
      blocks.forEach(block => {
        const blockType = block.type === 'image' ? 'image' : 
                         block.type === 'BG' ? 'background' :
                         block.textStyle?.bubbleType === 'dialogue' || 
                         block.textStyle?.bubbleType === 'thinking' || 
                         block.textStyle?.bubbleType === 'shout' ? 'text_bubble' : 'text';
        
        // Prepare image style data
        let imageStyleData = null;
        if (block.type === 'image' && block.imageStyle) {
          try {
            imageStyleData = JSON.stringify({
              alignment: block.imageStyle.alignment || 'center',
              sizeMode: block.imageStyle.sizeMode || 'default',
              roundedCorners: block.imageStyle.roundedCorners || false
            });
          } catch (e) {
            console.error('Error stringifying imageStyle:', e);
            imageStyleData = null;
          }
        }
        
        // Prepare BG style data
        let backgroundStyleData = null;
        if (block.type === 'BG' && block.bgStyle) {
          try {
            backgroundStyleData = JSON.stringify({
              mode: block.bgStyle.mode || 'OPEN',
              imageUrl: block.bgStyle.imageUrl || '',
              transition: block.bgStyle.transition || 'fade'
            });
          } catch (e) {
            console.error('Error stringifying bgStyle:', e);
            backgroundStyleData = null;
          }
        }
        
        // Sanitize content to ensure it's valid for storage
        let sanitizedContent = '';
        try {
          if (block.content === null || block.content === undefined) {
            sanitizedContent = '';
          } else if (typeof block.content === 'string') {
            // For text blocks, preserve newlines but remove other control chars
            if (block.type === 'text') {
              sanitizedContent = block.content
                .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control chars except \n (\x0A) and \r (\x0D)
                .replace(/[\u0000-\u0009\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, ''); // Remove unicode control chars except newlines
            } else {
              // For image/BG blocks, remove ALL control characters including newlines
              sanitizedContent = block.content
                .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove all control chars
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove unicode control chars
                .trim();
            }
          } else if (typeof block.content === 'object') {
            sanitizedContent = JSON.stringify(block.content);
          } else {
            sanitizedContent = String(block.content).replace(/[\x00-\x1F\x7F-\x9F]/g, '');
          }
          
          if (block.type !== 'text') {
            sanitizedContent = sanitizedContent.trim();
          }
        } catch (e) {
          console.error('[updateChapterBlocks] Error sanitizing content:', e);
          sanitizedContent = '';
        }
        
        filtered.push({
          id: block.id,
          chapter_id: chapterId,
          block_type: blockType,
          block_order: block.order,
          content_url: block.type === 'image' || block.type === 'BG' ? (sanitizedContent !== '' ? sanitizedContent : null) : null,
          text: block.type === 'text' ? sanitizedContent : null,
          alignment: block.textStyle?.alignment || (block.imageStyle?.alignment) || 'center',
          formatting: block.textStyle?.isBold ? 'bold' : 'regular',
          bubble_style: block.textStyle?.bubbleType || null,
          character_id: block.textStyle?.characterId || null,
          image_style: imageStyleData,
          background_style: backgroundStyleData
        });
      });
      
      await setWebData(STORAGE_KEYS.BLOCKS, filtered);

      // Sync blocks into the scenes JSON so getChapter() / listChapters() returns them
      const allChapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
      const chapterIdx = allChapters.findIndex((c: any) => c.id === chapterId);
      if (chapterIdx !== -1) {
        let existingScenes: Scene[] = [];
        try { existingScenes = allChapters[chapterIdx].scenes ? JSON.parse(allChapters[chapterIdx].scenes) : []; } catch { /* ignore */ }
        const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
        const updatedScenes: Scene[] = existingScenes.length > 0
          ? existingScenes.map((s: Scene, idx: number) => idx === 0 ? { ...s, blocks: sortedBlocks } : s)
          : [{ id: `scene-default-${chapterId}`, order: 0, blocks: sortedBlocks }];
        allChapters[chapterIdx].scenes = JSON.stringify(updatedScenes);
        await setWebData(STORAGE_KEYS.CHAPTERS, allChapters);
      }

      console.log('Chapter blocks updated (web):', { chapterId, count: blocks.length });
      return;
    } catch (error) {
      console.error('[updateChapterBlocks] Error saving blocks (web):', error);
      throw error;
    }
  }

  if (!db) throw new Error('Database not initialized');
  
  try {
    db.runSync('BEGIN TRANSACTION');
    
    db.runSync('DELETE FROM blocks WHERE chapter_id = ?', [chapterId]);
    
    for (const block of blocks) {
      const blockType = block.type === 'image' ? 'image' : 
                       block.type === 'BG' ? 'background' :
                       block.textStyle?.bubbleType === 'dialogue' || 
                       block.textStyle?.bubbleType === 'thinking' || 
                       block.textStyle?.bubbleType === 'shout' ? 'text_bubble' : 'text';
      
      // Prepare image style data
      let imageStyleData = null;
      if (block.type === 'image' && block.imageStyle) {
        imageStyleData = JSON.stringify({
          alignment: block.imageStyle.alignment || 'center',
          sizeMode: block.imageStyle.sizeMode || 'default',
          roundedCorners: block.imageStyle.roundedCorners || false
        });
      }
      
      // Prepare BG style data
      let backgroundStyleData = null;
      if (block.type === 'BG' && block.bgStyle) {
        backgroundStyleData = JSON.stringify({
          mode: block.bgStyle.mode || 'OPEN',
          imageUrl: block.bgStyle.imageUrl || '',
          transition: block.bgStyle.transition || 'fade'
        });
      }
      
      // Sanitize text content to prevent SQL syntax errors
      let textContent = null;
      if (block.type === 'text') {
        const content = block.content || '';
        // Remove problematic control characters but preserve newlines for text blocks
        if (typeof content === 'string') {
          textContent = content
            .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control chars except \n (\x0A) and \r (\x0D)
            .replace(/[\u0000-\u0009\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove unicode control chars except newlines
            .replace(/\\x[0-9A-Fa-f]{2}/g, '') // Remove hex escape sequences
            .replace(/\\u[0-9A-Fa-f]{4}/g, ''); // Remove unicode escape sequences
          // Note: expo-sqlite handles quote escaping automatically with parameterized queries
        } else {
          textContent = String(content)
            .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
            .replace(/[\u0000-\u0009\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '');
        }
      }
      // Sanitize content URL for images and BG blocks
      let contentUrl = null;
      if (block.type === 'image' || block.type === 'BG') {
        const rawContent = block.content || '';
        if (typeof rawContent === 'string' && rawContent.trim() !== '') {
          contentUrl = rawContent
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .trim();
        }
      }
      
      db.runSync(
        `INSERT INTO blocks (id, chapter_id, block_type, block_order, content_url, text, alignment, formatting, bubble_style, character_id, image_style, background_style) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          block.id,
          chapterId,
          blockType,
          block.order,
          contentUrl,
          textContent,
          block.textStyle?.alignment || (block.imageStyle?.alignment) || 'center',
          block.textStyle?.isBold ? 'bold' : 'regular',
          block.textStyle?.bubbleType || null,
          block.textStyle?.characterId || null,
          imageStyleData,
          backgroundStyleData
        ]
      );
    }
    
    // Also persist blocks into the scenes JSON column so getChapter() returns them
    const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
    const existingRow = db.getFirstSync('SELECT scenes FROM chapters WHERE id = ?', [chapterId]) as any;
    let existingScenes: Scene[] = [];
    try {
      existingScenes = existingRow?.scenes ? JSON.parse(existingRow.scenes) : [];
    } catch { /* ignore */ }
    // Keep existing scene metadata (locationHeader, moodTint, etc.) but replace blocks
    const updatedScenes: Scene[] = existingScenes.length > 0
      ? existingScenes.map((s, idx) => idx === 0 ? { ...s, blocks: sortedBlocks } : s)
      : [{ id: `scene-default-${chapterId}`, order: 0, blocks: sortedBlocks }];
    db.runSync(
      `UPDATE chapters SET scenes = ?, edited_since_live = 1, updated_at = ? WHERE id = ?`,
      [JSON.stringify(updatedScenes), new Date().toISOString(), chapterId]
    );

    db.runSync('COMMIT');
    console.log('Chapter blocks updated:', { chapterId, count: blocks.length });
  } catch (error) {
    if (db) {
      try {
        db.runSync('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
    console.error('Error updating chapter blocks:', error);
    throw error;
  }
};

export const listBlocks = async (chapterId: string): Promise<Block[]> => {
  if (Platform.OS === 'web') {
    const blocks = await getWebData<any>(STORAGE_KEYS.BLOCKS);
    return blocks
      .filter((b: any) => b.chapter_id === chapterId)
      .sort((a: any, b: any) => (a.block_order || 0) - (b.block_order || 0))
      .map((row: any) => {
        const block: any = {
          id: row.id,
          type: row.block_type === 'image' ? 'image' : row.block_type === 'background' ? 'BG' : 'text',
          content: row.content_url || row.text || '',
          order: row.block_order || 0
        };
        
        // Add text style for text blocks
        if (row.block_type !== 'image' && row.block_type !== 'background') {
          block.textStyle = {
            bubbleType: row.bubble_style || 'plain',
            characterId: row.character_id,
            alignment: row.alignment || 'center',
            isBold: row.formatting === 'bold',
            isItalic: row.formatting === 'italic'
          };
        }
        
        // Add image style for image blocks
        if (row.block_type === 'image') {
          try {
            const imageStyle = row.image_style ? JSON.parse(row.image_style) : {};
            block.imageStyle = {
              alignment: imageStyle.alignment || 'center',
              sizeMode: imageStyle.sizeMode || 'default',
              roundedCorners: imageStyle.roundedCorners || false
            };
          } catch (e) {
            // Fallback to default image style
            block.imageStyle = {
              alignment: 'center',
              sizeMode: 'default',
              roundedCorners: false
            };
          }
        }
        
        // Add BG style for BG blocks
        if (row.block_type === 'background') {
          try {
            const bgStyle = row.background_style ? JSON.parse(row.background_style) : {};
            block.bgStyle = {
              mode: bgStyle.mode || 'OPEN',
              imageUrl: bgStyle.imageUrl || '',
              transition: bgStyle.transition || 'fade'
            };
          } catch (e) {
            // Fallback to default BG style
            block.bgStyle = {
              mode: 'OPEN' as const,
              imageUrl: '',
              transition: 'fade' as const
            };
          }
        }
        
        return block;
      });
  }

  if (!db) return [];
  
  try {
    const rows = db.getAllSync(
      `SELECT * FROM blocks WHERE chapter_id = ? ORDER BY block_order`,
      [chapterId]
    ) as any[];
    
    return rows.map(row => {
      const block: any = {
        id: row.id,
        type: row.block_type === 'image' ? 'image' : row.block_type === 'background' ? 'BG' : 'text',
        content: row.content_url || row.text || '',
        order: row.block_order
      };
      
      // Add text style for text blocks
      if (row.block_type !== 'image' && row.block_type !== 'background') {
        block.textStyle = {
          bubbleType: row.bubble_style || 'plain',
          characterId: row.character_id,
          alignment: row.alignment || 'center',
          isBold: row.formatting === 'bold',
          isItalic: row.formatting === 'italic'
        };
      }
      
      // Add image style for image blocks
      if (row.block_type === 'image') {
        try {
          const imageStyle = row.image_style ? JSON.parse(row.image_style) : {};
          block.imageStyle = {
            alignment: imageStyle.alignment || 'center',
            sizeMode: imageStyle.sizeMode || 'default',
            roundedCorners: imageStyle.roundedCorners || false
          };
        } catch (e) {
          // Fallback to default image style
          block.imageStyle = {
            alignment: 'center',
            sizeMode: 'default',
            roundedCorners: false
          };
        }
      }
      
      // Add BG style for BG blocks
      if (row.block_type === 'background') {
        try {
          const bgStyle = row.background_style ? JSON.parse(row.background_style) : {};
          block.bgStyle = {
            mode: bgStyle.mode || 'OPEN',
            imageUrl: bgStyle.imageUrl || '',
            transition: bgStyle.transition || 'fade'
          };
        } catch (e) {
          // Fallback to default BG style
          block.bgStyle = {
            mode: 'OPEN' as const,
            imageUrl: '',
            transition: 'fade' as const
          };
        }
      }
      
      return block;
    });
  } catch (error) {
    console.error('Error listing blocks:', error);
    return [];
  }
};

// Project operations
export const getProject = async (id: string): Promise<Project | null> => {
  if (Platform.OS === 'web') {
    const projects = await getWebData<any>(STORAGE_KEYS.PROJECTS);
    const row = projects.find((p: any) => p.id === id);
    if (!row) return null;
    
    const characters = await listCharacters(id);
    const chapters = await listChapters(id, { liveOnly: false });
    
    const tags = Array.isArray(row.tags) ? row.tags : safeJSONParse(row.tags, [], 'tags');
    const longDescription = Array.isArray(row.long_description) ? row.long_description : safeJSONParse(row.long_description, [], 'longDescription');
    
    return {
      id: row.id,
      title: row.title,
      cover: row.cover_url && row.cover_url.trim() !== '' ? row.cover_url : null,
      tags,
      description: row.short_description || '',
      shortDescription: row.short_description,
      longDescription,
      creatorId: row.creator_id || '1',
      creator: {
        id: '1',
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        followers: 0
      },
      chapters,
      characters,
      stats: { likes: 0, views: 0, opens: 0 },
      bookmarked: row.bookmarked === 1,
      subscribed: row.subscribed === 1,
      createdAt: new Date().toISOString()
    };
  }

  if (!db) return null;
  
  try {
    const row = db.getFirstSync(
      `SELECT * FROM projects WHERE id = ?`,
      [id]
    ) as any;
    
    if (!row) return null;
    
    const characters = await listCharacters(id);
    const chapters = await listChapters(id, { liveOnly: false });
    
    return {
      id: row.id,
      title: row.title,
      cover: row.cover_url && row.cover_url.trim() !== '' ? row.cover_url : null,
      tags: safeJSONParse(row.tags, [], 'tags'),
      description: row.short_description || '',
      shortDescription: row.short_description,
      longDescription: safeJSONParse(row.long_description, [], 'longDescription'),
      creatorId: row.creator_id || '1',
      creator: {
        id: '1',
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        followers: 0
      },
      chapters,
      characters,
      stats: { likes: 0, views: 0, opens: 0 },
      bookmarked: row.bookmarked === 1,
      subscribed: row.subscribed === 1,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting project:', error);
    return null;
  }
};

export const createSampleProject = async (): Promise<{ id: string }> => {
  const id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  if (Platform.OS === 'web') {
    const projects = await getWebData<any>(STORAGE_KEYS.PROJECTS);
    projects.push({
      id,
      title: 'My First Story',
      cover_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
      tags: ['adventure', 'fantasy'],
      short_description: 'A thrilling adventure story',
      long_description: [{ type: 'text', content: 'This is the beginning of an epic tale...', font: 'FontA', color: '#ffffff' }],
      creator_id: '1',
      updated_at: now
    });
    await setWebData(STORAGE_KEYS.PROJECTS, projects);
    
    console.log('Sample project created (web):', { id, title: 'My First Story' });
    return { id };
  }

  if (!db) throw new Error('Database not initialized');
  
  try {
    db.runSync(
      `INSERT INTO projects (id, title, cover_url, tags, short_description, long_description, creator_id, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        'My First Story',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
        JSON.stringify(['adventure', 'fantasy']),
        'A thrilling adventure story',
        JSON.stringify([{ type: 'text', content: 'This is the beginning of an epic tale...', font: 'FontA', color: '#ffffff' }]),
        '1',
        now
      ]
    );
    
    console.log('Sample project created:', { id, title: 'My First Story' });
    return { id };
  } catch (error) {
    console.error('Error creating sample project:', error);
    throw error;
  }
};

export const initializeSampleData = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    const projects = await getWebData<any>(STORAGE_KEYS.PROJECTS);
    if (projects.length > 0) {
      console.log('Sample data already exists (web)');
      return;
    }
    
    const project = await createSampleProject();
    
    await createCharacter(project.id, {
      name: 'Hero',
      color: '#6366f1',
      description: 'The main protagonist'
    });
    
    await createCharacter(project.id, {
      name: 'Villain',
      color: '#ef4444',
      description: 'The antagonist'
    });
    
    console.log('Sample data initialized (web)');
    return;
  }

  if (!db) throw new Error('Database not initialized');
  
  try {
    const existingProjects = db.getAllSync('SELECT COUNT(*) as count FROM projects') as any[];
    if (existingProjects[0]?.count > 0) {
      console.log('Sample data already exists');
      return;
    }
    
    const project = await createSampleProject();
    
    await createCharacter(project.id, {
      name: 'Hero',
      color: '#6366f1',
      description: 'The main protagonist'
    });
    
    await createCharacter(project.id, {
      name: 'Villain',
      color: '#ef4444',
      description: 'The antagonist'
    });
    
    console.log('Sample data initialized');
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
};

export const touchProject = async (projectId: string): Promise<void> => {
  const now = new Date().toISOString();
  
  if (Platform.OS === 'web') {
    const projects = await getWebData<any>(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex((p: any) => p.id === projectId);
    if (index !== -1) {
      projects[index].updated_at = now;
      await setWebData(STORAGE_KEYS.PROJECTS, projects);
    }
    console.log('Project timestamp updated (web):', projectId);
    return;
  }

  if (!db) return;
  
  try {
    db.runSync(
      'UPDATE projects SET updated_at = ? WHERE id = ?',
      [now, projectId]
    );
    console.log('Project timestamp updated:', projectId);
  } catch (error) {
    console.error('Error updating project timestamp:', error);
  }
};

// Reader settings
export const getReaderSettings = async (userId: string): Promise<ReaderAccountSettings> => {
  const defaults: ReaderAccountSettings = { textSizeMultiplier: 1.0, theme: 'system' };

  if (Platform.OS === 'web') {
    const allSettings = await getWebData<any>(STORAGE_KEYS.READER_SETTINGS);
    const row = allSettings.find((s: any) => s.user_id === userId);
    return row ? safeJSONParse<ReaderAccountSettings>(row.data, defaults, 'readerSettings') : defaults;
  }

  if (!db) return defaults;
  try {
    const row = db.getFirstSync('SELECT data FROM reader_settings WHERE user_id = ?', [userId]) as any;
    return row ? safeJSONParse<ReaderAccountSettings>(row.data, defaults, 'readerSettings') : defaults;
  } catch (e) {
    return defaults;
  }
};

export const updateReaderSettings = async (userId: string, settings: Partial<ReaderAccountSettings>): Promise<void> => {
  const current = await getReaderSettings(userId);
  const merged = { ...current, ...settings };
  const data = JSON.stringify(merged);
  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const allSettings = await getWebData<any>(STORAGE_KEYS.READER_SETTINGS);
    const index = allSettings.findIndex((s: any) => s.user_id === userId);
    if (index === -1) allSettings.push({ user_id: userId, data, updated_at: now });
    else { allSettings[index].data = data; allSettings[index].updated_at = now; }
    await setWebData(STORAGE_KEYS.READER_SETTINGS, allSettings);
    return;
  }

  if (!db) return;
  db.runSync(
    `INSERT INTO reader_settings (user_id, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    [userId, data, now]
  );
};

// Template pack storage
export const saveTemplatePack = async (pack: TemplatePack): Promise<void> => {
  const data = JSON.stringify(pack);
  const now = new Date().toISOString();

  if (Platform.OS === 'web') {
    const packs = await getWebData<any>(STORAGE_KEYS.TEMPLATE_PACKS);
    const index = packs.findIndex((p: any) => p.id === pack.id);
    if (index === -1) packs.push({ id: pack.id, data, updated_at: now });
    else { packs[index].data = data; packs[index].updated_at = now; }
    await setWebData(STORAGE_KEYS.TEMPLATE_PACKS, packs);
    return;
  }

  if (!db) return;
  db.runSync(
    `INSERT INTO template_packs (id, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    [pack.id, data, now]
  );
};

export const listTemplatePacks = async (): Promise<TemplatePack[]> => {
  if (Platform.OS === 'web') {
    const packs = await getWebData<any>(STORAGE_KEYS.TEMPLATE_PACKS);
    return packs.map((p: any) => safeJSONParse<TemplatePack>(p.data, { id: p.id, name: '', description: '', genre: [], previewImageUrl: '' }, 'templatePack'));
  }

  if (!db) return [];
  try {
    const rows = db.getAllSync('SELECT data FROM template_packs ORDER BY updated_at DESC') as any[];
    return rows.map(row => safeJSONParse<TemplatePack>(row.data, { id: '', name: '', description: '', genre: [] }, 'templatePack'));
  } catch (e) {
    return [];
  }
};

export const updateProject = async (id: string, patch: Partial<{ title: string; cover: string | null; shortDescription: string; longDescription: any[]; tags: string[]; bookmarked?: boolean; subscribed?: boolean; status?: string }>): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      const projects = await getWebData<any>(STORAGE_KEYS.PROJECTS);
      const index = projects.findIndex((p: any) => p.id === id);
      if (index === -1) {
        let tagsValue = patch.tags || [];
        if (typeof tagsValue === 'string') {
          try {
            const parsed = JSON.parse(tagsValue);
            tagsValue = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.warn('[updateProject] Failed to parse tags, using empty array');
            tagsValue = [];
          }
        }
        if (!Array.isArray(tagsValue)) tagsValue = [];
        
        let longDescValue = patch.longDescription || [];
        if (typeof longDescValue === 'string') {
          try {
            const parsed = JSON.parse(longDescValue);
            longDescValue = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.warn('[updateProject] Failed to parse longDescription, using empty array');
            longDescValue = [];
          }
        }
        if (!Array.isArray(longDescValue)) longDescValue = [];
        
        const newProject = {
          id,
          title: patch.title || 'Untitled',
          cover_url: patch.cover !== undefined ? patch.cover : null,
          tags: tagsValue,
          short_description: patch.shortDescription || '',
          long_description: longDescValue,
          creator_id: '1',
          updated_at: new Date().toISOString(),
          bookmarked: patch.bookmarked === true ? 1 : 0,
          subscribed: patch.subscribed === true ? 1 : 0
        };
        projects.push(newProject);
        await setWebData(STORAGE_KEYS.PROJECTS, projects);
        console.log('Project created (web):', { id, bookmarked: newProject.bookmarked, subscribed: newProject.subscribed });
        return;
      }
      
      const project = projects[index];
      if (patch.title !== undefined) project.title = patch.title;
      if (patch.cover !== undefined) project.cover_url = patch.cover;
      if (patch.shortDescription !== undefined) project.short_description = patch.shortDescription;
      if (patch.longDescription !== undefined) {
        let longDescValue = patch.longDescription;
        if (typeof longDescValue === 'string') {
          try {
            const parsed = JSON.parse(longDescValue);
            longDescValue = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.warn('[updateProject] Failed to parse longDescription, using empty array');
            longDescValue = [];
          }
        }
        if (!Array.isArray(longDescValue)) longDescValue = [];
        project.long_description = longDescValue;
      }
      if (patch.tags !== undefined) {
        let tagsValue = patch.tags;
        if (typeof tagsValue === 'string') {
          try {
            const parsed = JSON.parse(tagsValue);
            tagsValue = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.warn('[updateProject] Failed to parse tags, using empty array');
            tagsValue = [];
          }
        }
        if (!Array.isArray(tagsValue)) tagsValue = [];
        project.tags = tagsValue;
      }
      if (patch.bookmarked !== undefined) {
        project.bookmarked = patch.bookmarked === true ? 1 : 0;
      }
      if (patch.subscribed !== undefined) {
        project.subscribed = patch.subscribed === true ? 1 : 0;
      }
      if (patch.status !== undefined) project.status = patch.status;
      project.updated_at = new Date().toISOString();
      
      const sanitizedProjects = projects.map(p => {
        const sanitized: any = {};
        
        for (const key in p) {
          if (key === 'tags') {
            sanitized.tags = Array.isArray(p.tags) ? p.tags : [];
          } else if (key === 'long_description') {
            sanitized.long_description = Array.isArray(p.long_description) ? p.long_description : [];
          } else if (key === 'bookmarked') {
            sanitized.bookmarked = typeof p.bookmarked === 'number' ? p.bookmarked : (p.bookmarked ? 1 : 0);
          } else if (key === 'subscribed') {
            sanitized.subscribed = typeof p.subscribed === 'number' ? p.subscribed : (p.subscribed ? 1 : 0);
          } else {
            sanitized[key] = p[key];
          }
        }
        
        return sanitized;
      });
      await setWebData(STORAGE_KEYS.PROJECTS, sanitizedProjects);
      console.log('Project updated (web):', { id, bookmarked: project.bookmarked, subscribed: project.subscribed });
      return;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[updateProject] Error updating project (web):', errorMsg);
      throw new Error(`Failed to update project: ${errorMsg}`);
    }
  }

  if (!db) throw new Error('Database not initialized');
  
  const existingProject = db.getFirstSync('SELECT * FROM projects WHERE id = ?', [id]) as any;
  
  if (!existingProject) {
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO projects (id, title, cover_url, tags, short_description, long_description, creator_id, updated_at, bookmarked, subscribed) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        patch.title || 'Untitled',
        patch.cover || null,
        JSON.stringify(patch.tags || []),
        patch.shortDescription || '',
        JSON.stringify(patch.longDescription || []),
        '1',
        now,
        patch.bookmarked ? 1 : 0,
        patch.subscribed ? 1 : 0
      ]
    );
    console.log('Project created:', { id, patch });
    return;
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (patch.title !== undefined) {
    updates.push('title = ?');
    values.push(patch.title);
  }
  if (patch.cover !== undefined) {
    updates.push('cover_url = ?');
    values.push(patch.cover);
  }
  if (patch.shortDescription !== undefined) {
    updates.push('short_description = ?');
    values.push(patch.shortDescription);
  }
  if (patch.longDescription !== undefined) {
    updates.push('long_description = ?');
    values.push(JSON.stringify(patch.longDescription));
  }
  if (patch.tags !== undefined) {
    updates.push('tags = ?');
    values.push(JSON.stringify(patch.tags));
  }
  if (patch.bookmarked !== undefined) {
    updates.push('bookmarked = ?');
    values.push(patch.bookmarked ? 1 : 0);
  }
  if (patch.subscribed !== undefined) {
    updates.push('subscribed = ?');
    values.push(patch.subscribed ? 1 : 0);
  }
  if (patch.status !== undefined) {
    updates.push('status = ?');
    values.push(patch.status);
  }
  
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  
  if (updates.length === 0) return;
  
  values.push(id);
  
  try {
    db.runSync(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    console.log('Project updated:', { id, patch });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const listProjects = async (): Promise<{
  id: string;
  title: string;
  cover_url: string | null;
  tags: string[];
  short_description: string | null;
  long_description: any[];
  creator_id: string | null;
  updated_at: string;
  chapter_count_published: number;
  chapter_count_all: number;
  status?: string;
}[]> => {
  if (Platform.OS === 'web') {
    const projects = await getWebData<any>(STORAGE_KEYS.PROJECTS);
    const chapters = await getWebData<any>(STORAGE_KEYS.CHAPTERS);
    
    return projects
      .filter((p: any) => !p.status || p.status !== 'TRASHED')
      .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .map((project: any) => {
        const projectChapters = chapters.filter((c: any) => c.project_id === project.id);
        const publishedCount = projectChapters.filter((c: any) => c.status === 'PUBLISHED').length;
        
        const tags = Array.isArray(project.tags) ? project.tags : safeJSONParse(project.tags, [], 'tags');
        const longDescription = Array.isArray(project.long_description) ? project.long_description : safeJSONParse(project.long_description, [], 'long_description');
        
        return {
          id: project.id,
          title: project.title,
          cover_url: project.cover_url,
          tags,
          short_description: project.short_description,
          long_description: longDescription,
          creator_id: project.creator_id,
          updated_at: project.updated_at,
          chapter_count_published: publishedCount,
          chapter_count_all: projectChapters.length,
          status: project.status
        };
      });
  }

  if (!db) return [];
  
  try {
    const rows = db.getAllSync(`
      SELECT 
        p.*,
        COALESCE(published.count, 0) as chapter_count_published,
        COALESCE(all_chapters.count, 0) as chapter_count_all
      FROM projects p
      LEFT JOIN (
        SELECT project_id, COUNT(*) as count 
        FROM chapters 
        WHERE status = 'PUBLISHED' 
        GROUP BY project_id
      ) published ON p.id = published.project_id
      LEFT JOIN (
        SELECT project_id, COUNT(*) as count 
        FROM chapters 
        GROUP BY project_id
      ) all_chapters ON p.id = all_chapters.project_id
      WHERE p.status IS NULL OR p.status != 'TRASHED'
      ORDER BY p.updated_at DESC
    `) as any[];
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      cover_url: row.cover_url,
      tags: safeJSONParse(row.tags, [], 'tags'),
      short_description: row.short_description,
      long_description: safeJSONParse(row.long_description, [], 'long_description'),
      creator_id: row.creator_id,
      updated_at: row.updated_at,
      chapter_count_published: row.chapter_count_published,
      chapter_count_all: row.chapter_count_all,
      status: row.status
    }));
  } catch (error) {
    console.error('Error listing projects:', error);
    return [];
  }
};

// Custom Bubble operations
export const createCustomBubble = async (projectId: string, data: { name: string; imageUrl: string; capInsets: { top: number; left: number; bottom: number; right: number }; tintable: boolean }): Promise<{ id: string }> => {
  const id = `bubble-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  if (Platform.OS === 'web') {
    const bubbles = await getWebData<any>(STORAGE_KEYS.CUSTOM_BUBBLES);
    bubbles.push({
      id,
      project_id: projectId,
      name: data.name,
      image_url: data.imageUrl,
      cap_insets: JSON.stringify(data.capInsets),
      tintable: data.tintable ? 1 : 0,
      created_at: now,
      updated_at: now
    });
    await setWebData(STORAGE_KEYS.CUSTOM_BUBBLES, bubbles);
    await touchProject(projectId);
    console.log('Custom bubble created (web):', { id, name: data.name });
    return { id };
  }

  if (!db) throw new Error('Database not initialized');
  
  try {
    db.runSync(
      `INSERT INTO custom_bubbles (id, project_id, name, image_url, cap_insets, tintable, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, projectId, data.name, data.imageUrl, JSON.stringify(data.capInsets), data.tintable ? 1 : 0, now, now]
    );
    
    await touchProject(projectId);
    console.log('Custom bubble created:', { id, name: data.name });
    return { id };
  } catch (error) {
    console.error('Error creating custom bubble:', error);
    throw error;
  }
};

export const updateCustomBubble = async (id: string, patch: Partial<{ name: string; imageUrl: string; capInsets: { top: number; left: number; bottom: number; right: number }; tintable: boolean }>): Promise<void> => {
  const now = new Date().toISOString();
  
  if (Platform.OS === 'web') {
    const bubbles = await getWebData<any>(STORAGE_KEYS.CUSTOM_BUBBLES);
    const index = bubbles.findIndex((b: any) => b.id === id);
    if (index === -1) throw new Error('Custom bubble not found');
    
    const bubble = bubbles[index];
    if (patch.name !== undefined) bubble.name = patch.name;
    if (patch.imageUrl !== undefined) bubble.image_url = patch.imageUrl;
    if (patch.capInsets !== undefined) bubble.cap_insets = JSON.stringify(patch.capInsets);
    if (patch.tintable !== undefined) bubble.tintable = patch.tintable ? 1 : 0;
    bubble.updated_at = now;
    
    await setWebData(STORAGE_KEYS.CUSTOM_BUBBLES, bubbles);
    await touchProject(bubble.project_id);
    console.log('Custom bubble updated (web):', { id, patch });
    return;
  }

  if (!db) throw new Error('Database not initialized');
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (patch.name !== undefined) {
    updates.push('name = ?');
    values.push(patch.name);
  }
  if (patch.imageUrl !== undefined) {
    updates.push('image_url = ?');
    values.push(patch.imageUrl);
  }
  if (patch.capInsets !== undefined) {
    updates.push('cap_insets = ?');
    values.push(JSON.stringify(patch.capInsets));
  }
  if (patch.tintable !== undefined) {
    updates.push('tintable = ?');
    values.push(patch.tintable ? 1 : 0);
  }
  
  updates.push('updated_at = ?');
  values.push(now);
  
  if (updates.length === 0) return;
  
  values.push(id);
  
  try {
    db.runSync(
      `UPDATE custom_bubbles SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const bubble = db.getFirstSync('SELECT project_id FROM custom_bubbles WHERE id = ?', [id]) as any;
    if (bubble?.project_id) {
      await touchProject(bubble.project_id);
    }
    
    console.log('Custom bubble updated:', { id, patch });
  } catch (error) {
    console.error('Error updating custom bubble:', error);
    throw error;
  }
};

export const deleteCustomBubble = async (id: string): Promise<void> => {
  if (Platform.OS === 'web') {
    const bubbles = await getWebData<any>(STORAGE_KEYS.CUSTOM_BUBBLES);
    const index = bubbles.findIndex((b: any) => b.id === id);
    if (index === -1) throw new Error('Custom bubble not found');
    
    const bubble = bubbles[index];
    bubbles.splice(index, 1);
    
    await setWebData(STORAGE_KEYS.CUSTOM_BUBBLES, bubbles);
    await touchProject(bubble.project_id);
    console.log('Custom bubble deleted (web):', { id });
    return;
  }

  if (!db) throw new Error('Database not initialized');
  
  try {
    const bubble = db.getFirstSync('SELECT project_id FROM custom_bubbles WHERE id = ?', [id]) as any;
    
    db.runSync('DELETE FROM custom_bubbles WHERE id = ?', [id]);
    
    if (bubble?.project_id) {
      await touchProject(bubble.project_id);
    }
    
    console.log('Custom bubble deleted:', { id });
  } catch (error) {
    console.error('Error deleting custom bubble:', error);
    throw error;
  }
};

export const listCustomBubbles = async (projectId: string): Promise<CustomBubble[]> => {
  if (Platform.OS === 'web') {
    const bubbles = await getWebData<any>(STORAGE_KEYS.CUSTOM_BUBBLES);
    return bubbles
      .filter((b: any) => b.project_id === projectId)
      .map((row: any) => ({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        imageUrl: row.image_url,
        capInsets: safeJSONParse(row.cap_insets, { top: 20, left: 20, bottom: 20, right: 20 }, 'capInsets'),
        tintable: row.tintable === 1,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString()
      }));
  }

  if (!db) return [];
  
  try {
    const rows = db.getAllSync(
      `SELECT * FROM custom_bubbles WHERE project_id = ? ORDER BY created_at DESC`,
      [projectId]
    ) as any[];
    
    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      imageUrl: row.image_url,
      capInsets: safeJSONParse(row.cap_insets, { top: 20, left: 20, bottom: 20, right: 20 }, 'capInsets'),
      tintable: row.tintable === 1,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error listing custom bubbles:', error);
    return [];
  }
};
// ---- Broadcast stubs (v4: broadcast data stored on project) ----

export const getBroadcastData = async (projectId: string): Promise<{ coverUrl?: string; shortDesc?: string; tags?: string[]; queue: string[] } | null> => {
  const project = await getProject(projectId);
  if (!project) return null;
  return project.broadcast ?? { queue: [] };
};

export const updateBroadcastData = async (projectId: string, data: Partial<{ coverUrl: string; shortDesc: string; tags: string[]; queue: string[]; onAirSnapshot: unknown; pricing: string }>): Promise<void> => {
  // No-op stub — broadcast data not yet persisted in v4 schema
  console.log('[updateBroadcastData] stub called with', { projectId, data });
};

export const addChapterToBroadcastQueue = async (projectId: string, chapterId: string): Promise<void> => {
  console.log('[addChapterToBroadcastQueue] stub called with', { projectId, chapterId });
};
