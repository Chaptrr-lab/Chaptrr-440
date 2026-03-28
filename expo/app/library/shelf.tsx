import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useAppStore } from '@/store/app-store';
import { useTheme } from '@/theme/ThemeProvider';
import { goBackOrFallback } from '@/lib/navigation';
import { getProject } from '@/lib/database';
import SafeImage from '@/ui/SafeImage';
import { ArrowLeft, Clock, BookMarked, Heart, Bookmark } from 'lucide-react-native';

type TabType = 'subscribed' | 'bookmark' | 'faved';

interface ShelfItem {
  id: string;
  title: string;
  creator: string;
  cover: string;
  updatedAt?: string;
  chapterTitle?: string;
  projectId: string;
}

export default function ShelfScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('subscribed');
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { projects, setCurrentProject } = useAppStore();
  const { activeTheme } = useTheme();

  const loadItems = React.useCallback(async () => {
    try {
      const filteredProjects: ShelfItem[] = [];
      
      for (const project of projects) {
        const dbProject = await getProject(project.id);
        
        if (activeTab === 'subscribed' && dbProject?.subscribed) {
          filteredProjects.push({
            id: project.id,
            title: project.title,
            creator: project.creator.name,
            cover: project.cover || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
            projectId: project.id,
          });
        } else if (activeTab === 'bookmark' && dbProject?.bookmarked) {
          filteredProjects.push({
            id: project.id,
            title: project.title,
            creator: project.creator.name,
            cover: project.cover || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
            projectId: project.id,
          });
        }
      }
      
      if (activeTab === 'faved') {
        const { likedProjects } = useAppStore.getState();
        for (const project of projects) {
          if (likedProjects.has(project.id)) {
            filteredProjects.push({
              id: project.id,
              title: project.title,
              creator: project.creator.name,
              cover: project.cover || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
              projectId: project.id,
            });
          }
        }
      }
      
      setItems(filteredProjects);
    } catch (error) {
      console.error('[Shelf] Error loading items:', error);
      setItems([]);
    }
  }, [activeTab, projects]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await loadItems();
    setRefreshing(false);
  };

  const handleItemPress = (item: ShelfItem) => {
    const project = projects.find(p => p.id === item.projectId);
    if (project) {
      setCurrentProject(project);
      router.push('/reader');
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'subscribed': return 'Subscribed Titles';
      case 'bookmark': return 'Bookmarked Shelf';
      case 'faved': return 'Favorite Selections';
    }
  };

  const renderItem = ({ item }: { item: ShelfItem }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: activeTheme.colors.card }]}
      onPress={() => handleItemPress(item)}
    >
      <SafeImage
        uri={item.cover}
        style={styles.cover}
        resizeMode="cover"
        fallback={<View style={[styles.cover, { backgroundColor: '#333' }]} />}
      />
      <View style={styles.itemInfo}>
        <Text style={[styles.title, { color: activeTheme.colors.text.primary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.creator, { color: activeTheme.colors.text.secondary }]} numberOfLines={1}>
          {item.creator}
        </Text>
        {item.chapterTitle && (
          <Text style={[styles.chapterTitle, { color: activeTheme.colors.text.muted }]} numberOfLines={1}>
            {item.chapterTitle}
          </Text>
        )}
        {item.updatedAt && (
          <View style={styles.timeContainer}>
            <Clock size={12} color={activeTheme.colors.text.muted} />
            <Text style={[styles.updatedAt, { color: activeTheme.colors.text.muted }]}>
              {item.updatedAt}
            </Text>
          </View>
        )}
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
          title: 'Shelf',
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
      
      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: activeTheme.colors.surface, borderBottomColor: activeTheme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'subscribed' && { borderBottomColor: activeTheme.colors.accent }]}
          onPress={() => setActiveTab('subscribed')}
        >
          <BookMarked size={20} color={activeTab === 'subscribed' ? activeTheme.colors.accent : activeTheme.colors.text.secondary} fill={activeTab === 'subscribed' ? activeTheme.colors.accent : 'transparent'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookmark' && { borderBottomColor: activeTheme.colors.accent }]}
          onPress={() => setActiveTab('bookmark')}
        >
          <Bookmark size={20} color={activeTab === 'bookmark' ? activeTheme.colors.accent : activeTheme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faved' && { borderBottomColor: activeTheme.colors.accent }]}
          onPress={() => setActiveTab('faved')}
        >
          <Heart size={20} color={activeTab === 'faved' ? activeTheme.colors.accent : activeTheme.colors.text.secondary} fill={activeTab === 'faved' ? activeTheme.colors.accent : 'transparent'} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {getTabTitle() && (
          <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary }]}>
            {getTabTitle()}
          </Text>
        )}
        
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: activeTheme.colors.text.secondary }]}>
              No items yet
            </Text>
            <Text style={[styles.emptySubtext, { color: activeTheme.colors.text.muted }]}>
              {activeTab === 'subscribed' && 'Subscribe to stories to see them here'}
              {activeTab === 'bookmark' && 'Bookmark stories to save them here'}
              {activeTab === 'faved' && 'Heart stories to add them to favorites'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  creator: {
    fontSize: 14,
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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