import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useAppStore } from '@/store/app-store';
import SafeImage from '@/ui/SafeImage';
import { ArrowLeft } from 'lucide-react-native';

export default function ReadingHistoryScreen() {
  const { activeTheme } = useTheme();
  const { projects, setCurrentProject } = useAppStore();

  const readingHistory = [
    { id: '1', project: projects[0], chapterTitle: 'The Breaking Point', timestamp: '2 hours ago' },
    { id: '2', project: projects[1], chapterTitle: 'Shibuya Crossing', timestamp: '1 day ago' },
    { id: '3', project: projects[2], chapterTitle: 'The 100-Item Challenge', timestamp: '3 days ago' },
    { id: '4', project: projects[0], chapterTitle: 'New Beginnings', timestamp: '5 days ago' },
    { id: '5', project: projects[1], chapterTitle: 'Tokyo Nights', timestamp: '1 week ago' },
    { id: '6', project: projects[2], chapterTitle: 'Minimalist Journey', timestamp: '2 weeks ago' },
  ];

  const handleHistoryPress = (item: any) => {
    setCurrentProject(item.project);
    router.push('/reader');
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.historyItem, { backgroundColor: activeTheme.colors.card }]}
      onPress={() => handleHistoryPress(item)}
    >
      <SafeImage 
        uri={item.project.cover} 
        style={styles.historyThumbnail}
        resizeMode="cover"
        fallback={<View style={[styles.historyThumbnail, { backgroundColor: '#333' }]} />}
      />
      <View style={styles.historyInfo}>
        <Text style={[styles.historyChapter, { color: activeTheme.colors.text.primary }]} numberOfLines={1}>
          {item.chapterTitle}
        </Text>
        <Text style={[styles.historyProject, { color: activeTheme.colors.text.secondary }]} numberOfLines={1}>
          {item.project.title}
        </Text>
        <Text style={[styles.historyTime, { color: activeTheme.colors.text.muted }]}>{item.timestamp}</Text>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    listContent: {
      padding: 20,
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    historyThumbnail: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: 12,
    },
    historyInfo: {
      flex: 1,
    },
    historyChapter: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    historyProject: {
      fontSize: 14,
      marginBottom: 4,
    },
    historyTime: {
      fontSize: 12,
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Reading History',
          headerStyle: { backgroundColor: activeTheme.colors.background },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: { fontWeight: '700' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <FlatList
        data={readingHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
