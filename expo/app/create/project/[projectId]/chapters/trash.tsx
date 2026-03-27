import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listChapters, updateChapter } from '@/lib/database';
import { useTheme } from '@/theme/ThemeProvider';

export default function ChaptersTrashBinScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [trashedChapters, setTrashedChapters] = useState<any[]>([]);
  const insets = useSafeAreaInsets();
  const { activeTheme } = useTheme();

  const loadTrashedChapters = useCallback(async () => {
    if (!projectId) return;

    try {
      const allChapters = await listChapters(projectId, { includeDrafts: true });
      const trashed = allChapters.filter((chapter: any) => chapter.status === 'trashed' || chapter.status === 'TRASHED');
      setTrashedChapters(trashed);
      console.log('Trashed chapters loaded');
    } catch (error) {
      console.error('Error loading trashed chapters:', error);
      setTrashedChapters([]);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      void loadTrashedChapters();
    }, [loadTrashedChapters])
  );

  const handleRestore = async (chapterId: string) => {
    try {
      await updateChapter(chapterId, { status: 'DRAFT' as any });
      await loadTrashedChapters();
      Alert.alert('Success', 'Chapter restored');
    } catch (error) {
      console.error('Error restoring chapter:', error);
      Alert.alert('Error', 'Failed to restore chapter');
    }
  };

  const handleDeleteAll = () => {
    if (trashedChapters.length === 0) {
      Alert.alert('Info', 'Trash is already empty');
      return;
    }
    
    Alert.alert(
      'Delete All',
      `Are you sure you want to permanently delete all ${trashedChapters.length} chapter(s) in trash? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const chapter of trashedChapters) {
                await updateChapter(chapter.id, { status: 'DRAFT' as any });
              }
              setTrashedChapters([]);
              Alert.alert('Success', 'All chapters permanently deleted');
            } catch (error) {
              console.error('Error deleting all chapters:', error);
              Alert.alert('Error', 'Failed to delete all chapters');
            }
          },
        },
      ]
    );
  };

  const handleReadChapter = async (chapterId: string) => {
    router.push(`/project/${projectId}/chapters/${chapterId}/preview`);
  };

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

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: activeTheme.colors.background }]}>
      <StatusBar barStyle={activeTheme.colors.background === '#000000' ? 'light-content' : 'dark-content'} backgroundColor={activeTheme.colors.background} />
      
      <View style={[styles.header, { borderBottomColor: activeTheme.colors.border }]}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTheme.colors.text.primary }]}>Chapters Trash Bin</Text>
        <TouchableOpacity 
          style={[styles.deleteAllButton, { backgroundColor: trashedChapters.length > 0 ? '#ef4444' : '#666', opacity: trashedChapters.length > 0 ? 1 : 0.5 }]} 
          onPress={handleDeleteAll}
        >
          <Trash2 size={16} color="#fff" />
          <Text style={styles.deleteAllText}>Delete All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {trashedChapters.length === 0 ? (
          <View style={styles.emptyState}>
            <Trash2 size={64} color={activeTheme.colors.text.muted} />
            <Text style={[styles.emptyTitle, { color: activeTheme.colors.text.primary }]}>Trash is empty</Text>
            <Text style={[styles.emptyDescription, { color: activeTheme.colors.text.secondary }]}>
              Deleted chapters will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.chaptersList}>
            {trashedChapters.map((chapter, index) => (
              <View key={chapter.id} style={[styles.chapterCard, { backgroundColor: activeTheme.colors.card }]}>
                <TouchableOpacity 
                  style={styles.chapterContent}
                  onPress={() => handleReadChapter(chapter.id)}
                >
                  <View style={styles.chapterNumber}>
                    <Text style={styles.chapterNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.chapterInfo}>
                    <Text style={[styles.chapterTitle, { color: activeTheme.colors.text.primary }]}>{chapter.title || 'Untitled Chapter'}</Text>
                    <Text style={[styles.chapterMeta, { color: activeTheme.colors.text.secondary }]}>
                      {chapter.blocks?.length || 0} blocks • {chapter.readTime || 0}m read
                    </Text>
                    <Text style={[styles.chapterDate, { color: activeTheme.colors.text.muted }]}>
                      Deleted: {new Date(chapter.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.restoreButton, { backgroundColor: '#6366f1' }]}
                  onPress={() => handleRestore(chapter.id)}
                >
                  <RotateCcw size={16} color="#fff" />
                  <Text style={styles.restoreButtonText}>Restore</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  deleteAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  chaptersList: {
    padding: 20,
  },
  chapterCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  chapterContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  restoreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
