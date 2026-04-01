import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { FileText, Download, ArrowLeft } from 'lucide-react-native';
import { getProject, getBroadcastData } from '@/lib/database';
import { toNovelTxt, toBackupJSONL, exportFile } from '@/lib/exporters';

export default function BroadcastSettingsScreen() {
  const { activeTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [exporting, setExporting] = useState(false);

  const handleExportNovel = async () => {
    if (!projectId || exporting) return;
    
    setExporting(true);
    try {
      const project = await getProject(projectId);
      const broadcastData = await getBroadcastData(projectId);
      
      if (!project || !broadcastData || !broadcastData.queue || broadcastData.queue.length === 0) {
        Alert.alert('No Content', 'No chapters in broadcast queue to export.');
        return;
      }

      const queueChapters = broadcastData.queue
        .map((chapterId: string) => project.chapters.find(c => c.id === chapterId))
        .filter(Boolean);

      const allBlocks = queueChapters.flatMap((chapter: any) => (chapter!.scenes ?? []).flatMap((s: any) => s.blocks ?? []));
      const novelContent = toNovelTxt(allBlocks);
      
      await exportFile(novelContent, `${project.title}-novel.txt`, 'text/plain');
      Alert.alert('Success', 'Novel exported successfully!');
    } catch (error) {
      console.error('Error exporting novel:', error);
      Alert.alert('Error', 'Failed to export novel. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportBackup = async () => {
    if (!projectId || exporting) return;
    
    setExporting(true);
    try {
      const project = await getProject(projectId);
      const broadcastData = await getBroadcastData(projectId);
      
      if (!project || !broadcastData || !broadcastData.queue || broadcastData.queue.length === 0) {
        Alert.alert('No Content', 'No chapters in broadcast queue to export.');
        return;
      }

      const queueChapters = broadcastData.queue
        .map((chapterId: string) => project.chapters.find(c => c.id === chapterId))
        .filter(Boolean);

      const allBlocks = queueChapters.flatMap((chapter: any) => (chapter!.scenes ?? []).flatMap((s: any) => s.blocks ?? []));
      const backupContent = toBackupJSONL(allBlocks);
      
      await exportFile(backupContent, `${project.title}-backup.backup`, 'application/json');
      Alert.alert('Success', 'Backup exported successfully!');
    } catch (error) {
      console.error('Error exporting backup:', error);
      Alert.alert('Error', 'Failed to export backup. Please try again.');
    } finally {
      setExporting(false);
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
    helperText: {
      fontSize: 14,
      color: activeTheme.colors.text.muted,
      marginBottom: 16,
      lineHeight: 20,
    },
    exportButton: {
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    exportButtonDisabled: {
      opacity: 0.5,
    },
    exportButtonContent: {
      flex: 1,
    },
    exportButtonTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: activeTheme.colors.text.primary,
      marginBottom: 4,
    },
    exportButtonDescription: {
      fontSize: 13,
      color: activeTheme.colors.text.muted,
      lineHeight: 18,
    },
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Broadcast Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Export On-Air Content</Text>
            <Text style={styles.helperText}>
              Export all chapters currently in your broadcast queue. Novel format is plain text for reading, backup format preserves all block metadata for re-upload.
            </Text>

            <TouchableOpacity 
              style={[styles.exportButton, exporting && styles.exportButtonDisabled]} 
              onPress={handleExportNovel}
              disabled={exporting}
            >
              <FileText size={24} color={activeTheme.colors.text.primary} />
              <View style={styles.exportButtonContent}>
                <Text style={styles.exportButtonTitle}>Export as .txt (Novel)</Text>
                <Text style={styles.exportButtonDescription}>
                  Plain text format with paragraphs and quoted dialogue. Perfect for reading or sharing.
                </Text>
              </View>
              <Download size={20} color={activeTheme.colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.exportButton, exporting && styles.exportButtonDisabled]} 
              onPress={handleExportBackup}
              disabled={exporting}
            >
              <FileText size={24} color={activeTheme.colors.text.primary} />
              <View style={styles.exportButtonContent}>
                <Text style={styles.exportButtonTitle}>Export as .backup (Upload Format)</Text>
                <Text style={styles.exportButtonDescription}>
                  JSONL format with all block metadata, bubble types, and styling. Use for backup or re-upload.
                </Text>
              </View>
              <Download size={20} color={activeTheme.colors.text.muted} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
