import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { goBackOrFallback } from '@/lib/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronDown } from 'lucide-react-native';
import { listProjects } from '@/lib/database';

type ProjectListItem = {
  id: string;
  title: string;
  cover_url: string | null;
  tags: string[];
  short_description: string | null;
  long_description: any[];
  creator_id: string | null;
  updated_at: string;
  chapter_count_published: number;
  chapter_count_all: number;
};

export default function BroadcastRoomScreen() {
  const { activeTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const dbProjects = await listProjects();
        console.log('Broadcast Room: Loaded projects:', dbProjects.length);
        setProjects(dbProjects);
        if (dbProjects.length > 0) {
          setSelectedProject(dbProjects[0]);
        }
      } catch (error) {
        console.error('Broadcast Room: Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };
    void loadProjects();
  }, []);

  const handleSelectProject = (project: ProjectListItem) => {
    setSelectedProject(project);
    setDropdownVisible(false);
  };

  const handleManageBroadcast = () => {
    if (selectedProject) {
      router.push(`/studio/${selectedProject.id}/broadcast` as any);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
      paddingTop: insets.top,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: activeTheme.colors.border,
      marginBottom: 0,
    },
    backButton: {
      padding: 4,
      marginRight: 12,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700' as const,
      color: activeTheme.colors.text.primary,
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
    dropdownButton: {
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownButtonText: {
      fontSize: 16,
      color: activeTheme.colors.text.primary,
      flex: 1,
    },
    dropdownPlaceholder: {
      fontSize: 16,
      color: activeTheme.colors.text.muted,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: activeTheme.colors.surface,
      borderRadius: 12,
      width: '80%',
      maxHeight: '60%',
      overflow: 'hidden',
    },
    modalHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: activeTheme.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: activeTheme.colors.text.primary,
    },
    modalList: {
      maxHeight: 300,
    },
    projectItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: activeTheme.colors.border,
    },
    projectItemSelected: {
      backgroundColor: activeTheme.colors.accent + '20',
    },
    projectItemText: {
      fontSize: 16,
      color: activeTheme.colors.text.primary,
    },
    projectItemMeta: {
      fontSize: 12,
      color: activeTheme.colors.text.muted,
      marginTop: 4,
    },
    manageButton: {
      backgroundColor: '#f59e0b',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    manageButtonText: {
      color: '#000',
      fontSize: 16,
      fontWeight: '600',
    },
    manageButtonDisabled: {
      backgroundColor: activeTheme.colors.border,
    },
    emptyText: {
      color: activeTheme.colors.text.muted,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 40,
    },
    infoText: {
      color: activeTheme.colors.text.muted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => goBackOrFallback(router, '/(tabs)/studio')}>
          <Text style={{ color: activeTheme.colors.text.primary, fontSize: 16 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Studio</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Story</Text>
          
          {projects.length === 0 ? (
            <Text style={styles.emptyText}>
              No stories available.{'\n'}Create a story first to manage broadcasts.
            </Text>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setDropdownVisible(true)}
              >
                {selectedProject ? (
                  <Text style={styles.dropdownButtonText}>{selectedProject.title}</Text>
                ) : (
                  <Text style={styles.dropdownPlaceholder}>Select a story</Text>
                )}
                <ChevronDown size={20} color={activeTheme.colors.text.muted} />
              </TouchableOpacity>

              {selectedProject && (
                <>
                  <Text style={styles.infoText}>
                    Manage broadcast settings, cover image, description, tags, and chapter queue for {`"${selectedProject.title}"`}.
                  </Text>

                  <TouchableOpacity 
                    style={[styles.manageButton, !selectedProject && styles.manageButtonDisabled]}
                    onPress={handleManageBroadcast}
                    disabled={!selectedProject}
                  >
                    <Text style={styles.manageButtonText}>Manage Broadcast</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Story</Text>
            </View>
            <ScrollView style={styles.modalList}>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectItem,
                    selectedProject?.id === project.id && styles.projectItemSelected
                  ]}
                  onPress={() => handleSelectProject(project)}
                >
                  <Text style={styles.projectItemText}>{project.title}</Text>
                  <Text style={styles.projectItemMeta}>
                    {project.chapter_count_published || 0} published • {project.chapter_count_all || 0} total chapters
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
    </>
  );
}
