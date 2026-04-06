import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useAppStore } from '@/store/app-store';
import { goBackOrFallback } from '@/lib/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeImage from '@/ui/SafeImage';
import { ArrowLeft } from 'lucide-react-native';
import { Project } from '@/types';

type Tab = 'recent' | 'subscribed' | 'bookmarks' | 'favorites';

export default function LibraryMoreScreen() {
  const { activeTheme } = useTheme();
  const projects = useAppStore((state) => state.projects);
  const setCurrentProject = useAppStore((state) => state.setCurrentProject);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  
  const [activeTab, setActiveTab] = useState<Tab>((params.tab as Tab) || 'recent');

  const subscribedProjects = projects.slice(0, 3);
  const bookmarkedProjects = projects.slice(1, 4);
  const favoriteProjects = projects.slice(2, 5);

  const recentUpdates = [
    { id: '1', project: projects[0], chapterTitle: 'The Breaking Point', timestamp: '2 hours ago' },
    { id: '2', project: projects[1], chapterTitle: 'Shibuya Crossing', timestamp: '1 day ago' },
    { id: '3', project: projects[2], chapterTitle: 'The 100-Item Challenge', timestamp: '3 days ago' },
    { id: '4', project: projects[0], chapterTitle: 'New Beginnings', timestamp: '5 days ago' },
  ];

  const handleProjectPress = (project: Project) => {
    setCurrentProject(project);
    router.push(`/project/${project.id}`);
  };

  const renderProjectCard = ({ item }: { item: Project }) => (
    <TouchableOpacity 
      style={[styles.projectCard, { backgroundColor: activeTheme.colors.card }]}
      onPress={() => handleProjectPress(item)}
    >
      <SafeImage 
        uri={item.cover} 
        style={styles.projectCover}
        resizeMode="cover"
        fallback={<View style={[styles.projectCover, { backgroundColor: '#333' }]} />}
      />
      <View style={styles.projectInfo}>
        <Text style={[styles.projectTitle, { color: activeTheme.colors.text.primary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.creatorName, { color: activeTheme.colors.text.secondary }]}>{item.creator.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentUpdate = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.updateItem, { backgroundColor: activeTheme.colors.card }]}
      onPress={() => handleProjectPress(item.project)}
    >
      <SafeImage 
        uri={item.project.cover} 
        style={styles.updateThumbnail}
        resizeMode="cover"
        fallback={<View style={[styles.updateThumbnail, { backgroundColor: '#333' }]} />}
      />
      <View style={styles.updateInfo}>
        <Text style={[styles.updateChapter, { color: activeTheme.colors.text.primary }]} numberOfLines={1}>
          {item.chapterTitle}
        </Text>
        <Text style={[styles.updateProject, { color: activeTheme.colors.text.secondary }]} numberOfLines={1}>
          {item.project.title}
        </Text>
        <Text style={[styles.updateTime, { color: activeTheme.colors.text.muted }]}>{item.timestamp}</Text>
      </View>
    </TouchableOpacity>
  );

  const getContent = () => {
    switch (activeTab) {
      case 'recent':
        return (
          <FlatList
            data={recentUpdates}
            renderItem={renderRecentUpdate}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'subscribed':
        return (
          <FlatList
            data={subscribedProjects}
            renderItem={renderProjectCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'bookmarks':
        return (
          <FlatList
            data={bookmarkedProjects}
            renderItem={renderProjectCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'favorites':
        return (
          <FlatList
            data={favoriteProjects}
            renderItem={renderProjectCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: activeTheme.colors.border,
    },
    backButton: {
      padding: 4,
      marginRight: 16,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '700',
      color: activeTheme.colors.text.primary,
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: activeTheme.colors.border,
      gap: 12,
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: activeTheme.colors.surface,
    },
    activeTab: {
      backgroundColor: activeTheme.colors.accent,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: activeTheme.colors.text.primary,
    },
    activeTabText: {
      color: activeTheme.colors.background,
    },
    listContent: {
      padding: 20,
    },
    projectCard: {
      flexDirection: 'row',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      padding: 12,
    },
    projectCover: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
    },
    projectInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    projectTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    creatorName: {
      fontSize: 14,
    },
    updateItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    updateThumbnail: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: 12,
    },
    updateInfo: {
      flex: 1,
    },
    updateChapter: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    updateProject: {
      fontSize: 14,
      marginBottom: 4,
    },
    updateTime: {
      fontSize: 12,
    },
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => goBackOrFallback(router, '/(tabs)/library')}>
          <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shelf</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>Recent</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'subscribed' && styles.activeTab]}
          onPress={() => setActiveTab('subscribed')}
        >
          <Text style={[styles.tabText, activeTab === 'subscribed' && styles.activeTabText]}>Subscribed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'bookmarks' && styles.activeTab]}
          onPress={() => setActiveTab('bookmarks')}
        >
          <Text style={[styles.tabText, activeTab === 'bookmarks' && styles.activeTabText]}>Bookmark Shelf</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>Favorite Selections</Text>
        </TouchableOpacity>
      </ScrollView>

      {getContent()}
    </View>
  );
}
