import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createChapter } from '@/lib/database';



export default function NewChapterScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!projectId) {
      console.error('No projectId provided');
      router.back();
      return;
    }

    // Immediately create a new chapter and redirect to edit
    const createAndRedirect = async () => {
      try {
        console.log('Creating new chapter for project:', projectId);
        const result = createChapter(projectId, { title: '' });
        console.log('New chapter created:', result.id);
        
        // Navigate to the edit screen for the new chapter
        router.replace(`/create/project/${projectId}/chapters/${result.id}/edit`);
      } catch (error) {
        console.error('Error creating chapter:', error);
        router.back();
      }
    };

    createAndRedirect();
  }, [projectId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Creating new chapter...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});