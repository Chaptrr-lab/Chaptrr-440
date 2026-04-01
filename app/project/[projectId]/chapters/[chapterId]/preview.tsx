import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import { ArrowLeft, ArrowUp, Heart, Bookmark } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChapterReader } from '@/components/reader/ChapterReader';


import { getChapter, getProject, listCharacters } from '@/lib/database';
import { listChaptersByProject } from '@/lib/persist';
import { isProjectAuthor } from '@/lib/auth';
import { Character, Chapter, Project } from '@/types';



export default function ChapterPreviewScreen() {
  const { projectId, chapterId } = useLocalSearchParams<{ 
    projectId: string; 
    chapterId: string; 
  }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadData = async () => {
      if (!projectId || !chapterId) return;

      try {
        console.log('Loading preview for chapter:', chapterId, 'project:', projectId);
        
        // Check if user is project author
        const authorCheck = await isProjectAuthor(projectId);
        setIsAuthor(authorCheck);

        if (!authorCheck) {
          console.log('User is not author, redirecting');
          router.replace('/');
          return;
        }

        // Load project data first
        const projectData = await getProject(projectId);
        console.log('Project loaded:', projectData?.title);
        
        if (!projectData) {
          console.error('Project not found');
          setLoading(false);
          return;
        }
        
        // Try to find chapter in project's chapters array first
        let chapterData: Chapter | null = projectData.chapters?.find(ch => ch.id === chapterId) || null;
        console.log('Chapter found in project:', chapterData?.title);
        
        // If not found in project, try database
        if (!chapterData) {
          chapterData = await getChapter(chapterId);
          console.log('Chapter loaded from database:', chapterData?.title);
        }
        
        // If still not found, try persist store
        if (!chapterData) {
          try {
            const persistedChapters = await listChaptersByProject(projectId);
            const persistedChapter = persistedChapters.find(ch => ch.id === chapterId);
            console.log('Persisted chapter found:', persistedChapter?.title);
            
            if (persistedChapter) {
              // Convert persisted chapter to match Chapter interface
              const flatBlocks = (persistedChapter.blocks || []).map((block: any, index: number) => ({
                id: block.id || `block-${index}`,
                type: block.type as 'text' | 'image' | 'BG',
                content: block.content || '',
                order: block.order ?? index,
                spacing: Number(block.spacing) || 0,
                textStyle: block.textStyle,
                imageStyle: block.imageStyle,
                backgroundStyle: block.backgroundStyle
              }));
              chapterData = {
                id: persistedChapter.id,
                projectId: persistedChapter.projectId,
                title: persistedChapter.title,
                order: 0,
                scenes: [{ id: 'default', order: 0, blocks: flatBlocks }],
                live: false,
                editedSinceLive: true,
                readTime: Math.ceil(flatBlocks.length * 0.5),
                version: 1,
                createdAt: new Date(persistedChapter.updatedAt).toISOString(),
                updatedAt: new Date(persistedChapter.updatedAt).toISOString(),
                characterAppearances: [],
                globalSpacing: (persistedChapter as any).globalSpacing || 0,
                afterNote: persistedChapter.afterNote || '',
              };
            }
          } catch (error) {
            console.log('Error loading from persist store:', error);
          }
        }
        
        const charactersData = await listCharacters(projectId);
        console.log('Characters loaded:', charactersData.length);

        setChapter(chapterData);
        setProject(projectData);
        setCharacters(charactersData);
      } catch (error) {
        console.error('Error loading preview data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, chapterId]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 200);
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading preview...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthor) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Preview not available</Text>
          <Text style={styles.errorSubtext}>Only the author can preview unpublished chapters</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!chapter || !project) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Chapter not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Preview Banner */}
      <View style={styles.previewBanner}>
        <Text style={styles.previewBannerText}>
          Preview — {chapter.live ? 'Published' : 'Unpublished'} (Only you can see this)
        </Text>
      </View>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.chapterTitle} numberOfLines={1}>
            {chapter.title}
          </Text>
          <Text style={styles.chapterMeta}>
            Preview Mode • {chapter.readTime}m read
          </Text>
        </View>

        {/* Disabled action buttons in preview mode */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerActionButton, styles.disabledButton]} 
            disabled={true}
          >
            <Bookmark 
              size={20} 
              color="#666"
              fill="transparent"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.headerActionButton, styles.disabledButton]} 
            disabled={true}
          >
            <Heart 
              size={20} 
              color="#666"
              fill="transparent"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.chapterContent}>
          <Text style={styles.chapterTitleLarge}>{chapter.title}</Text>
          
          <ChapterReader
            chapter={chapter}
            characters={characters}
            globalSpacing={chapter.globalSpacing ?? 0}
          />
          
          {chapter.afterNote && (
            <View style={styles.afterNoteContainer}>
              <Text style={styles.afterNoteTitle}>Author's Note</Text>
              <Text style={styles.afterNoteText}>{chapter.afterNote}</Text>
            </View>
          )}
        </View>

        <View style={styles.previewFooter}>
          <Text style={styles.previewFooterTitle}>End of Preview</Text>
          <Text style={styles.previewFooterText}>
            This is how your chapter will appear to readers when published.
          </Text>
          <TouchableOpacity style={styles.backToEditorButton} onPress={() => router.back()}>
            <Text style={styles.backToEditorButtonText}>Back to Editor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
          <ArrowUp size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  previewBanner: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  previewBannerText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  chapterTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chapterMeta: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  chapterContent: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  chapterTitleLarge: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 32,
    lineHeight: 36,
  },
  textBlock: {
    marginBottom: 24,
    width: '100%',
  },
  textContent: {
    color: '#e5e5e5',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  characterName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.8,
  },

  previewFooter: {
    alignItems: 'center',
    padding: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewFooterTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  previewFooterText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  backToEditorButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backToEditorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.3,
  },
  afterNoteContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  afterNoteTitle: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  afterNoteText: {
    color: '#e5e5e5',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },

});