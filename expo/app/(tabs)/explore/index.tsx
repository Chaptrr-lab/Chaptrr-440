import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  useWindowDimensions,
  Modal,
  ScrollView,
  Platform,
  ToastAndroid,
  Alert,
} from 'react-native';
import SafeImage from '@/ui/SafeImage';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Search, Menu, X, ChevronLeft, ChevronRight, User, Coins, Globe, Type, Eye, Headphones, BookText, LayoutGrid, Moon, Sun, BookMarked, Bookmark } from 'lucide-react-native';
import AppLogo from '@/assets/AppLogo';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app-store';
import { mockProjects, generateFeedPosts } from '@/data/mock-data';
import { FeedPost } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';
import { getProject, updateProject } from '@/lib/database';
},{
interface FollowerWhoEngaged {
  id: string;
  name: string;
  avatar: string;
  engagementType: 'liked' | 'subscribed' | 'bookmarked' | 'read';
}

interface FeedCardProps {
  post: FeedPost;
  onLike: () => void;
  onSubscribe: () => void;
  onBookmark: () => void;
  onOpen: () => void;
  onCardPress: () => void;
  isLiked: boolean;
  isSubscribed: boolean;
  isBookmarked: boolean;
  followersWhoEngaged: FollowerWhoEngaged[];
}

// Derive a hook signal label from the post score
function getHookSignal(score: number, isNew: boolean): { label: string; emoji: string } {
  if (isNew && score < 0.4) return { emoji: '✨', label: 'Rising story' };
  if (score >= 0.8) return { emoji: '🔥', label: 'Readers can\'t stop' };
  if (score >= 0.65) return { emoji: '🔥', label: 'Hooked readers' };
  if (score >= 0.5) return { emoji: '🔥', label: 'Most readers continue' };
  if (score >= 0.35) return { emoji: '💎', label: 'Hidden gem' };
  return { emoji: '✨', label: 'Rising story' };
}

const FeedCard = memo(function FeedCard({ post, onLike, onSubscribe, onBookmark, onOpen, onCardPress, isLiked, isSubscribed, isBookmarked }: Omit<FeedCardProps, 'followersWhoEngaged'>) {
  const { project } = post;
  const { height: screenHeight } = useWindowDimensions();
  const cardHeight = screenHeight * 0.72;
  const isNew = Date.now() - new Date(project.createdAt || 0).getTime() < 7 * 24 * 60 * 60 * 1000;
  const signal = getHookSignal(post.score, isNew);

  return (
    <TouchableOpacity style={[styles.card, { height: cardHeight }]} onPress={onCardPress} activeOpacity={0.95} testID={`feed-card-${post.id}`}>
      <SafeImage
        uri={project.cover}
        style={styles.coverImage}
        resizeMode="cover"
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.92)']}
        style={styles.gradient}
        locations={[0.3, 1]}
      />

      {/* Top: author (no follower count on discovery surface) */}
      <TouchableOpacity
        style={styles.creatorInfoTopLeft}
        onPress={(e) => {
          e.stopPropagation();
          router.push(`/author/${project.creator.id}` as any);
        }}
      >
        <SafeImage
          uri={project.creator.avatar}
          style={styles.avatarTopLeft}
          resizeMode="cover"
          fallback={<View style={[styles.avatarTopLeft, { backgroundColor: '#666' }]} />}
        />
        <Text style={styles.creatorNameTopLeft}>{project.creator.name}</Text>
      </TouchableOpacity>

      {/* Wave/signal badge top-right */}
      <View style={styles.signalBadge}>
        <Text style={styles.signalBadgeText}>{signal.emoji} {signal.label}</Text>
      </View>

      <View style={styles.cardContent}>
        {/* Hook text — dominant element per roadmap */}
        <Text style={styles.hookText} numberOfLines={3}>
          {post.hookLine || project.shortDescription || project.description}
        </Text>

        {/* Title — smaller, secondary */}
        <Text style={styles.title} numberOfLines={1}>{project.title}</Text>

        {/* Tags */}
        <View style={styles.tags}>
          {project.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* Actions row */}
        <View style={styles.actions}>
          {/* Read Ch.1 — primary CTA */}
          <TouchableOpacity
            style={styles.readButton}
            onPress={(e) => { e.stopPropagation(); onOpen(); }}
          >
            <BookOpen size={16} color="#000" />
            <Text style={styles.readButtonText}>Read Ch.1</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity
            style={[styles.iconButton, isBookmarked && styles.iconButtonActive]}
            onPress={(e) => { e.stopPropagation(); onBookmark(); }}
          >
            <Bookmark
              size={20}
              color={isBookmarked ? '#f59e0b' : '#fff'}
              fill={isBookmarked ? '#f59e0b' : 'transparent'}
            />
          </TouchableOpacity>

          {/* Not for me */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={(e) => { e.stopPropagation(); onLike(); }}
          >
            <X size={20} color={isLiked ? '#6366f1' : '#aaa'} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ExploreScreen() {
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [activeTab, setActiveTab] = useState<'for-you' | 'trending' | 'new'>('for-you');
  const [subscribedProjects, setSubscribedProjects] = useState<Set<string>>(new Set());
  const [bookmarkedProjects, setBookmarkedProjects] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [introModalVisible, setIntroModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<FeedPost | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [feedFormat, setFeedFormat] = useState<'card' | 'library'>('card');
  const insets = useSafeAreaInsets();
  const { activeTheme, mode, setMode } = useTheme();
  
  const { 
    setProjects, 
    setFeedPosts: setStoreFeedPosts,
    likedProjects, 
    toggleLike, 
    setCurrentProject,
    incrementViews,
    incrementOpens
  } = useAppStore();

  useEffect(() => {
    const loadInitialData = async () => {
      const posts = generateFeedPosts(mockProjects);
      setProjects(mockProjects);
      setStoreFeedPosts(posts);
      setFeedPosts(posts);
      
      const bookmarked = new Set<string>();
      const subscribed = new Set<string>();
      
      for (const post of posts) {
        let project = await getProject(post.project.id);
        if (!project) {
          await updateProject(post.project.id, {
            title: post.project.title,
            cover: post.project.cover || null,
            shortDescription: post.project.shortDescription || post.project.description,
            tags: post.project.tags,
            bookmarked: false,
            subscribed: false
          });
          project = await getProject(post.project.id);
        }
        if (project?.bookmarked) bookmarked.add(post.project.id);
        if (project?.subscribed) subscribed.add(post.project.id);
      }
      
      setBookmarkedProjects(bookmarked);
      setSubscribedProjects(subscribed);
      console.log('[ExploreScreen] Initial data loaded. Bookmarked:', Array.from(bookmarked), 'Subscribed:', Array.from(subscribed));
    };
    
    loadInitialData();
  }, [setProjects, setStoreFeedPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      const posts = generateFeedPosts(mockProjects);
      setFeedPosts(posts);
      setRefreshing(false);
    }, 1000);
  };

  const loadMore = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const { height: screenHeight } = useWindowDimensions();
  const itemHeight = screenHeight * 0.7 + 24;

  const getFollowersWhoEngaged = (projectId: string): FollowerWhoEngaged[] => {
    const mockFollowers: FollowerWhoEngaged[] = [
      { id: 'f1', name: 'John', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face', engagementType: 'liked' },
      { id: 'f2', name: 'Emma', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face', engagementType: 'subscribed' },
      { id: 'f3', name: 'Mike', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=face', engagementType: 'read' },
      { id: 'f4', name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', engagementType: 'bookmarked' },
    ];
    return mockFollowers;
  };

  const handleCardPress = (post: FeedPost) => {
    if (post.project.broadcast?.intro && post.project.broadcast.intro.images.length > 0) {
      setSelectedProject(post);
      setCurrentImageIndex(0);
      setIntroModalVisible(true);
      incrementViews(post.project.id);
    } else {
      setCurrentProject(post.project);
      incrementViews(post.project.id);
      router.push(`/project/${post.project.id}`);
    }
  };

  const handleGoToStory = () => {
    if (selectedProject) {
      setCurrentProject(selectedProject.project);
      incrementOpens(selectedProject.project.id);
      setIntroModalVisible(false);
      router.push(`/project/${selectedProject.project.id}`);
    }
  };

  const handleCloseIntro = () => {
    setIntroModalVisible(false);
    setSelectedProject(null);
    setCurrentImageIndex(0);
  };

  const handleNextImage = () => {
    if (selectedProject?.project.broadcast?.intro?.images) {
      const maxIndex = selectedProject.project.broadcast.intro.images.length - 1;
      setCurrentImageIndex(prev => prev < maxIndex ? prev + 1 : prev);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : prev);
  };

  const handleLike = useCallback((projectId: string) => {
    toggleLike(projectId);
  }, [toggleLike]);

  const handleSubscribe = useCallback(async (projectId: string) => {
    try {
      console.log('[Subscribe] Starting toggle for:', projectId);
      const willSubscribe = !subscribedProjects.has(projectId);
      console.log('[Subscribe] Will subscribe:', willSubscribe);
      
      setSubscribedProjects(prev => {
        const newSet = new Set(prev);
        if (willSubscribe) {
          newSet.add(projectId);
        } else {
          newSet.delete(projectId);
        }
        console.log('[Subscribe] New subscribed set:', Array.from(newSet));
        return newSet;
      });
      
      const { updateProject } = await import('@/lib/database');
      await updateProject(projectId, { subscribed: willSubscribe });
      
      const message = willSubscribe ? 'Subscribed to updates' : 'Unsubscribed';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', message);
      }
      console.log('[Subscribe] Updated successfully:', { projectId, subscribed: willSubscribe });
    } catch (e) {
      console.error('[Subscribe] Toggle failed:', e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      
      setSubscribedProjects(prev => {
        const newSet = new Set(prev);
        if (!subscribedProjects.has(projectId)) {
          newSet.delete(projectId);
        } else {
          newSet.add(projectId);
        }
        return newSet;
      });
      
      if (Platform.OS === 'android') {
        ToastAndroid.show(`Failed to subscribe: ${errorMsg}`, ToastAndroid.LONG);
      } else {
        Alert.alert('Error', `Failed to subscribe: ${errorMsg}`);
      }
    }
  }, [subscribedProjects]);

  const handleOpenProject = useCallback((post: FeedPost) => {
    setCurrentProject(post.project);
    incrementOpens(post.project.id);
    router.push(`/project/${post.project.id}`);
  }, [setCurrentProject, incrementOpens]);

  const handleBookmark = useCallback(async (projectId: string) => {
    try {
      console.log('[Bookmark] Starting toggle for:', projectId);
      const willBookmark = !bookmarkedProjects.has(projectId);
      console.log('[Bookmark] Will bookmark:', willBookmark);
      
      setBookmarkedProjects(prev => {
        const next = new Set(prev);
        if (willBookmark) {
          next.add(projectId);
        } else {
          next.delete(projectId);
        }
        console.log('[Bookmark] New bookmarked set:', Array.from(next));
        return next;
      });
      
      const { updateProject } = await import('@/lib/database');
      await updateProject(projectId, { bookmarked: willBookmark });
      
      const message = willBookmark ? 'Added to Bookmarks' : 'Removed from Bookmarks';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', message);
      }
      console.log('[Bookmark] Updated successfully:', { projectId, bookmarked: willBookmark });
    } catch (e) {
      console.error('[Bookmark] Toggle failed:', e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      
      setBookmarkedProjects(prev => {
        const next = new Set(prev);
        if (!bookmarkedProjects.has(projectId)) {
          next.delete(projectId);
        } else {
          next.add(projectId);
        }
        return next;
      });
      
      if (Platform.OS === 'android') {
        ToastAndroid.show(`Failed to bookmark: ${errorMsg}`, ToastAndroid.LONG);
      } else {
        Alert.alert('Error', `Failed to bookmark: ${errorMsg}`);
      }
    }
  }, [bookmarkedProjects]);

  const handleSearchPress = () => {
    router.push('/(tabs)/explore/search');
  };

  const handleMenuPress = () => {
    setMenuVisible(true);
  };

  const handleCloseMenu = () => {
    setMenuVisible(false);
  };

  if (feedPosts.length === 0) {
    return (
      <View style={[styles.loading, { backgroundColor: activeTheme.colors.background }]}>
        <Text style={[styles.loadingText, { color: activeTheme.colors.text.primary }]}>Loading stories...</Text>
      </View>
    );
  }

  if (feedFormat === 'library') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: activeTheme.colors.background }]}>
        <StatusBar 
          barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor={activeTheme.colors.background} 
        />
        
        <View style={styles.topBar}>
          <View style={styles.logoContainer}>
            <AppLogo width={40} height={40} />
          </View>
          <View style={styles.centerTitleContainer}>
            <Text style={[styles.centerTitle, { color: activeTheme.colors.text.primary }]}>Story</Text>
          </View>
          <View style={styles.rightActionsHeader}>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
              <Search size={24} color={activeTheme.colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={handleMenuPress}>
              <Menu size={24} color={activeTheme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.libraryView} showsVerticalScrollIndicator={false}>
          {['New', 'Trending', 'Fantasy', 'Romance', 'Adventure', 'Mystery', 'Sci-Fi', 'Drama'].map((genre, genreIndex) => {
            let genreProjects: FeedPost[] = [];
            if (genre === 'New') {
              genreProjects = [...feedPosts].sort((a, b) => 
                new Date(b.project.createdAt || 0).getTime() - new Date(a.project.createdAt || 0).getTime()
              ).slice(0, 4);
            } else if (genre === 'Trending') {
              genreProjects = [...feedPosts].sort((a, b) => 
                (b.project.stats.views + b.project.stats.likes * 2) - (a.project.stats.views + a.project.stats.likes * 2)
              ).slice(0, 4);
            } else {
              const startIdx = (genreIndex * 2) % feedPosts.length;
              genreProjects = feedPosts.slice(startIdx, startIdx + 4).concat(
                feedPosts.slice(0, Math.max(0, 4 - (feedPosts.length - startIdx)))
              ).slice(0, 4);
            }
            return (
              <View key={`shelf-${genre}`} style={styles.shelfSection}>
                <Text style={[styles.shelfTitle, { color: activeTheme.colors.text.primary }]}>{genre}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfScroll}>
                  {genreProjects.map((post, idx) => (
                    <TouchableOpacity 
                      key={`${genre}-${post.project.id}-${idx}`}
                      style={styles.libraryCard}
                      onPress={() => handleCardPress(post)}
                    >
                      <SafeImage 
                        uri={post.project.cover} 
                        style={styles.libraryCardCover}
                        resizeMode="cover"
                      />
                      <Text style={[styles.libraryCardTitle, { color: activeTheme.colors.text.primary }]} numberOfLines={2}>
                        {post.project.title}
                      </Text>
                      <Text style={[styles.libraryCardCreator, { color: activeTheme.colors.text.secondary }]} numberOfLines={1}>
                        {post.project.creator.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })}</ScrollView>

        <Modal
          visible={menuVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseMenu}
        >
          <View style={[styles.menuModal, { backgroundColor: activeTheme.colors.background, paddingTop: insets.top }]}>
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: activeTheme.colors.text.primary }]}>Menu</Text>
              <TouchableOpacity onPress={handleCloseMenu} style={styles.menuCloseButton}>
                <X size={24} color={activeTheme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
              <View style={styles.coinsSection}>
                <View style={styles.coinsHeader}>
                  <Coins size={24} color="#f59e0b" />
                  <Text style={styles.coinsTitle}>Coins</Text>
                </View>
                <Text style={[styles.coinsBalance, { color: activeTheme.colors.text.primary }]}>1,000</Text>
              </View>

              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
                onPress={() => { handleCloseMenu(); router.push('/profile'); }}
              >
                <User size={20} color={activeTheme.colors.text.primary} />
                <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Profile</Text>
              </TouchableOpacity>

              <View style={[styles.menuSectionDivider, { backgroundColor: activeTheme.colors.border }]} />

              <Text style={[styles.menuSectionTitle, { color: activeTheme.colors.text.secondary }]}>App Settings</Text>
              
              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
                onPress={() => { handleCloseMenu(); router.push('/profile/settings'); }}
              >
                <Globe size={20} color={activeTheme.colors.text.primary} />
                <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>App Language</Text>
              </TouchableOpacity>

              <View style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}>
                {mode === 'dark' ? <Moon size={20} color={activeTheme.colors.text.primary} /> : <Sun size={20} color={activeTheme.colors.text.primary} />}
                <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Dark/Light Mode</Text>
                <View style={styles.spacer} />
                <TouchableOpacity 
                  style={[styles.themeToggle, { backgroundColor: mode === 'dark' ? '#6366f1' : '#e5e7eb' }]}
                  onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.themeToggleThumb, { 
                    backgroundColor: '#fff',
                    transform: [{ translateX: mode === 'dark' ? 20 : 0 }]
                  }]} />
                </TouchableOpacity>
              </View>

              <View style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}>
                <LayoutGrid size={20} color={activeTheme.colors.text.primary} />
                <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Feed Format</Text>
                <View style={styles.spacer} />
                <TouchableOpacity 
                  style={[styles.themeToggle, { backgroundColor: (feedFormat as string) !== 'card' ? '#6366f1' : '#e5e7eb' }]}
                  onPress={() => setFeedFormat((prev) => (prev === 'card' ? 'library' : 'card'))}
                  activeOpacity={0.7}
                >
                  <View style={[styles.themeToggleThumb, { 
                    backgroundColor: '#fff',
                    transform: [{ translateX: (feedFormat as string) !== 'card' ? 20 : 0 }]
                  }]} />
                </TouchableOpacity>
              </View>

              <View style={[styles.menuSectionDivider, { backgroundColor: activeTheme.colors.border }]} />

              <Text style={[styles.menuSectionTitle, { color: activeTheme.colors.text.secondary }]}>Accessibility</Text>
              
              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
                onPress={() => Alert.alert('Font Resizing', 'This feature will be available soon')}
              >
                <Type size={20} color={activeTheme.colors.text.primary} />
                <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Font Resizing</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
                onPress={() => Alert.alert('High Color Contrast', 'This feature will be available soon')}
              >
                <Eye size={20} color={activeTheme.colors.text.primary} />
                <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>High Color Contrast</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
                onPress={() => Alert.alert('Bionic Reading', 'This feature will be available soon')}
              >
                <BookText size={20} color={activeTheme.colors.text.primary} />
                <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Bionic Reading Mode</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
                onPress={() => Alert.alert('Dyslexia-Friendly Fonts', 'This feature will be available soon')}
              >
                <Type size={20} color={activeTheme.colors.text.primary} />
                <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Dyslexia-Friendly Fonts</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
                onPress={() => Alert.alert('VoiceOver Support', 'This feature will be available soon')}
              >
                <Headphones size={20} color={activeTheme.colors.text.primary} />
                <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>VoiceOver Support</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: activeTheme.colors.background }]}>
      <StatusBar 
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={activeTheme.colors.background} 
      />
      
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <AppLogo width={40} height={40} />
        </View>
        <View style={styles.centerTitleContainer}>
          <Text style={[styles.centerTitle, { color: activeTheme.colors.text.primary }]}>Story</Text>
        </View>
        <View style={styles.rightActionsHeader}>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
            <Search size={24} color={activeTheme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={handleMenuPress}>
            <Menu size={24} color={activeTheme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.feedTabsWrapper}>
        <LinearGradient
          colors={[
            mode === 'dark' ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            'transparent'
          ]}
          style={styles.tabsGradientBg}
          pointerEvents="none"
        />
        <View style={[styles.feedTabsTop, { borderBottomColor: activeTheme.colors.border }]}>
          <TouchableOpacity 
          style={[
            styles.feedTab, 
            activeTab === 'for-you' 
              ? styles.feedTabActive 
              : (mode === 'light' ? styles.feedTabInactiveLight : styles.feedTabInactive)
          ]}
          onPress={() => setActiveTab('for-you')}
          testID="tabForYou"
        >
          <Text style={[styles.feedTabText, { color: activeTheme.colors.text.secondary }, activeTab === 'for-you' && { color: activeTheme.colors.text.primary }]}>
            For You
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.feedTab, 
            activeTab === 'trending' 
              ? styles.feedTabActive 
              : (mode === 'light' ? styles.feedTabInactiveLight : styles.feedTabInactive)
          ]}
          onPress={() => setActiveTab('trending')}
          testID="tabTrending"
        >
          <Text style={[styles.feedTabText, { color: activeTheme.colors.text.secondary }, activeTab === 'trending' && { color: activeTheme.colors.text.primary }]}>
            Trending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.feedTab, 
            activeTab === 'new' 
              ? styles.feedTabActive 
              : (mode === 'light' ? styles.feedTabInactiveLight : styles.feedTabInactive)
          ]}
          onPress={() => setActiveTab('new')}
          testID="tabExplore"
        >
          <Text style={[styles.feedTabText, { color: activeTheme.colors.text.secondary }, activeTab === 'new' && { color: activeTheme.colors.text.primary }]}>
            Explore
          </Text>
        </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={feedPosts}
        keyExtractor={(item, index) => item.id || `feed-${index}`}
        renderItem={({ item }) => (
          <FeedCard
            post={item}
            onLike={() => handleLike(item.project.id)}
            onSubscribe={() => handleSubscribe(item.project.id)}
            onBookmark={() => handleBookmark(item.project.id)}
            onOpen={() => handleOpenProject(item)}
            onCardPress={() => handleCardPress(item)}
            isLiked={likedProjects.has(item.project.id)}
            isSubscribed={subscribedProjects.has(item.project.id)}
            isBookmarked={bookmarkedProjects.has(item.project.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        windowSize={10}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={3}
        getItemLayout={(data, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        style={styles.feedList}
      />

      <Modal
        visible={introModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseIntro}
      >
        {selectedProject && (
          <View style={[styles.introModal, { backgroundColor: activeTheme.colors.background }]}>
            <TouchableOpacity 
              style={[styles.closeButton, { top: insets.top + 10 }]}
              onPress={handleCloseIntro}
            >
              <X size={24} color={activeTheme.colors.text.primary} />
            </TouchableOpacity>

            <ScrollView 
              style={styles.introContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: insets.top + 60 }}
            >
              {selectedProject.project.broadcast?.intro?.images && selectedProject.project.broadcast.intro.images.length > 0 && (
                <View style={styles.imageCarousel}>
                  <View style={styles.imageContainer}>
                    <SafeImage 
                      uri={selectedProject.project.broadcast.intro.images[currentImageIndex]}
                      style={styles.introImage}
                      resizeMode="cover"
                    />
                    
                    {selectedProject.project.broadcast.intro.swipe === 'right' && selectedProject.project.broadcast.intro.images.length > 1 && (
                      <>
                        {currentImageIndex > 0 && (
                          <TouchableOpacity 
                            style={[styles.navButton, styles.navButtonLeft]}
                            onPress={handlePrevImage}
                          >
                            <ChevronLeft size={24} color="#fff" />
                          </TouchableOpacity>
                        )}
                        {currentImageIndex < selectedProject.project.broadcast.intro.images.length - 1 && (
                          <TouchableOpacity 
                            style={[styles.navButton, styles.navButtonRight]}
                            onPress={handleNextImage}
                          >
                            <ChevronRight size={24} color="#fff" />
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                  
                  {selectedProject.project.broadcast.intro.images.length > 1 && (
                    <View style={styles.imageIndicators}>
                      {selectedProject.project.broadcast.intro.images.map((_, index) => (
                        <View 
                          key={index}
                          style={[
                            styles.indicator,
                            {
                              backgroundColor: index === currentImageIndex 
                                ? activeTheme.colors.accent 
                                : activeTheme.colors.text.muted
                            }
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}

              {selectedProject.project.broadcast?.intro?.longDesc && (
                <View style={styles.descriptionSection}>
                  <Text style={[styles.longDescription, { color: activeTheme.colors.text.primary }]}>
                    {selectedProject.project.broadcast.intro.longDesc}
                  </Text>
                </View>
              )}

              <View style={styles.actionSection}>
                <TouchableOpacity style={[styles.goToStoryButton, { backgroundColor: activeTheme.colors.accent }]} onPress={handleGoToStory}>
                  <BookOpen size={20} color={activeTheme.colors.background} />
                  <Text style={[styles.goToStoryText, { color: activeTheme.colors.background }]}>Go to Story</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal
        visible={menuVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseMenu}
      >
        <View style={[styles.menuModal, { backgroundColor: activeTheme.colors.background, paddingTop: insets.top }]}>
          <View style={styles.menuHeader}>
            <Text style={[styles.menuTitle, { color: activeTheme.colors.text.primary }]}>Menu</Text>
            <TouchableOpacity onPress={handleCloseMenu} style={styles.menuCloseButton}>
              <X size={24} color={activeTheme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
            <View style={styles.coinsSection}>
              <View style={styles.coinsHeader}>
                <Coins size={24} color="#f59e0b" />
                <Text style={styles.coinsTitle}>Coins</Text>
              </View>
              <Text style={[styles.coinsBalance, { color: activeTheme.colors.text.primary }]}>1,000</Text>
            </View>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
              onPress={() => { handleCloseMenu(); router.push('/profile'); }}
            >
              <User size={20} color={activeTheme.colors.text.primary} />
              <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Profile</Text>
            </TouchableOpacity>

            <View style={[styles.menuSectionDivider, { backgroundColor: activeTheme.colors.border }]} />

            <Text style={[styles.menuSectionTitle, { color: activeTheme.colors.text.secondary }]}>App Settings</Text>
            
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
              onPress={() => { handleCloseMenu(); router.push('/profile/settings'); }}
            >
              <Globe size={20} color={activeTheme.colors.text.primary} />
              <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>App Language</Text>
            </TouchableOpacity>

            <View style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}>
              {mode === 'dark' ? <Moon size={20} color={activeTheme.colors.text.primary} /> : <Sun size={20} color={activeTheme.colors.text.primary} />}
              <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Dark/Light Mode</Text>
              <View style={styles.spacer} />
              <TouchableOpacity 
                style={[styles.themeToggle, { backgroundColor: mode === 'dark' ? '#6366f1' : '#e5e7eb' }]}
                onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                activeOpacity={0.7}
              >
                <View style={[styles.themeToggleThumb, { 
                  backgroundColor: '#fff',
                  transform: [{ translateX: mode === 'dark' ? 20 : 0 }]
                }]} />
              </TouchableOpacity>
            </View>

            <View style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}>
              <LayoutGrid size={20} color={activeTheme.colors.text.primary} />
              <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Feed Format</Text>
              <View style={styles.spacer} />
              <TouchableOpacity 
                style={[styles.themeToggle, { backgroundColor: (feedFormat as string) !== 'card' ? '#6366f1' : '#e5e7eb' }]}
                onPress={() => setFeedFormat((prev) => (prev === 'card' ? 'library' : 'card'))}
                activeOpacity={0.7}
              >
                <View style={[styles.themeToggleThumb, { 
                  backgroundColor: '#fff',
                  transform: [{ translateX: (feedFormat as string) !== 'card' ? 20 : 0 }]
                }]} />
              </TouchableOpacity>
            </View>

            <View style={[styles.menuSectionDivider, { backgroundColor: activeTheme.colors.border }]} />

            <Text style={[styles.menuSectionTitle, { color: activeTheme.colors.text.secondary }]}>Accessibility</Text>
            
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
              onPress={() => Alert.alert('Font Resizing', 'This feature will be available soon')}
            >
              <Type size={20} color={activeTheme.colors.text.primary} />
              <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Font Resizing</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
              onPress={() => Alert.alert('High Color Contrast', 'This feature will be available soon')}
            >
              <Eye size={20} color={activeTheme.colors.text.primary} />
              <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>High Color Contrast</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
              onPress={() => Alert.alert('Bionic Reading', 'This feature will be available soon')}
            >
              <BookText size={20} color={activeTheme.colors.text.primary} />
              <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Bionic Reading Mode</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
              onPress={() => Alert.alert('Dyslexia-Friendly Fonts', 'This feature will be available soon')}
            >
              <Type size={20} color={activeTheme.colors.text.primary} />
              <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>Dyslexia-Friendly Fonts</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: activeTheme.colors.border }]}
              onPress={() => Alert.alert('VoiceOver Support', 'This feature will be available soon')}
            >
              <Headphones size={20} color={activeTheme.colors.text.primary} />
              <Text style={[styles.menuItemText, { color: activeTheme.colors.text.primary }]}>VoiceOver Support</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    zIndex: 20,
  },
  logo: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  searchButton: {
    padding: 4,
    marginRight: 16,
  },
  profileButton: {
    padding: 4,
  },
  feedList: {
    flex: 1,
    marginTop: -60,
    paddingTop: 60,
  },
  card: {
    width: '100%',
    position: 'relative',
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  // Hook signal badge (top-right of card)
  signalBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  signalBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Hook text — dominant element
  hookText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  // Read Ch.1 button
  readButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  readButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  followers: {
    color: '#ccc',
    fontSize: 14,
  },
  projectInfo: {
    marginBottom: 16,
  },
  shortDescription: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  title: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followersEngaged: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  followerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreFollowers: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreFollowersText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 25,
  },
  openButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  openButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  feedTabsWrapper: {
    position: 'relative',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  tabsGradientBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    height: 60,
  },
  feedTabsTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 2,
    marginBottom: 16,
  },
  feedTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  feedTabActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
  },
  feedTabInactive: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  feedTabInactiveLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  feedTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  introModal: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  introContent: {
    flex: 1,
  },
  imageCarousel: {
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 400,
    marginBottom: 16,
  },
  introImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    transform: [{ translateY: -20 }],
  },
  navButtonLeft: {
    left: 10,
  },
  navButtonRight: {
    right: 10,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  longDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  goToStoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  goToStoryText: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoContainer: {
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  centerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  rightActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    justifyContent: 'flex-end',
  },
  menuModal: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  menuCloseButton: {
    padding: 4,
  },
  menuContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  coinsSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  coinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coinsTitle: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  coinsBalance: {
    fontSize: 32,
    fontWeight: '800',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  menuSectionDivider: {
    height: 1,
    marginVertical: 16,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  spacer: {
    flex: 1,
  },
  themeToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  themeToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  libraryView: {
    flex: 1,
  },
  shelfSection: {
    marginBottom: 32,
  },
  shelfTitle: {
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  shelfScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  libraryCard: {
    width: 120,
  },
  libraryCardCover: {
    width: 120,
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },
  libraryCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  libraryCardCreator: {
    fontSize: 12,
  },
  creatorInfoTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  avatarTopLeft: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  creatorDetailsTopLeft: {
    flex: 1,
  },
  creatorNameTopLeft: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  followersTopLeft: {
    color: '#fff',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
