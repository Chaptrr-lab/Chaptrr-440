import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { ArrowLeft, Radio } from 'lucide-react-native';
import { getProject } from '@/lib/database';
import { Project } from '@/types';

export default function StudioProjectScreen() {
  const { activeTheme } = useTheme();
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      try {
        const projectData = await getProject(projectId);
        setProject(projectData);
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  const handleBroadcast = () => {
    router.push(`/studio/${projectId}/broadcast` as any);
  };

  const handleOnAir = () => {
    router.push(`/onair/${projectId}` as any);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: activeTheme.colors.text.primary,
      flex: 1,
    },
    onAirButton: {
      backgroundColor: '#f59e0b',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    onAirButtonText: {
      color: '#000',
      fontSize: 16,
      fontWeight: '700',
    },
    broadcastButton: {
      backgroundColor: '#f59e0b',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    broadcastButtonText: {
      color: '#000',
      fontSize: 16,
      fontWeight: '700',
    },
    errorText: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 40,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: activeTheme.colors.text.primary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: activeTheme.colors.text.primary }]}>
          Project not found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{project.title}</Text>
        </View>

        <TouchableOpacity style={styles.onAirButton} onPress={handleOnAir}>
          <Radio size={20} color="#000" />
          <Text style={styles.onAirButtonText}>On Air</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.broadcastButton} onPress={handleBroadcast}>
          <Radio size={20} color="#000" />
          <Text style={styles.broadcastButtonText}>Broadcast Room</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}