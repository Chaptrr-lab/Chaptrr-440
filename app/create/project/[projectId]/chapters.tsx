import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
  PanResponder,
} from 'react-native';
import { ArrowLeft, Plus, Edit3, Users, MoreVertical, Eye, Radio, Upload, Trash2, Image as ImageIcon } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listChapters, createChapter, updateChapterBlocks, getProject, updateProject } from '@/lib/database';
import { Chapter, Block, Project } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

interface ChapterCardProps {
  chapter: Chapter;
  index: number;
  projectId: string;
  onPress: () => void;
  onBroadcast: () => void;
  onTrash: () => void;
}

function ChapterCard({ chapter, index, projectId, onPress, onBroadcast, onTrash }: ChapterCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { activeTheme } = useTheme();
  const statusBadgeColor = chapter.live ? '#10b981' : '#666';
  const statusText = chapter.live ? 'PUBLISHED' : 'DRAFT';
  const [translateX] = useState(new Animated.Value(0));

  const handlePreview = () => {
    setShowMenu(false);
    router.push(`/project/${projectId}/chapters/${chapter.id}/preview`);
  };

  const SWIPE_THRESHOLD = 80;
  
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        const resistance = Math.abs(gestureState.dx) < 40 ? 0.15 : 0.73;
        const adjustedDx = gestureState.dx < -40 ? -40 + (gestureState.dx + 40) * 0.73 : gestureState.dx * resistance;
        translateX.setValue(Math.max(adjustedDx, -SWIPE_THRESHOLD * 0.73));
      } else if (gestureState.dx > 0) {
        const resistance = Math.abs(gestureState.dx) < 40 ? 0.15 : 0.73;
        const adjustedDx = gestureState.dx > 40 ? 40 + (gestureState.dx - 40) * 0.73 : gestureState.dx * resistance;
        translateX.setValue(Math.min(adjustedDx, SWIPE_THRESHOLD * 0.73));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -100) {
        Animated.spring(translateX, {
          toValue: -SWIPE_THRESHOLD * 0.73,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();
      } else if (gestureState.dx > 100) {
        Animated.spring(translateX, {
          toValue: SWIPE_THRESHOLD * 0.73,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();
      }
    },
  });

  const handleBroadcastPress = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    onBroadcast();
  };

  const handleTrashPress = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    onTrash();
  };

  return (
    <View style={styles.chapterCard}>
      <View style={[styles.swipeActionLeft, { backgroundColor: '#ef4444' }]}>
        <TouchableOpacity 
          style={styles.swipeActionButton}
          onPress={handleTrashPress}
          activeOpacity={0.9}
        >
          <Trash2 size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.swipeActionRight, { backgroundColor: '#f59e0b' }]}>
        <TouchableOpacity 
          style={styles.swipeActionButton}
          onPress={handleBroadcastPress}
          activeOpacity={0.9}
        >
          <Radio size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <Animated.View 
        style={[styles.chapterCardAnimated, { backgroundColor: activeTheme.colors.card, transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.chapterCardContent} onPress={onPress}>
          <View style={styles.chapterNumber}>
            <Text style={styles.chapterNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.chapterInfo}>
            <Text style={[styles.chapterTitle, { color: activeTheme.colors.text.primary }]}>{chapter.title}</Text>
            <Text style={[styles.chapterMeta, { color: activeTheme.colors.text.secondary }]}>
              {chapter.scenes.reduce((n, s) => n + s.blocks.length, 0)} blocks • {chapter.readTime}m read
            </Text>
            <Text style={[styles.chapterDate, { color: activeTheme.colors.text.muted }]}>
              Last updated: {new Date(chapter.updatedAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.chapterActions}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadgeColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
            <Edit3 size={16} color="#6366f1" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={16} color={activeTheme.colors.text.muted} />
          </TouchableOpacity>
          
          {showMenu && (
            <View style={[styles.menu, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
              <TouchableOpacity style={styles.menuItem} onPress={handlePreview}>
                <Eye size={14} color="#6366f1" />
                <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Preview as Reader</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

export default function ChaptersListScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editCover, setEditCover] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editShortDesc, setEditShortDesc] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const insets = useSafeAreaInsets();
  const { activeTheme } = useTheme();

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (projectId) {
          try {
            const updatedChapters = await listChapters(projectId, { liveOnly: false });
            const filteredChapters = updatedChapters.filter(c => true);
            setChapters(filteredChapters);
            console.log('Chapters refreshed:', filteredChapters.length);
            
            const projectData = await getProject(projectId);
            if (projectData) {
              setProject(projectData);
              setEditCover(projectData.cover || null);
              setEditTitle(projectData.title);
              setEditShortDesc(projectData.shortDescription || '');
              setEditTags(projectData.tags || []);
            }
          } catch (error) {
            console.error('Error loading data:', error);
            setChapters([]);
          }
        }
      };
      loadData();
    }, [projectId])
  );

  if (!projectId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: activeTheme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: activeTheme.colors.text.primary }]}>Project ID not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCreateChapter = () => {
    router.push(`/create/project/${projectId}/chapters/new`);
  };

  const convertTextToBlocks = (text: string): Block[] => {
    const blocks: Block[] = [];
    let order = 0;

    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      const dialogueMatches = trimmed.match(/"([^"]+)"/g);
      
      if (dialogueMatches) {
        let lastIndex = 0;
        const parts: {type: 'text' | 'dialogue', content: string}[] = [];

        for (const match of dialogueMatches) {
          const matchIndex = trimmed.indexOf(match, lastIndex);
          
          if (matchIndex > lastIndex) {
            const beforeText = trimmed.substring(lastIndex, matchIndex).trim();
            if (beforeText) {
              parts.push({ type: 'text', content: beforeText });
            }
          }

          const dialogueText = match.slice(1, -1);
          parts.push({ type: 'dialogue', content: dialogueText });
          lastIndex = matchIndex + match.length;
        }

        if (lastIndex < trimmed.length) {
          const afterText = trimmed.substring(lastIndex).trim();
          if (afterText) {
            parts.push({ type: 'text', content: afterText });
          }
        }

        for (const part of parts) {
          const hasExclamation = part.content.includes('!');
          const bubbleType = part.type === 'dialogue' 
            ? (hasExclamation ? 'shout' : 'dialogue')
            : 'plain';

          blocks.push({
            id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'text',
            content: part.content,
            order: order++,
            spacing: 0,
            textStyle: {
              bubbleType,
              alignment: 'center',
              isBold: false,
              isItalic: false,
            },
          });
        }
      } else {
        blocks.push({
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'text',
          content: trimmed,
          order: order++,
          spacing: 0,
          textStyle: {
            bubbleType: 'plain',
            alignment: 'center',
            isBold: false,
            isItalic: false,
          },
        });
      }
    }

    return blocks;
  };

  const extractChapterTitle = (text: string): string => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return 'Imported Chapter';
    
    const firstLine = lines[0].trim();
    
    const headingPatterns = [
      /^#{1,6}\s+(.+)$/,
      /^Chapter\s+\d+[:\s-]+(.+)$/i,
      /^\d+\.\s+(.+)$/,
    ];
    
    for (const pattern of headingPatterns) {
      const match = firstLine.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine;
    }
    
    return 'Imported Chapter';
  };

  const handleUploadText = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];
      
      if (!file.uri) {
        Alert.alert('Error', 'Failed to read file');
        setIsUploading(false);
        return;
      }

      const response = await fetch(file.uri);
      const arrayBuffer = await response.arrayBuffer();
      
      let text = '';
      try {
        const decoder = new TextDecoder('utf-8');
        text = decoder.decode(arrayBuffer);
      } catch (e) {
        console.error('UTF-8 decode failed, trying latin1:', e);
        const decoder = new TextDecoder('iso-8859-1');
        text = decoder.decode(arrayBuffer);
      }

      if (!text.trim()) {
        Alert.alert('Error', 'The file is empty');
        setIsUploading(false);
        return;
      }

      const chapterTitle = extractChapterTitle(text);
      const blocks = convertTextToBlocks(text);

      if (blocks.length === 0) {
        Alert.alert('Error', 'No content could be extracted from the file');
        setIsUploading(false);
        return;
      }

      const newChapter = await createChapter(projectId, { title: chapterTitle });
      await updateChapterBlocks(newChapter.id, blocks);

      Alert.alert(
        'Success',
        `Imported "${chapterTitle}" with ${blocks.length} blocks`,
        [
          {
            text: 'Edit Now',
            onPress: () => router.push(`/create/project/${projectId}/chapters/${newChapter.id}/edit`),
          },
          { text: 'OK', style: 'cancel' },
        ]
      );

      const updatedChapters = await listChapters(projectId, { liveOnly: false });
      setChapters(updatedChapters);
    } catch (error) {
      console.error('Error uploading text:', error);
      Alert.alert('Error', 'Failed to import text file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChapterPress = (chapterId: string) => {
    router.push(`/create/project/${projectId}/chapters/${chapterId}/edit`);
  };

  const handlePickCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditCover(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking cover:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  const handleUpdateStoryMain = async () => {
    if (!projectId) return;
    
    try {
      setIsSaving(true);
      await updateProject(projectId, {
        title: editTitle,
        cover: editCover,
        shortDescription: editShortDesc,
        tags: editTags,
      });
      
      Alert.alert('Success', 'Story details updated successfully');
      
      const updatedProject = await getProject(projectId);
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      console.error('Error updating story main:', error);
      Alert.alert('Error', 'Failed to update story details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBroadcastChapter = async (_chapterId: string) => {
    Alert.alert('Broadcast', 'Broadcast queue is not available in this version.');
  };

  const handleTrashChapter = async (chapterId: string) => {
    Alert.alert(
      'Move to Trash',
      'Are you sure you want to move this chapter to trash?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              const { updateChapter } = await import('@/lib/database');
              await updateChapter(chapterId, {});
              const updatedChapters = await listChapters(projectId, { liveOnly: false });
              const filteredChapters = updatedChapters.filter(c => true);
              setChapters(filteredChapters);
              Alert.alert('Success', 'Chapter moved to trash');
            } catch (error) {
              console.error('Error trashing chapter:', error);
              Alert.alert('Error', 'Failed to move chapter to trash');
            }
          },
        },
      ]
    );
  };

  // Sort chapters: live first by order, then drafts
  const sortedChapters = [...chapters].sort((a, b) => {
    if (a.live && !b.live) return -1;
    if (!a.live && b.live) return 1;
    return a.order - b.order;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: activeTheme.colors.background }]}>
      <StatusBar barStyle={activeTheme.colors.background === '#000000' ? 'light-content' : 'dark-content'} backgroundColor={activeTheme.colors.background} />
      
      <View style={[styles.header, { borderBottomColor: activeTheme.colors.border }]}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTheme.colors.text.primary }]} numberOfLines={1}>{project?.title || 'Story'}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.charactersButton} 
            onPress={() => router.push(`/create/project/${projectId}/characters`)}
          >
            <Users size={18} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.broadcastButton} 
            onPress={() => router.push(`/studio/${projectId}/broadcast` as any)}
            testID="btnBroadcastRoom"
          >
            <Radio size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.storyMainSection, { backgroundColor: activeTheme.colors.surface }]}>
          <View style={styles.storyMainHeader}>
            <View style={[styles.storyMainHeaderLine, { backgroundColor: activeTheme.colors.accent }]} />
            <Text style={[styles.storyMainTitle, { color: activeTheme.colors.text.primary }]}>STORY DETAILS</Text>
            <View style={[styles.storyMainHeaderLine, { backgroundColor: activeTheme.colors.accent }]} />
          </View>
          
          <TouchableOpacity 
            style={[styles.coverPickerButton, { borderColor: activeTheme.colors.border }]} 
            onPress={handlePickCover}
          >
            <View style={styles.coverPlaceholder}>
              <ImageIcon size={32} color={activeTheme.colors.text.muted} />
              <Text style={[styles.coverPlaceholderText, { color: activeTheme.colors.text.primary, fontWeight: '600' }]}>Upload Cover</Text>
              <Text style={[styles.coverPlaceholderSubtext, { color: activeTheme.colors.text.muted }]}>1080 x 1920</Text>
            </View>
          </TouchableOpacity>
          
          <TextInput
            style={[styles.storyInput, { color: activeTheme.colors.text.primary, backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}
            placeholder="Story Title"
            placeholderTextColor={activeTheme.colors.text.muted}
            value={editTitle}
            onChangeText={setEditTitle}
          />
          
          <TextInput
            style={[styles.storyInput, styles.storyTextArea, { color: activeTheme.colors.text.primary, backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}
            placeholder="Short Description"
            placeholderTextColor={activeTheme.colors.text.muted}
            value={editShortDesc}
            onChangeText={setEditShortDesc}
            multiline
            numberOfLines={3}
          />
          
          <View style={styles.tagsSection}>
            <Text style={[styles.tagsLabel, { color: activeTheme.colors.text.secondary }]}>Tags</Text>
            <View style={styles.tagsContainer}>
              {editTags.map((tag, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.tag, { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: '#6366f1' }]}
                  onPress={() => handleRemoveTag(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                  <Text style={styles.tagRemove}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.tagInput, { color: activeTheme.colors.text.primary, backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}
                placeholder="Add tag"
                placeholderTextColor={activeTheme.colors.text.muted}
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity 
                style={[styles.tagAddButton, { backgroundColor: '#6366f1' }]} 
                onPress={handleAddTag}
              >
                <Plus size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.updateButton, { backgroundColor: '#6366f1' }]} 
            onPress={handleUpdateStoryMain}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update Story Details</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={[styles.chaptersSection, { backgroundColor: activeTheme.colors.background }]}>
          <View style={styles.chaptersSectionHeader}>
            <View style={[styles.chaptersSectionHeaderLine, { backgroundColor: activeTheme.colors.accent }]} />
            <Text style={[styles.chaptersSectionTitle, { color: activeTheme.colors.text.primary }]}>
              CHAPTERS ({chapters.length})
            </Text>
            <View style={[styles.chaptersSectionHeaderLine, { backgroundColor: activeTheme.colors.accent }]} />
          </View>
          <View style={styles.sectionHeader}>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.trashButton} 
                onPress={() => router.push(`/create/project/${projectId}/chapters/trash` as any)}
              >
                <Trash2 size={18} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={handleUploadText}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Upload size={18} color="#6366f1" />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleCreateChapter}
              >
                <Plus size={20} color="#6366f1" />
                <Text style={styles.addButtonText}>Create Chapter</Text>
              </TouchableOpacity>
            </View>
          </View>

          {sortedChapters.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: activeTheme.colors.text.primary }]}>No chapters yet</Text>
              <Text style={[styles.emptyDescription, { color: activeTheme.colors.text.secondary }]}>
                Create your first chapter to start building your story
              </Text>
            </View>
          ) : (
            <View>
              {sortedChapters.map((chapter, index) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  index={index}
                  projectId={projectId}
                  onPress={() => handleChapterPress(chapter.id)}
                  onBroadcast={() => handleBroadcastChapter(chapter.id)}
                  onTrash={() => handleTrashChapter(chapter.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backIcon: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  charactersButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  createButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  broadcastButton: {
    backgroundColor: '#f59e0b',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  trashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  addButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  chapterCard: {
    borderRadius: 12,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    height: 100,
  },
  swipeActionLeft: {
    position: 'absolute',
    left: -2,
    top: 1,
    bottom: 1,
    width: 82,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 16,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  swipeActionRight: {
    position: 'absolute',
    right: -2,
    top: 1,
    bottom: 1,
    width: 82,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  swipeActionButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterCardAnimated: {
    borderRadius: 12,
    height: 100,
  },
  chapterCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  menuButton: {
    padding: 8,
  },
  menu: {
    position: 'absolute',
    top: 32,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 150,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chapterMeta: {
    fontSize: 14,
    marginBottom: 2,
  },
  chapterDate: {
    fontSize: 11,
  },
  chapterActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  storyMainSection: {
    padding: 24,
    margin: 20,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  storyMainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
  },
  storyMainHeaderLine: {
    flex: 1,
    height: 0,
  },
  storyMainTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chaptersSection: {
    padding: 20,
    paddingTop: 32,
    marginTop: 12,
    borderTopWidth: 8,
    borderTopColor: 'rgba(99, 102, 241, 0.1)',
  },
  chaptersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
  },
  chaptersSectionHeaderLine: {
    flex: 1,
    height: 0,
  },
  chaptersSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  coverPickerButton: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 16,
    overflow: 'hidden',
  },
  coverPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  coverPreviewText: {
    fontSize: 14,
    fontWeight: '500',
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 14,
    marginTop: 8,
  },
  coverPlaceholderSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  storyInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  storyTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  tagText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  tagRemove: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: '600',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  tagAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});