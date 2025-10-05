import AsyncStorage from './async-storage';

export type Block = { id: string; type: 'text' | 'image' | 'BG'; content: string; order: number; spacing?: number; [k: string]: any };
export type Chapter = {
  id: string;
  projectId: string;
  title: string;
  afterNote?: string;
  status: 'DRAFT' | 'PUBLISHED';
  blocks: Block[];
  globalSpacing?: number;
  updatedAt: number;
};

const KEY = 'chaptrr.chapters.v1';

async function _read(): Promise<Chapter[]> {
  const s = await AsyncStorage.getItem(KEY);
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing chapters from storage:', error);
    return [];
  }
}

async function _write(arr: Chapter[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(arr));
}

export async function upsertChapter(ch: Partial<Chapter> & { projectId: string }): Promise<Chapter> {
  const arr = await _read();
  const now = Date.now();
  let c: Chapter;
  if (ch.id) {
    const i = arr.findIndex(x => x.id === ch.id);
    c = {
      ...(arr[i] ?? { id: ch.id, projectId: ch.projectId, title: '', status: 'DRAFT', blocks: [], updatedAt: now }),
      ...ch,
      updatedAt: now
    } as Chapter;
    if (i >= 0) arr[i] = c;
    else arr.push(c);
  } else {
    const id = Math.random().toString(36).slice(2, 10);
    c = { id, title: '', status: 'DRAFT', blocks: [], updatedAt: now, ...ch } as Chapter;
    arr.push(c);
  }
  await _write(arr);
  return c;
}

export async function setChapterStatus(id: string, status: 'DRAFT' | 'PUBLISHED') {
  const arr = await _read();
  const i = arr.findIndex(x => x.id === id);
  if (i < 0) throw new Error('chapter_not_found');
  arr[i] = { ...arr[i], status, updatedAt: Date.now() };
  await _write(arr);
}

export async function listChaptersByProject(projectId: string) {
  const arr = await _read();
  return arr.filter(x => x.projectId === projectId);
}