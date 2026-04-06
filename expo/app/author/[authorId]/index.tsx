import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/store/app-store';
import { useTheme } from '@/theme/ThemeProvider';
import SafeImage from '@/ui/SafeImage';
import { goBackOrFallback } from '@/lib/navigation';
import { ArrowLeft, UserPlus, UserCheck } from 'lucide-react-native';
import { Creator, Project } from '@/types';
import { mockCreators } from '@/data/mock-data';

export default function AuthorProfileScreen() {
  const { authorId } = useLocalSearchParams<{ authorId: string }>();
  const [author, setAuthor] = useState<Creator | null>(null);
  const [authorProjects, setAuthorProjects] = useState<Project[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const projects = useAppStore((state) => state.projects);
  const setCurrentProject = useAppStore((state) => state.setCurrentProject);
  const { activeTheme } = useTheme();

  useEffect(() => {
    if (!authorId) return;
    
    const foundAuthor = mockCreators.find(c => c.id === authorId);
    setAuthor(foundAuthor || null);
    
    const authorWorks = projects.filter(p => p.creatorId === authorId);
    setAuthorProjects(authorWorks);
  }, [authorId, projects]);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  const handleProjectPress = (project: Project) => {
    setCurrentProject(project);
    router.push(`/project/${project.id}`);
  };

  if (!author) {
    return (
      <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Author Profile',
            headerStyle: { backgroundColor: activeTheme.colors.background },
            headerTintColor: activeTheme.colors.text.primary,
            headerTitleStyle: { fontWeight: '700' },
            headerLeft: () => (
              <TouchableOpacity onPress={() => goBackOrFallback(router, '/(tabs)/explore')} style={styles.backButton}>
                <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: activeTheme.colors.text.secondary }]}>
            Author not found
          </Text>
        </View>
      </View>
    );
  }

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
        <Text style={[styles.projectDescription, { color: activeTheme.colors.text.secondary }]} numberOfLines={2}>
          {item.shortDescription || item.description}
        </Text>
        <View style={styles.projectStats}>
          <Text style={[styles.statText, { color: activeTheme.colors.text.muted }]}>
            {item.stats.views.toLocaleString()} views
          </Text>
          <Text style={[styles.statText, { color: activeTheme.colors.text.muted }]}>
            {item.chapters.length} chapters
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: activeTheme.colors.background },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: { fontWeight: '700' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => goBackOrFallback(router, '/(tabs)/explore')} style={styles.backButton}>
              <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Author Header */}
        <View style={styles.authorHeader}>
          <SafeImage
            uri={author.avatar}
            style={styles.authorAvatar}
            resizeMode="cover"
            fallback={<View style={[styles.authorAvatar, { backgroundColor: '#666' }]} />}
          />
          <Text style={[styles.authorName, { color: activeTheme.colors.text.primary }]}>
            {author.name}
          </Text>
          <Text style={[styles.followersCount, { color: activeTheme.colors.text.secondary }]}>
            {author.followers.toLocaleString()} followers
          </Text>

          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing
                ? { backgroundColor: activeTheme.colors.card, borderWidth: 1, borderColor: activeTheme.colors.accent }
                : { backgroundColor: activeTheme.colors.accent }
            ]}
            onPress={handleFollowToggle}
          >
            {isFollowing ? (
              <>
                <UserCheck size={20} color={activeTheme.colors.accent} />
                <Text style={[styles.followButtonText, { color: activeTheme.colors.accent }]}>
                  Following
                </Text>
              </>
            ) : (
              <>
                <UserPlus size={20} color={activeTheme.colors.background} />
                <Text style={[styles.followButtonText, { color: activeTheme.colors.background }]}>
                  Follow
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Author's Works */}
        <View style={styles.worksSection}>
          <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary }]}>
            Works ({authorProjects.length})
          </Text>
          
          {authorProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: activeTheme.colors.text.secondary }]}>
                No published works yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={authorProjects}
              renderItem={renderProjectCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.projectsList}
            />
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  authorHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  authorAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  authorName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  followersCount: {
    fontSize: 16,
    marginBottom: 20,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  worksSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  projectsList: {
    gap: 16,
  },
  projectCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  projectCover: {
    width: 100,
    height: 140,
  },
  projectInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  projectStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
