import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useAppStore } from '@/store/app-store';
import { goBackOrFallback } from '@/lib/navigation';
import { ArrowLeft } from 'lucide-react-native';

export default function OnAirScreen() {
  const { activeTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const projects = useAppStore((state) => state.projects);
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();

  const project = projects.find(p => p.id === projectId);
  const onAirData = project?.onAirSnapshot;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
      paddingTop: insets.top,
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
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: activeTheme.colors.text.primary,
      marginLeft: 16,
    },
    headerSpacer: {
      width: 32,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    cover: {
      width: '100%',
      height: 200,
      backgroundColor: activeTheme.colors.border,
      borderRadius: 12,
      marginBottom: 16,
    },

    creator: {
      fontSize: 16,
      color: activeTheme.colors.text.muted,
      marginBottom: 16,
    },
    description: {
      fontSize: 16,
      color: activeTheme.colors.text.primary,
      lineHeight: 24,
      marginBottom: 16,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24,
    },
    tag: {
      backgroundColor: activeTheme.colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    tagText: {
      color: activeTheme.colors.background,
      fontSize: 12,
      fontWeight: '500',
    },
    chaptersTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: activeTheme.colors.text.primary,
      marginBottom: 16,
    },
    chapterItem: {
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    chapterTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: activeTheme.colors.text.primary,
      marginBottom: 4,
    },
    chapterMeta: {
      fontSize: 12,
      color: activeTheme.colors.text.muted,
    },
    errorText: {
      fontSize: 16,
      color: activeTheme.colors.text.primary,
      textAlign: 'center',
      marginTop: 40,
    },
  });

  if (!project || !onAirData) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => goBackOrFallback(router, '/onair')}>
              <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>On Air</Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.errorText}>
            {!project ? 'Project not found' : 'Project not published yet'}
          </Text>
        </View>
      </>
    );
  }

  const publishedChapters = onAirData.chapters.map(chapterId => 
    project.chapters.find(c => c.id === chapterId)
  ).filter(Boolean);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => goBackOrFallback(router, '/onair')}>
            <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>On Air</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          <View style={styles.cover} />
          <Text style={styles.creator}>by {project.creator.name}</Text>
          
          <Text style={styles.description}>
            {onAirData.shortDesc || project.description}
          </Text>

          {onAirData.tags && onAirData.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {onAirData.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.chaptersTitle}>Chapters</Text>
          
          {publishedChapters.map((chapter, index) => (
            <TouchableOpacity 
              key={chapter!.id} 
              style={styles.chapterItem}
              onPress={() => router.push(`/project/${projectId}/chapters/${chapter!.id}/preview` as any)}
            >
              <Text style={styles.chapterTitle}>
                {index + 1}. {chapter!.title}
              </Text>
              <Text style={styles.chapterMeta}>
                {chapter!.readTime} min read • Published
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );
}