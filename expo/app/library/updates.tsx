import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app-store';
import { useTheme } from '@/theme/ThemeProvider';
import { goBackOrFallback } from '@/lib/navigation';
import SafeImage from '@/ui/SafeImage';
import { ArrowLeft, Clock } from 'lucide-react-native';

interface UpdateItem {
  id: string;
  storyTitle: string;
  chapterTitle: string;
  storyCover: string;
  updatedAt: string;
  projectId: string;
  chapterId: string;
}

export default function UpdatesScreen() {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const projects = useAppStore((state) => state.projects);
  const setCurrentProject = useAppStore((state) => state.setCurrentProject);
  const { activeTheme } = useTheme();

  const loadUpdates = useCallback(() => {
    // Mock recent chapter updates from subscribed stories
    const mockUpdates: UpdateItem[] = [
      {
        id: '1',
        storyTitle: 'Digital Nomad Chronicles',
        chapterTitle: 'The Breaking Point',
        storyCover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
        updatedAt: '2 hours ago',
        projectId: projects[0]?.id || '1',
        chapterId: '1',
      },
      {
        id: '2',
        storyTitle: 'Tokyo Nights',
        chapterTitle: 'Shibuya Crossing',
        storyCover: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=600&fit=crop',
        updatedAt: '1 day ago',
        projectId: projects[1]?.id || '2',
        chapterId: '2',
      },
      {
        id: '3',
        storyTitle: 'Minimalist Journey',
        chapterTitle: 'The 100-Item Challenge',
        storyCover: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=600&fit=crop',
        updatedAt: '3 days ago',
        projectId: projects[2]?.id || '3',
        chapterId: '3',
      },
      {
        id: '4',
        storyTitle: 'Digital Nomad Chronicles',
        chapterTitle: 'Finding Balance',
        storyCover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
        updatedAt: '5 days ago',
        projectId: projects[0]?.id || '1',
        chapterId: '4',
      },
      {
        id: '5',
        storyTitle: 'Tokyo Nights',
        chapterTitle: 'Neon Dreams',
        storyCover: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=600&fit=crop',
        updatedAt: '1 week ago',
        projectId: projects[1]?.id || '2',
        chapterId: '5',
      },
    ];
    setUpdates(mockUpdates);
  }, [projects]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadUpdates();
    setRefreshing(false);
  };

  const handleUpdatePress = (update: UpdateItem) => {
    const project = projects.find(p => p.id === update.projectId);
    if (project) {
      setCurrentProject(project);
      router.push('/reader');
    }
  };

  const renderUpdateItem = ({ item }: { item: UpdateItem }) => (
    <TouchableOpacity
      style={[styles.updateItem, { backgroundColor: activeTheme.colors.card }]}
      onPress={() => handleUpdatePress(item)}
    >
      <SafeImage
        uri={item.storyCover}
        style={styles.storyCover}
        resizeMode="cover"
        fallback={<View style={[styles.storyCover, { backgroundColor: '#333' }]} />}
      />
      <View style={styles.updateInfo}>
        <Text style={[styles.storyTitle, { color: activeTheme.colors.text.primary }]} numberOfLines={1}>
          {item.storyTitle}
        </Text>
        <Text style={[styles.chapterTitle, { color: activeTheme.colors.text.secondary }]} numberOfLines={1}>
          {item.chapterTitle}
        </Text>
        <View style={styles.timeContainer}>
          <Clock size={12} color={activeTheme.colors.text.muted} />
          <Text style={[styles.updatedAt, { color: activeTheme.colors.text.muted }]}>
            {item.updatedAt}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.openButton}>
        <Text style={[styles.openButtonText, { color: activeTheme.colors.accent }]}>Open</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <Stack.Screen
        options={{
          title: 'New Updates',
          headerStyle: { backgroundColor: activeTheme.colors.background },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: { fontWeight: '700' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => goBackOrFallback(router, '/(tabs)/library')} style={styles.backButton}>
              <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      {updates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: activeTheme.colors.text.secondary }]}>
            No recent updates yet
          </Text>
          <Text style={[styles.emptySubtext, { color: activeTheme.colors.text.muted }]}>
            Subscribe to stories to see their latest chapter updates here
          </Text>
        </View>
      ) : (
        <FlatList
          data={updates}
          renderItem={renderUpdateItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { paddingTop: insets.top }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={activeTheme.colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  listContainer: {
    padding: 20,
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  storyCover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  updateInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    flex: 0,
  },
  chapterTitle: {
    fontSize: 14,
    marginBottom: 4,
    flex: 0,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 16,
    marginTop: 'auto',
  },
  updatedAt: {
    fontSize: 12,
  },
  openButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  openButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});