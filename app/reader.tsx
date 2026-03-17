import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Animated,
  TextInput,
} from 'react-native';
import { ArrowLeft, ArrowUp, Heart, Bookmark, Settings, Globe, Type, Eye, Headphones, BookText, MessageCircle, ChevronRight } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChapterReader } from '@/components/reader/ChapterReader';
import { useAppStore } from '@/store/app-store';
import { listCharacters } from '@/lib/database';
import { goBackOrFallback } from '@/lib/navigation';
import { Character } from '@/types';

export default function ReaderScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comment, setComment] = useState('');
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const insets = useSafeAreaInsets();
  const { currentProject } = useAppStore();

  useEffect(() => {
    const loadData = async () => {
      if (!currentProject) {
        router.replace('/');
        return;
      }

      try {
        const charactersData = await listCharacters(currentProject.id);
        setCharacters(charactersData);
      } catch (error) {
        console.error('Error loading reader data:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [currentProject]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 200);

    const currentScrollY = offsetY;
    const scrollingDown = currentScrollY > lastScrollY.current && currentScrollY > 50;
    const scrollingUp = currentScrollY < lastScrollY.current;

    if (scrollingDown) {
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (scrollingUp || currentScrollY < 50) {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    lastScrollY.current = currentScrollY;
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      console.log('Comment submitted:', comment);
      setComment('');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!currentProject) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No project selected</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => goBackOrFallback(router, '/(tabs)/explore')}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const firstChapter = currentProject.chapters[0];

  if (!firstChapter) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No chapters available</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => goBackOrFallback(router, '/(tabs)/explore')}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrFallback(router, '/(tabs)/explore')}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.chapterTitle} numberOfLines={1}>
            {firstChapter.title}
          </Text>
          <Text style={styles.chapterMeta}>
            {currentProject.title} • {firstChapter.readTime}m read
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleBookmark}>
            <Bookmark 
              size={20} 
              color="#fff"
              fill={isBookmarked ? "#fff" : "transparent"}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerActionButton} onPress={() => setSettingsVisible(true)}>
            <Settings 
              size={20} 
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.chapterContent}>
          <Text style={styles.chapterTitleLarge}>{firstChapter.title}</Text>
          
          <ChapterReader
            blocks={(firstChapter.blocks || []).sort((a, b) => a.order - b.order)}
            characters={characters}
            globalSpacing={firstChapter.globalSpacing || 0}
            debug={false}
          />
          
          {firstChapter.afterNote && (
            <View style={styles.afterNoteContainer}>
              <Text style={styles.afterNoteTitle}>Author&apos;s Note</Text>
              <Text style={styles.afterNoteText}>{firstChapter.afterNote}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>End of Chapter</Text>
          
          <View style={styles.footerActions}>
            <TouchableOpacity 
              style={[styles.heartButton, isLiked && styles.heartButtonLiked]} 
              onPress={handleLike}
            >
              <Heart 
                size={24} 
                color={isLiked ? "#ef4444" : "#fff"} 
                fill={isLiked ? "#ef4444" : "transparent"}
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.nextChapterButton}>
              <Text style={styles.nextChapterButtonText}>Next Chapter</Text>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsSectionTitle}>Comments</Text>
            
            <View style={styles.topComments}>
              <View style={styles.topCommentItem}>
                <Text style={styles.topCommentAuthor}>Reader123</Text>
                <Text style={styles.topCommentText}>Great chapter! Can&apos;t wait for the next one.</Text>
                <Text style={styles.topCommentTime}>2 hours ago</Text>
              </View>
              
              <View style={styles.topCommentItem}>
                <Text style={styles.topCommentAuthor}>BookLover</Text>
                <Text style={styles.topCommentText}>The plot twist was amazing!</Text>
                <Text style={styles.topCommentTime}>5 hours ago</Text>
              </View>
              
              <View style={styles.topCommentItem}>
                <Text style={styles.topCommentAuthor}>StoryFan</Text>
                <Text style={styles.topCommentText}>This is so well written!</Text>
                <Text style={styles.topCommentTime}>8 hours ago</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.moreCommentsButton}
              onPress={() => setCommentsVisible(true)}
            >
              <MessageCircle size={18} color="#6366f1" />
              <Text style={styles.moreCommentsButtonText}>More Comments (21)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
          <ArrowUp size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reader Settings</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <TouchableOpacity style={styles.settingItem}>
              <Globe size={20} color="#fff" />
              <Text style={styles.settingText}>Auto-Translate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Eye size={20} color="#fff" />
              <Text style={styles.settingText}>Dark/Light Mode</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Type size={20} color="#fff" />
              <Text style={styles.settingText}>Font Resizing</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Eye size={20} color="#fff" />
              <Text style={styles.settingText}>High Color Contrast</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <BookText size={20} color="#fff" />
              <Text style={styles.settingText}>Bionic Reading Mode</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Type size={20} color="#fff" />
              <Text style={styles.settingText}>Dyslexia-Friendly Fonts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <Headphones size={20} color="#fff" />
              <Text style={styles.settingText}>VoiceOver Support</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={commentsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCommentsVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setCommentsVisible(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.commentItem}>
              <Text style={styles.commentAuthor}>Reader123</Text>
              <Text style={styles.commentText}>Great chapter! Can&apos;t wait for the next one.</Text>
              <Text style={styles.commentTime}>2 hours ago</Text>
            </View>
            
            <View style={styles.commentItem}>
              <Text style={styles.commentAuthor}>BookLover</Text>
              <Text style={styles.commentText}>The plot twist was amazing!</Text>
              <Text style={styles.commentTime}>5 hours ago</Text>
            </View>
            
            <View style={styles.commentItem}>
              <Text style={styles.commentAuthor}>StoryFan</Text>
              <Text style={styles.commentText}>This is so well written!</Text>
              <Text style={styles.commentTime}>8 hours ago</Text>
            </View>
          </ScrollView>
          
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity 
              style={styles.commentSubmitButton}
              onPress={handleSubmitComment}
            >
              <Text style={styles.commentSubmitText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  chapterTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chapterMeta: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  chapterContent: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  chapterTitleLarge: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 32,
    lineHeight: 36,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  heartButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    borderRadius: 25,
  },
  heartButtonLiked: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  nextChapterButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  nextChapterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentsSection: {
    width: '100%',
    marginTop: 24,
  },
  commentsSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  topComments: {
    gap: 12,
    marginBottom: 16,
  },
  topCommentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  topCommentAuthor: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  topCommentText: {
    color: '#e5e5e5',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  topCommentTime: {
    color: '#888',
    fontSize: 11,
  },
  moreCommentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  moreCommentsButtonText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  afterNoteContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  afterNoteTitle: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  afterNoteText: {
    color: '#e5e5e5',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalClose: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 16,
  },
  commentItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  commentAuthor: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  commentTime: {
    color: '#666',
    fontSize: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
  },
  commentSubmitButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  commentSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
