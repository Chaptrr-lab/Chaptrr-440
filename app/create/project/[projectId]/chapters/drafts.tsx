import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { ArrowLeft, Edit3, Clock, Trash2, Send } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listChaptersByProject } from '@/lib/persist';
import { addChapterToBroadcastQueue } from '@/lib/database';
import { Chapter } from '@/types';

interface DraftCardProps {
  chapter: Chapter;
  onPress: () => void;
  onDelete: () => void;
  onSendToBroadcast: () => void;
}

function DraftCard({ chapter, onPress, onDelete, onSendToBroadcast }: DraftCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          const resistance = Math.abs(gestureState.dx) < 40 ? 0.3 : 1;
          const adjustedDx = gestureState.dx < -40 ? -40 + (gestureState.dx + 40) : gestureState.dx * resistance;
          translateX.setValue(Math.max(adjustedDx, -144));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100) {
          Animated.spring(translateX, {
            toValue: -144,
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
    })
  ).current;

  const handleDelete = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    onDelete();
  };

  const handleSendToBroadcast = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    onSendToBroadcast();
  };

  return (
    <View style={styles.draftCardContainer}>
      <View style={styles.swipeActions}>
        <TouchableOpacity style={styles.broadcastAction} onPress={handleSendToBroadcast}>
          <Send size={20} color="#fff" />
          <Text style={styles.actionText}>Broadcast</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
          <Trash2 size={20} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[styles.draftCard, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.draftCardInner} onPress={onPress}>
          <View style={styles.draftInfo}>
            <Text style={styles.draftTitle}>{chapter.title || 'Untitled Chapter'}</Text>
            <Text style={styles.draftMeta}>
              {chapter.blocks.length} blocks • Last saved: {new Date(chapter.updatedAt).toLocaleDateString()}
            </Text>
            <Text style={styles.draftTime}>
              {new Date(chapter.updatedAt).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.draftActions}>
            <View style={styles.draftBadge}>
              <Text style={styles.draftBadgeText}>DRAFT</Text>
            </View>
            <Edit3 size={16} color="#6366f1" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function DraftsScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const insets = useSafeAreaInsets();
  const [draftChapters, setDraftChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    
    const loadDrafts = async () => {
      try {
        setLoading(true);
        const allChapters = await listChaptersByProject(projectId);
        const drafts = allChapters.filter(chapter => chapter.status === 'DRAFT').map((ch, index) => ({
          id: ch.id,
          title: ch.title,
          order: index,
          projectId: ch.projectId,
          blocks: ch.blocks || [],
          readTime: Math.ceil((ch.blocks?.length || 0) * 0.5),
          status: 'draft' as const,
          version: 1,
          createdAt: new Date(ch.updatedAt).toISOString(),
          updatedAt: new Date(ch.updatedAt).toISOString(),
          characterAppearances: [],
          afterNote: ch.afterNote || ''
        }));
        console.log('Loaded drafts:', drafts.length, drafts);
        setDraftChapters(drafts);
      } catch (error) {
        console.error('Error loading drafts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDrafts();
  }, [projectId]);

  if (!projectId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Project ID not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleDraftPress = (chapterId: string) => {
    router.push(`/create/project/${projectId}/chapters/${chapterId}/edit`);
  };

  const handleDelete = async (chapterId: string) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDraftChapters(prev => prev.filter(ch => ch.id !== chapterId));
              Alert.alert('Success', 'Draft deleted (Note: Permanent deletion not yet implemented)');
            } catch (error) {
              console.error('Error deleting chapter:', error);
              Alert.alert('Error', 'Failed to delete draft');
            }
          },
        },
      ]
    );
  };

  const handleSendToBroadcast = async (chapterId: string) => {
    if (!projectId) return;
    try {
      await addChapterToBroadcastQueue(projectId, chapterId);
      Alert.alert('Success', 'Draft added to broadcast queue');
    } catch (error) {
      console.error('Error adding to broadcast:', error);
      Alert.alert('Error', 'Failed to add draft to broadcast queue');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drafts</Text>
        <View style={styles.headerActions}>
          <Clock size={20} color="#6366f1" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Draft Chapters ({loading ? '...' : draftChapters.length})
            </Text>
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Loading...</Text>
            </View>
          ) : draftChapters.length === 0 ? (
            <View style={styles.emptyState}>
              <Clock size={48} color="#666" />
              <Text style={styles.emptyTitle}>No drafts yet</Text>
              <Text style={styles.emptyDescription}>
                Your saved drafts will appear here. Create a new chapter to get started.
              </Text>
            </View>
          ) : (
            <View>
              {draftChapters.map((chapter) => (
                <DraftCard
                  key={chapter.id}
                  chapter={chapter}
                  onPress={() => handleDraftPress(chapter.id)}
                  onDelete={() => handleDelete(chapter.id)}
                  onSendToBroadcast={() => handleSendToBroadcast(chapter.id)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backIcon: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
  },
  emptyDescription: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  draftCardContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  swipeActions: {
    position: 'absolute',
    right: -2,
    top: 1,
    bottom: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  broadcastAction: {
    backgroundColor: '#f59e0b',
    width: 82,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  deleteAction: {
    backgroundColor: '#ef4444',
    width: 82,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  draftCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  draftCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  draftInfo: {
    flex: 1,
  },
  draftTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  draftMeta: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 2,
  },
  draftTime: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
  },
  draftActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  draftBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  draftBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});