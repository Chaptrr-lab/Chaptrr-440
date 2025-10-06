import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, PanResponder, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listProjects, createSampleProject, updateProject } from '@/lib/database';
import { Plus, Trash2, Radio } from 'lucide-react-native';

interface StoryCardProps {
  project: any;
  onPress: () => void;
  onBroadcast: () => void;
  onTrash: () => void;
}

function StoryCard({ project, onPress, onBroadcast, onTrash }: StoryCardProps) {
  const { activeTheme } = useTheme();
  const [translateX] = useState(new Animated.Value(0));
  const SWIPE_THRESHOLD = 72;
  
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        const resistance = Math.abs(gestureState.dx) < 40 ? 0.3 : 1;
        const adjustedDx = gestureState.dx < -40 ? -40 + (gestureState.dx + 40) : gestureState.dx * resistance;
        translateX.setValue(Math.max(adjustedDx, -SWIPE_THRESHOLD));
      } else if (gestureState.dx > 0) {
        const resistance = Math.abs(gestureState.dx) < 40 ? 0.3 : 1;
        const adjustedDx = gestureState.dx > 40 ? 40 + (gestureState.dx - 40) : gestureState.dx * resistance;
        translateX.setValue(Math.min(adjustedDx, SWIPE_THRESHOLD));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -100) {
        Animated.spring(translateX, {
          toValue: -SWIPE_THRESHOLD,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();
      } else if (gestureState.dx > 100) {
        Animated.spring(translateX, {
          toValue: SWIPE_THRESHOLD,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();
      }
    },
  });

  const handleBroadcastPress = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    onBroadcast();
  };

  const handleTrashPress = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    onTrash();
  };

  const styles = StyleSheet.create({
    storyCardContainer: {
      borderRadius: 12,
      marginBottom: 16,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      height: 100,
    },
    swipeActionLeft: {
      position: 'absolute' as const,
      left: -2,
      top: 1,
      bottom: 1,
      width: 82,
      justifyContent: 'center' as const,
      alignItems: 'flex-start' as const,
      paddingLeft: 16,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    },
    swipeActionRight: {
      position: 'absolute' as const,
      right: -2,
      top: 1,
      bottom: 1,
      width: 82,
      justifyContent: 'center' as const,
      alignItems: 'flex-end' as const,
      paddingRight: 16,
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
    },
    swipeActionButton: {
      width: 48,
      height: 48,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    storyCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      height: 100,
    },
    storyCardTouchable: {
      padding: 16,
    },
    storyHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    storyCover: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: activeTheme.colors.border,
      marginRight: 12,
    },
    storyInfo: {
      flex: 1,
    },
    storyTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: activeTheme.colors.text.primary,
      marginBottom: 4,
    },
    storyMeta: {
      fontSize: 12,
      color: activeTheme.colors.text.muted,
    },
  });

  return (
    <View style={styles.storyCardContainer}>
      <View style={[styles.swipeActionLeft, { backgroundColor: '#ef4444' }]}>
        <TouchableOpacity 
          style={styles.swipeActionButton}
          onPress={handleTrashPress}
          activeOpacity={0.9}
        >
          <Trash2 size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.swipeActionRight, { backgroundColor: '#f59e0b' }]}>
        <TouchableOpacity 
          style={styles.swipeActionButton}
          onPress={handleBroadcastPress}
          activeOpacity={0.9}
        >
          <Radio size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <Animated.View 
        style={[styles.storyCard, { backgroundColor: activeTheme.colors.surface, transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={styles.storyCardTouchable}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={styles.storyHeader}>
            <View style={styles.storyCover} />
            <View style={styles.storyInfo}>
              <Text style={styles.storyTitle}>{project.title}</Text>
              <Text style={styles.storyMeta}>
                {project.chapter_count_published || 0} published • {project.chapter_count_all || 0} total
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function StudioScreen() {
  const { activeTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const dbProjects = await listProjects();
        console.log('Studio: Loaded projects:', dbProjects.length);
        setUserProjects(dbProjects);
      } catch (error) {
        console.error('Studio: Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const handleOnAir = () => {
    router.push('/onair');
  };

  const handleBroadcastRoomMain = () => {
    router.push('/studio/broadcast-room');
  };

  const handleBroadcastRoom = (projectId: string) => {
    router.push(`/studio/${projectId}/broadcast`);
  };

  const handleCreateStory = async () => {
    try {
      const result = await createSampleProject();
      console.log('Created new project:', result.id);
      
      const dbProjects = await listProjects();
      setUserProjects(dbProjects);
      
      router.push(`/create/project/${result.id}` as any);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleStoryRowPress = (projectId: string) => {
    router.push(`/create/project/${projectId}/chapters`);
  };
  
  const handleTrashStory = async (projectId: string) => {
    Alert.alert(
      'Move to Trash',
      'Are you sure you want to move this story to trash?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateProject(projectId, { status: 'TRASHED' } as any);
              const dbProjects = await listProjects();
              setUserProjects(dbProjects);
              Alert.alert('Success', 'Story moved to trash');
            } catch (error) {
              console.error('Error trashing story:', error);
              Alert.alert('Error', 'Failed to move story to trash');
            }
          },
        },
      ]
    );
  };

  const handleEarningsAnalytics = () => {
    router.push('/studio/analytics');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },

    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    header: {
      paddingBottom: 16,
    },
    onAirButton: {
      backgroundColor: '#f59e0b',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    onAirButtonText: {
      color: '#000',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    broadcastRoomButton: {
      backgroundColor: '#f59e0b',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
      marginBottom: 24,
    },
    broadcastRoomButtonText: {
      color: '#000',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    sectionTitleRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: activeTheme.colors.text.primary,
    },
    trashIconButton: {
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      padding: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#6366f1',
    },
    emptyState: {
      alignItems: 'center' as const,
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: activeTheme.colors.text.muted,
      textAlign: 'center' as const,
    },
    createStoryButton: {
      backgroundColor: activeTheme.colors.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
      marginBottom: 16,
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
    },
    createStoryButtonText: {
      color: activeTheme.colors.background,
      fontSize: 16,
      fontWeight: '600' as const,
    },
    earningsButton: {
      backgroundColor: activeTheme.colors.surface,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
    },
    earningsButtonText: {
      color: activeTheme.colors.text.primary,
      fontSize: 16,
      fontWeight: '600' as const,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.emptyState, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.onAirButton} onPress={handleOnAir}>
            <Text style={styles.onAirButtonText}>On Air</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.broadcastRoomButton} onPress={handleBroadcastRoomMain}>
            <Text style={styles.broadcastRoomButtonText}>Broadcast Room</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.earningsButton} onPress={handleEarningsAnalytics}>
            <Text style={styles.earningsButtonText}>Earnings / Analytics</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Your Stories</Text>
          <TouchableOpacity 
            style={styles.trashIconButton}
            onPress={() => router.push('/studio/stories-trash' as any)}
          >
            <Trash2 size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.createStoryButton} onPress={handleCreateStory}>
          <Plus size={20} color={activeTheme.colors.background} />
          <View style={{ width: 8 }} />
          <Text style={styles.createStoryButtonText}>Create Story</Text>
        </TouchableOpacity>

        {userProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No stories yet.{'\n'}Create your first story to get started!</Text>
          </View>
        ) : (
          userProjects.map((project) => {
            return (
              <StoryCard
                key={project.id}
                project={project}
                onPress={() => handleStoryRowPress(project.id)}
                onBroadcast={() => handleBroadcastRoom(project.id)}
                onTrash={() => handleTrashStory(project.id)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
