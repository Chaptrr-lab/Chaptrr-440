import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useAppStore } from '@/store/app-store';
import { goBackOrFallback } from '@/lib/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, Heart, Edit3, ArrowLeft } from 'lucide-react-native';

export default function OnAirScreen() {
  const { activeTheme } = useTheme();
  const projects = useAppStore((state) => state.projects);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Filter to only show user's published projects
  const publishedProjects = projects.filter(p => 
    p.creatorId === 'user-1' && 
    p.onAirSnapshot // Only show projects that have been published
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: insets.top + 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: activeTheme.colors.border,
    },
    backButton: {
      padding: 4,
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: activeTheme.colors.text.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: activeTheme.colors.text.primary,
      marginBottom: 16,
    },
    projectCard: {
      backgroundColor: activeTheme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
    },
    projectHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    projectCover: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: activeTheme.colors.border,
      marginRight: 12,
    },
    projectInfo: {
      flex: 1,
    },
    projectTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: activeTheme.colors.text.primary,
      marginBottom: 4,
    },
    projectMeta: {
      fontSize: 12,
      color: activeTheme.colors.text.muted,
    },
    projectStats: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 14,
      color: activeTheme.colors.text.muted,
    },
    editButton: {
      backgroundColor: activeTheme.colors.background,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
    },
    editButtonText: {
      fontSize: 14,
      color: activeTheme.colors.text.primary,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: activeTheme.colors.text.muted,
      textAlign: 'center',
      lineHeight: 24,
    },
    emptySubtext: {
      fontSize: 14,
      color: activeTheme.colors.text.muted,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => goBackOrFallback(router, '/(tabs)/studio')}>
          <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>On Air</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Published Stories</Text>
        
        {publishedProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              📡 No stories on air yet
            </Text>
            <Text style={styles.emptySubtext}>
              Publish your first story from the Studio to see it here
            </Text>
          </View>
        ) : (
          publishedProjects.map((project) => (
            <TouchableOpacity 
              key={project.id} 
              style={styles.projectCard}
              onPress={() => router.push(`/onair/${project.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.projectHeader}>
                <View style={styles.projectCover} />
                <View style={styles.projectInfo}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <Text style={styles.projectMeta}>
                    Published: {project.onAirSnapshot?.publishedAt ? 
                      new Date(project.onAirSnapshot.publishedAt).toLocaleDateString() : 
                      'Recently'
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.projectStats}>
                <View style={styles.statItem}>
                  <Eye size={16} color={activeTheme.colors.text.muted} />
                  <Text style={styles.statText}>{project.stats.views.toLocaleString()}</Text>
                </View>
                <View style={styles.statItem}>
                  <Heart size={16} color={activeTheme.colors.text.muted} />
                  <Text style={styles.statText}>{project.stats.likes.toLocaleString()}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => router.push(`/studio/${project.id}/broadcast`)}
              >
                <Edit3 size={16} color={activeTheme.colors.text.primary} />
                <Text style={styles.editButtonText}>Edit in Studio</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}