import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app-store';
import { useTheme } from '@/theme/ThemeProvider';
import SafeImage from '@/ui/SafeImage';
import { ArrowLeft, UserPlus, UserCheck } from 'lucide-react-native';
import { Creator, Project } from '@/types';
import { mockCreators } from '@/data/mock-data';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 12;
const GRID_H_PAD = 20;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_H_PAD * 2 - GRID_GAP) / 2;
const CARD_COVER_HEIGHT = CARD_WIDTH * (4 / 3);

function GridCard({ project, onPress }: { project: Project; onPress: () => void }) {
  const { activeTheme } = useTheme();
  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.8}>
      <SafeImage
        uri={project.cover}
        style={{ width: CARD_WIDTH, height: CARD_COVER_HEIGHT, borderRadius: 10, marginBottom: 8, overflow: 'hidden' } as any}
        resizeMode="cover"
        fallback={
          <View
            style={{ width: CARD_WIDTH, height: CARD_COVER_HEIGHT, borderRadius: 10, marginBottom: 8, backgroundColor: '#333' }}
          />
        }
      />
      <Text
        style={[styles.gridTitle, { color: activeTheme.colors.text.primary }]}
        numberOfLines={2}
      >
        {project.title}
      </Text>
      <View style={styles.gridStats}>
        <Text style={[styles.gridStat, { color: activeTheme.colors.text.muted }]}>
          {project.stats.views.toLocaleString()} views
        </Text>
        <Text style={[styles.gridStat, { color: activeTheme.colors.text.muted }]}>
          {project.chapters.length} ch.
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AuthorProfileScreen() {
  const { authorId } = useLocalSearchParams<{ authorId: string }>();
  const [author, setAuthor] = useState<Creator | null>(null);
  const [authorProjects, setAuthorProjects] = useState<Project[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const insets = useSafeAreaInsets();
  const { projects, setCurrentProject } = useAppStore();
  const { activeTheme } = useTheme();

  useEffect(() => {
    if (!authorId) return;
    const foundAuthor = mockCreators.find((c) => c.id === authorId);
    setAuthor(foundAuthor || null);
    setAuthorProjects(projects.filter((p) => p.creatorId === authorId));
  }, [authorId, projects]);

  const handleProjectPress = (project: Project) => {
    setCurrentProject(project);
    router.push(`/project/${project.id}`);
  };

  const c = activeTheme.colors;

  if (!author) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Stack.Screen
          options={{
            title: 'Author Profile',
            headerStyle: { backgroundColor: c.background },
            headerTintColor: c.text.primary,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={c.text.primary} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: c.text.secondary }]}>Author not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.text.primary,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={c.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Author header */}
        <View style={[styles.authorHeader, { paddingTop: insets.top > 0 ? 8 : 24 }]}>
          <SafeImage
            uri={author.avatar}
            style={styles.authorAvatar}
            resizeMode="cover"
            fallback={<View style={[styles.authorAvatar, { backgroundColor: '#666' }]} />}
          />
          <Text style={[styles.authorName, { color: c.text.primary }]}>{author.name}</Text>
          <Text style={[styles.followersCount, { color: c.text.secondary }]}>
            {author.followers.toLocaleString()} followers
          </Text>

          {/* Bio */}
          {author.bio ? (
            <Text style={[styles.bio, { color: c.text.secondary }]}>{author.bio}</Text>
          ) : null}

          {/* Follow button */}
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing
                ? { backgroundColor: c.surface, borderWidth: 1, borderColor: c.accent }
                : { backgroundColor: c.accent },
            ]}
            onPress={() => setIsFollowing((v) => !v)}
            activeOpacity={0.8}
          >
            {isFollowing ? (
              <>
                <UserCheck size={18} color={c.accent} />
                <Text style={[styles.followButtonText, { color: c.accent }]}>Following</Text>
              </>
            ) : (
              <>
                <UserPlus size={18} color={c.background} />
                <Text style={[styles.followButtonText, { color: c.background }]}>Follow</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Works section — 2-column grid */}
        <View style={styles.worksSection}>
          <Text style={[styles.sectionTitle, { color: c.text.primary }]}>
            Works ({authorProjects.length})
          </Text>

          {authorProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: c.text.secondary }]}>
                No published works yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={authorProjects}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              renderItem={({ item }) => (
                <GridCard project={item} onPress={() => handleProjectPress(item)} />
              )}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { padding: 8, marginLeft: -8 },
  scrollView: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, fontWeight: '600' },
  // Author header
  authorHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  authorAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 14,
  },
  authorName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  followersCount: {
    fontSize: 15,
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 20,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 24,
    gap: 8,
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Works grid
  worksSection: {
    paddingHorizontal: GRID_H_PAD,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  gridContent: {
    gap: GRID_GAP,
  },
  gridRow: {
    gap: GRID_GAP,
    justifyContent: 'flex-start',
  },
  gridCard: {
    width: CARD_WIDTH,
  },
  gridCover: {
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  gridStats: {
    flexDirection: 'row',
    gap: 8,
  },
  gridStat: {
    fontSize: 11,
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
