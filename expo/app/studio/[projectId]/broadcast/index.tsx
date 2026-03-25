import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { goBackOrFallback } from '@/lib/navigation';
import { ArrowLeft, Upload, Settings, Edit, Send, GripVertical } from 'lucide-react-native';
import SafeImage from '@/ui/SafeImage';
import { getProject, getBroadcastData, updateBroadcastData } from '@/lib/database';
import { Project } from '@/types';

export default function BroadcastRoomScreen() {
  const { activeTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [coverUrl, setCoverUrl] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return;
      try {
        const projectData = await getProject(projectId);
        setProject(projectData);
        
        const broadcastData = await getBroadcastData(projectId);
        if (broadcastData) {
          setCoverUrl(broadcastData.coverUrl || projectData?.cover || '');
          setShortDesc(broadcastData.shortDesc || projectData?.shortDescription || '');
          setTags(broadcastData.tags || projectData?.tags || []);
          setQueue(broadcastData.queue || []);
        } else if (projectData) {
          setCoverUrl(projectData.cover || '');
          setShortDesc(projectData.shortDescription || '');
          setTags(projectData.tags || []);
        }
      } catch (error) {
        console.error('Error loading broadcast data:', error);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [projectId]);

  const saveBroadcastData = useCallback(async () => {
    if (!projectId) return;
    try {
      await updateBroadcastData(projectId, {
        coverUrl,
        shortDesc,
        tags,
        queue,
        pricing: 'all_free'
      });
    } catch (error) {
      console.error('Error saving broadcast data:', error);
    }
  }, [coverUrl, projectId, queue, shortDesc, tags]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void saveBroadcastData();
    }, 1000);
    return () => clearTimeout(timer);
  }, [saveBroadcastData]);



  const handleOnAir = () => {
    router.push(`/onair/${projectId}` as any);
  };

  const handleSettings = () => {
    router.push(`/studio/${projectId}/broadcast/settings` as any);
  };

  const handleIntro = () => {
    router.push(`/studio/${projectId}/broadcast/intro` as any);
  };

  const handlePublish = async () => {
    if (!projectId) return;
    
    try {
      await updateBroadcastData(projectId, {
        coverUrl,
        shortDesc,
        tags,
        queue,
        pricing: 'all_free',
        onAirSnapshot: {
          coverUrl,
          shortDesc,
          tags,
          chapters: queue,
          pricing: 'all_free',
          publishedAt: new Date().toISOString()
        }
      });
      Alert.alert('Published!', 'Your story is now live on On Air.');
    } catch (error) {
      console.error('Error publishing:', error);
      Alert.alert('Error', 'Failed to publish. Please try again.');
    }
  };



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
      textAlign: 'center' as const,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: activeTheme.colors.text.primary,
      marginBottom: 16,
    },
    input: {
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: activeTheme.colors.text.primary,
      marginBottom: 12,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    uploadButton: {
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 2,
      borderColor: activeTheme.colors.border,
      borderStyle: 'dashed',
      borderRadius: 8,
      padding: 20,
      alignItems: 'center',
      marginBottom: 12,
    },
    uploadText: {
      color: activeTheme.colors.text.muted,
      fontSize: 14,
      marginTop: 8,
    },
    helperText: {
      fontSize: 12,
      marginBottom: 12,
      fontStyle: 'italic',
    },
    coverPreview: {
      marginBottom: 12,
    },
    coverImage: {
      width: '100%',
      height: 180,
      borderRadius: 8,
      marginBottom: 8,
    },
    changeCoverButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      backgroundColor: activeTheme.colors.surface,
    },
    changeCoverText: {
      fontSize: 14,
      fontWeight: '600',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    tag: {
      backgroundColor: activeTheme.colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    tagText: {
      color: activeTheme.colors.background,
      fontSize: 12,
      fontWeight: '500',
    },
    tagRemove: {
      color: activeTheme.colors.background,
      fontSize: 16,
      fontWeight: 'bold',
    },
    tagInputContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    tagInput: {
      flex: 1,
    },
    addButton: {
      backgroundColor: activeTheme.colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      color: activeTheme.colors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    draftItem: {
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dragHandle: {
      marginRight: 12,
    },
    draftInfo: {
      flex: 1,
    },
    draftTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: activeTheme.colors.text.primary,
    },
    specialButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    specialButton: {
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    specialButtonText: {
      color: activeTheme.colors.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    onAirButton: {
      backgroundColor: '#f59e0b',
      borderColor: '#f59e0b',
    },
    publishButton: {
      backgroundColor: activeTheme.colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    publishButtonText: {
      color: activeTheme.colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyText: {
      color: activeTheme.colors.text.muted,
      fontSize: 14,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.emptyText, { marginTop: 40 }]}>Loading...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={[styles.emptyText, { marginTop: 40 }]}>Project not found</Text>
      </View>
    );
  }

  const queueChapters = queue
    .map(chapterId => project?.chapters.find(c => c.id === chapterId))
    .filter((chapter): chapter is NonNullable<typeof chapter> => chapter !== null && chapter !== undefined);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => goBackOrFallback(router, '/(tabs)/studio')}>
            <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Broadcast Room</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Story Main Section (Read-Only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Story Main (Read-Only)</Text>
          <Text style={[styles.helperText, { color: activeTheme.colors.text.muted }]}>Edit in Story page to update this section</Text>
          
          {coverUrl ? (
            <View style={styles.coverPreview}>
              <SafeImage 
                uri={coverUrl} 
                style={styles.coverImage}
                resizeMode="cover"
                fallback={<View style={[styles.coverImage, { backgroundColor: '#333' }]} />}
              />
            </View>
          ) : (
            <View style={[styles.uploadButton, { opacity: 0.5 }]}>
              <Upload size={24} color={activeTheme.colors.text.muted} />
              <Text style={styles.uploadText}>No cover image</Text>
            </View>
          )}

          <View style={[styles.input, styles.textArea, { opacity: 0.7 }]}>
            <Text style={{ color: activeTheme.colors.text.primary }}>
              {shortDesc || 'No short description'}
            </Text>
          </View>

          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Drafts Queue Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drafts (Broadcast Queue)</Text>
          
          {queueChapters.length === 0 ? (
            <Text style={styles.emptyText}>
              No drafts in broadcast queue.{'\n'}Use &quot;To Broadcast&quot; from chapter editor to add drafts here.
            </Text>
          ) : (
            queueChapters.map((chapter) => (
              <View key={chapter!.id} style={styles.draftItem}>
                <View style={styles.dragHandle}>
                  <GripVertical size={16} color={activeTheme.colors.text.muted} />
                </View>
                <View style={styles.draftInfo}>
                  <Text style={styles.draftTitle}>{chapter!.title}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Special Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special</Text>
          
          <View style={styles.specialButtons}>
            <TouchableOpacity style={[styles.specialButton, styles.onAirButton]} onPress={handleOnAir}>
              <Send size={16} color="#000" />
              <Text style={[styles.specialButtonText, { color: '#000' }]}>On Air</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.specialButton} onPress={handleSettings}>
              <Settings size={16} color={activeTheme.colors.text.primary} />
              <Text style={styles.specialButtonText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.specialButton} onPress={handleIntro}>
              <Edit size={16} color={activeTheme.colors.text.primary} />
              <Text style={styles.specialButtonText}>Intro</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
            <Send size={20} color={activeTheme.colors.background} />
            <Text style={styles.publishButtonText}>Publish</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </>
  );
}