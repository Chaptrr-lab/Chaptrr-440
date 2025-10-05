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
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listProjects, updateProject } from '@/lib/database';
import { useTheme } from '@/theme/ThemeProvider';

export default function StoriesTrashBinScreen() {
  const [trashedStories, setTrashedStories] = useState<any[]>([]);
  const insets = useSafeAreaInsets();
  const { activeTheme } = useTheme();

  const loadTrashedStories = useCallback(async () => {
    try {
      const { Platform } = await import('react-native');
      
      if (Platform.OS === 'web') {
        const AsyncStorage = (await import('@/lib/async-storage')).default;
        const data = await AsyncStorage.getItem('chaptrr_projects');
        if (!data) {
          setTrashedStories([]);
          return;
        }
        
        try {
          const projects = JSON.parse(data);
          const trashed = projects.filter((p: any) => p.status === 'TRASHED');
          setTrashedStories(trashed);
          console.log('Trashed stories loaded (web):', trashed.length);
        } catch (parseError) {
          console.error('Error parsing projects data:', parseError);
          setTrashedStories([]);
        }
      } else {
        const allProjects = await listProjects();
        const trashed = allProjects.filter((p: any) => p.status === 'TRASHED');
        setTrashedStories(trashed);
        console.log('Trashed stories loaded (native):', trashed.length);
      }
    } catch (error) {
      console.error('Error loading trashed stories:', error);
      setTrashedStories([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrashedStories();
    }, [loadTrashedStories])
  );

  const handleRestore = async (projectId: string) => {
    try {
      await updateProject(projectId, { status: '' });
      await loadTrashedStories();
      Alert.alert('Success', 'Story restored');
    } catch (error) {
      console.error('Error restoring story:', error);
      Alert.alert('Error', 'Failed to restore story');
    }
  };

  const handleDeleteAll = () => {
    if (trashedStories.length === 0) {
      Alert.alert('Info', 'Trash is already empty');
      return;
    }
    
    Alert.alert(
      'Delete All',
      `Are you sure you want to permanently delete all ${trashedStories.length} story(ies) in trash? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const story of trashedStories) {
                await updateProject(story.id, { status: 'DELETED' as any });
              }
              setTrashedStories([]);
              Alert.alert('Success', 'All stories permanently deleted');
            } catch (error) {
              console.error('Error deleting all stories:', error);
              Alert.alert('Error', 'Failed to delete all stories');
            }
          },
        },
      ]
    );
  };

  const handleReadStory = async (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: activeTheme.colors.background }]}>
      <StatusBar barStyle={activeTheme.colors.background === '#000000' ? 'light-content' : 'dark-content'} backgroundColor={activeTheme.colors.background} />
      
      <View style={[styles.header, { borderBottomColor: activeTheme.colors.border }]}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTheme.colors.text.primary }]}>Stories Trash Bin</Text>
        <TouchableOpacity 
          style={[styles.deleteAllButton, { backgroundColor: trashedStories.length > 0 ? '#ef4444' : '#666', opacity: trashedStories.length > 0 ? 1 : 0.5 }]} 
          onPress={handleDeleteAll}
        >
          <Trash2 size={16} color="#fff" />
          <Text style={styles.deleteAllText}>Delete All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {trashedStories.length === 0 ? (
          <View style={styles.emptyState}>
            <Trash2 size={64} color={activeTheme.colors.text.muted} />
            <Text style={[styles.emptyTitle, { color: activeTheme.colors.text.primary }]}>Trash is empty</Text>
            <Text style={[styles.emptyDescription, { color: activeTheme.colors.text.secondary }]}>
              Deleted stories will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.storiesList}>
            {trashedStories.map((story, index) => (
              <View key={story.id} style={[styles.storyCard, { backgroundColor: activeTheme.colors.card }]}>
                <TouchableOpacity 
                  style={styles.storyContent}
                  onPress={() => handleReadStory(story.id)}
                >
                  <View style={styles.storyNumber}>
                    <Text style={styles.storyNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.storyInfo}>
                    <Text style={[styles.storyTitle, { color: activeTheme.colors.text.primary }]}>{story.title}</Text>
                    <Text style={[styles.storyMeta, { color: activeTheme.colors.text.secondary }]}>
                      {story.chapter_count_published || 0} published • {story.chapter_count_all || 0} total
                    </Text>
                    <Text style={[styles.storyDate, { color: activeTheme.colors.text.muted }]}>
                      Deleted: {new Date(story.updated_at).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.restoreButton, { backgroundColor: '#6366f1' }]}
                  onPress={() => handleRestore(story.id)}
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
  storiesList: {
    padding: 20,
  },
  storyCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  storyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storyNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  storyNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  storyMeta: {
    fontSize: 14,
    marginBottom: 2,
  },
  storyDate: {
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
