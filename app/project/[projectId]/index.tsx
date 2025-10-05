import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ToastAndroid,
  Platform,
} from 'react-native';
import SafeImage from '@/ui/SafeImage';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Play, Clock, Eye, Heart, BookMarked, Bookmark } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app-store';
import { RichBlock, Chapter as ProjectChapter } from '@/types';
import { listChaptersByProject, Chapter as StoredChapter } from '@/lib/persist';
import { getProject, updateProject } from '@/lib/database';

interface RichContentBlockProps {
  block: RichBlock;
}

function RichContentBlock({ block }: RichContentBlockProps) {
  if (block.type === 'text') {
    const getFontSize = (font?: string) => {
      switch (font) {
        case 'FontA': return 20;
        case 'FontB': return 16;
        case 'FontC': return 14;
        default: return 16;
      }
    };

    const getFontWeight = (font?: string) => {
      switch (font) {
        case 'FontA': return '700' as const;
        case 'FontB': return '400' as const;
        case 'FontC': return '400' as const;
        default: return '400' as const;
      }
    };

    return (
      <Text style={[
        styles.richText,
        {
          fontSize: getFontSize(block.font),
          fontWeight: getFontWeight(block.font),
          color: block.color || '#ccc'
        }
      ]}>
        {block.content}
      </Text>
    );
  }

  if (block.type === 'image') {
    return (
      <SafeImage 
        uri={block.url} 
        style={styles.richImage}
        resizeMode="cover"
        fallback={<View style={[styles.richImage, { backgroundColor: '#333' }]} />}
      />
    );
  }

  return null;
}

export default function PublicProjectScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const insets = useSafeAreaInsets();
  const { projects, likedProjects, toggleLike, setCurrentProject, setCurrentChapterIndex } = useAppStore();
  const [storedChapters, setStoredChapters] = useState<StoredChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return;
      try {
        console.log('[PublicProject] Loading data for project:', projectId);
        const chapters = await listChaptersByProject(projectId);
        console.log('[PublicProject] Loaded chapters:', chapters.length);
        setStoredChapters(chapters);
        
        const projectData = await getProject(projectId);
        if (projectData) {
          setIsBookmarked(projectData.bookmarked || false);
          setIsSubscribed(projectData.subscribed || false);
        }
      } catch (error) {
        console.warn('[PublicProject] Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [projectId]);

  // Find the project from mock data
  const project = projects.find(p => p.id === projectId);
  
  // Merge stored chapters with project, only show published chapters
  const publishedStoredChapters = storedChapters.filter(ch => ch.status === 'PUBLISHED');
  
  const publicProject = project ? {
    ...project,
    chapters: publishedStoredChapters.length > 0 
      ? publishedStoredChapters.map((ch, index): ProjectChapter => ({
          id: ch.id,
          title: ch.title,
          order: index + 1,
          projectId: ch.projectId,
          blocks: ch.blocks,
          readTime: Math.max(1, Math.floor(ch.blocks.length * 0.5)),
          status: ch.status === 'PUBLISHED' ? 'published' : 'draft',
          version: 1,
          createdAt: new Date(ch.updatedAt).toISOString(),
          updatedAt: new Date(ch.updatedAt).toISOString(),
          characterAppearances: [],
          globalSpacing: ch.globalSpacing,
          afterNote: ch.afterNote
        }))
      : project.chapters.filter(chapter => chapter.status === 'published')
  } : null;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Loading preview...</Text>
        </View>
      </View>
    );
  }

  if (!publicProject) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Project not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalReadTime = publicProject.chapters.reduce((sum, chapter) => sum + chapter.readTime, 0);
  const isLiked = likedProjects.has(publicProject.id);

  const handleStartReading = () => {
    setCurrentProject(publicProject);
    setCurrentChapterIndex(0);
    router.push('/reader');
  };

  const handleChapterPress = (chapterIndex: number) => {
    setCurrentProject(publicProject);
    setCurrentChapterIndex(chapterIndex);
    router.push('/reader');
  };

  const handleToggleBookmark = async () => {
    if (!projectId) return;
    try {
      const newBookmarked = !isBookmarked;
      await updateProject(projectId, { bookmarked: newBookmarked });
      setIsBookmarked(newBookmarked);
      const message = newBookmarked ? 'Added to Bookmarks' : 'Removed from Bookmarks';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Alert.alert(message);
      }
      console.log('[Bookmark] Updated:', { projectId, bookmarked: newBookmarked });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update bookmark';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!projectId) return;
    try {
      const newSubscribed = !isSubscribed;
      await updateProject(projectId, { subscribed: newSubscribed });
      setIsSubscribed(newSubscribed);
      const message = newSubscribed ? 'Subscribed to updates' : 'Unsubscribed';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Alert.alert(message);
      }
      console.log('[Subscribe] Updated:', { projectId, subscribed: newSubscribed });
    } catch (error) {
      console.error('Error toggling subscribe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update subscription';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.projectHeader}>
          <SafeImage 
            uri={publicProject.cover} 
            style={styles.coverImage}
            resizeMode="cover"
            fallback={<View style={[styles.coverImage, { backgroundColor: '#333' }]} />}
          />
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          
          <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.creatorInfo}
              onPress={() => router.push(`/author/${publicProject.creator.id}` as any)}
            >
              <SafeImage 
                uri={publicProject.creator.avatar} 
                style={styles.avatar}
                resizeMode="cover"
                fallback={<View style={[styles.avatar, { backgroundColor: '#666' }]} />}
              />
              <View>
                <Text style={styles.creatorName}>{publicProject.creator.name}</Text>
                <Text style={styles.followers}>
                  {publicProject.creator.followers.toLocaleString()} followers
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.title}>{publicProject.title}</Text>
            
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Eye size={16} color="#ccc" />
                <Text style={styles.statText}>{publicProject.stats.views.toLocaleString()}</Text>
              </View>
              <View style={styles.stat}>
                <Clock size={16} color="#ccc" />
                <Text style={styles.statText}>{totalReadTime}m read</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statText}>{publicProject.chapters.length} chapters</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={async () => {
                  toggleLike(publicProject.id);
                  if (!projectId) return;
                  try {
                    const newLiked = !isLiked;
                    const message = newLiked ? 'Added to Favorites' : 'Removed from Favorites';
                    if (Platform.OS === 'android') {
                      ToastAndroid.show(message, ToastAndroid.SHORT);
                    } else {
                      Alert.alert(message);
                    }
                    console.log('[Favorite] Updated:', { projectId, liked: newLiked });
                  } catch (error) {
                    console.error('Error toggling favorite:', error);
                  }
                }}
              >
                <Heart 
                  size={20} 
                  color={isLiked ? "#ff3040" : "#fff"} 
                  fill={isLiked ? "#ff3040" : "transparent"}
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleToggleSubscribe}>
                <BookMarked 
                  size={20} 
                  color={isSubscribed ? "#6366f1" : "#fff"}
                  fill={isSubscribed ? "#6366f1" : "transparent"}
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleToggleBookmark}>
                <Bookmark 
                  size={20} 
                  color={isBookmarked ? "#f59e0b" : "#fff"}
                  fill={isBookmarked ? "#f59e0b" : "transparent"}
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.startButton} onPress={handleStartReading}>
                <Play size={20} color="#000" />
                <Text style={styles.startButtonText}>Start Reading</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{publicProject.shortDescription || publicProject.description}</Text>
          </View>

          {/* Long Description Section */}
          {publicProject.longDescription && publicProject.longDescription.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Story Details</Text>
              <View style={styles.longDescription}>
                {publicProject.longDescription.map((block, index) => (
                  <RichContentBlock key={`rich-${index}`} block={block} />
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tags}>
              {publicProject.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chapters ({publicProject.chapters.length})</Text>
            {publicProject.chapters.map((chapter, index) => (
              <TouchableOpacity
                key={chapter.id}
                style={styles.chapterItem}
                onPress={() => handleChapterPress(index)}
              >
                <View style={styles.chapterNumber}>
                  <Text style={styles.chapterNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.chapterInfo}>
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                  <Text style={styles.chapterMeta}>
                    {chapter.readTime}m read • {chapter.blocks.length} panels
                  </Text>
                </View>
                <Play size={16} color="#6366f1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
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
  scrollView: {
    flex: 1,
  },
  projectHeader: {
    height: 400,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  backIcon: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  headerContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  creatorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  followers: {
    color: '#ccc',
    fontSize: 14,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 34,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
  },
  longDescription: {
    gap: 16,
  },
  richText: {
    lineHeight: 24,
  },
  richImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginVertical: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  chapterNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chapterNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chapterMeta: {
    color: '#ccc',
    fontSize: 14,
  },

});