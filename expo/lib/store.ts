import AsyncStorage from './async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Chapter } from '@/types';

const STORAGE_KEYS = {
  CHAPTERS: 'chaptrr.chapters'
};

export interface StoredChapter {
  id: string;
  projectId: string;
  title: string;
  afterNote: string;
  status: 'DRAFT' | 'PUBLISHED';
  blocks: any[];
  updatedAt: string;
}

export const getChapters = async (): Promise<StoredChapter[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHAPTERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting chapters:', error);
    return [];
  }
};

export const setChapters = async (chapters: StoredChapter[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
  } catch (error) {
    console.error('Error setting chapters:', error);
    throw error;
  }
};

export const upsertChapter = async (chapterData: Partial<StoredChapter> & { projectId: string }): Promise<StoredChapter> => {
  try {
    const chapters = await getChapters();
    const now = new Date().toISOString();
    
    let chapter: StoredChapter;
    
    if (chapterData.id) {
      // Update existing
      const index = chapters.findIndex(c => c.id === chapterData.id);
      if (index === -1) {
        throw new Error('Chapter not found');
      }
      
      chapter = {
        ...chapters[index],
        ...chapterData,
        updatedAt: now
      };
      chapters[index] = chapter;
    } else {
      // Create new
      chapter = {
        id: uuidv4(),
        projectId: chapterData.projectId,
        title: chapterData.title || 'Untitled Chapter',
        afterNote: chapterData.afterNote || '',
        status: chapterData.status || 'DRAFT',
        blocks: chapterData.blocks || [],
        updatedAt: now
      };
      chapters.push(chapter);
    }
    
    await setChapters(chapters);
    console.log('Chapter upserted:', { id: chapter.id, title: chapter.title, status: chapter.status });
    return chapter;
  } catch (error) {
    console.error('Error upserting chapter:', error);
    throw error;
  }
};

export const setChapterStatus = async (id: string, status: 'DRAFT' | 'PUBLISHED'): Promise<void> => {
  try {
    const chapters = await getChapters();
    const index = chapters.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new Error('Chapter not found');
    }
    
    chapters[index].status = status;
    chapters[index].updatedAt = new Date().toISOString();
    
    await setChapters(chapters);
    console.log('Chapter status updated:', { id, status });
  } catch (error) {
    console.error('Error setting chapter status:', error);
    throw error;
  }
};

export const listChaptersByProject = async (projectId: string): Promise<StoredChapter[]> => {
  try {
    const chapters = await getChapters();
    return chapters
      .filter(c => c.projectId === projectId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error('Error listing chapters by project:', error);
    return [];
  }
};
