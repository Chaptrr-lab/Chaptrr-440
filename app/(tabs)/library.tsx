import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import SafeImage from '@/ui/SafeImage';
import { BookOpen, ChevronRight, Bookmark, CheckCircle, XCircle, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app-store';
import { Project } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';

type Shelf = 'reading' | 'want-to-read' | 'finished' | 'dropped';

interface ShelfCardProps {
  project: Project;
  shelf: Shelf;
  progress?: number;
  onPress: () => void;
  onContinue?: () => void;
  onLongPress: () => void;
}

const ShelfCard = memo(function ShelfCard({
  project,
  shelf,
  progress = 0,
  onPress,
  onContinue,
  onLongPress,
}: ShelfCardProps) {
  const { activeTheme } = useTheme();
  const completedChapters = Math.round(progress * (project.chapters.length || 1));

  return (
    <TouchableOpacity
      style={[styles.shelfCard, { backgroundColor: activeTheme.colors.card }]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      activeOpacity={0.85}
    >
      <SafeImage
        uri={project.cover}
        style={styles.shelfCover}
        resizeMode="cover"
        fallback={<View style={[styles.shelfCover, { backgroundColor: '#333' }]} />}
      />
      <View style={styles.shelfCardInfo}>
        <Text
          style={[styles.shelfCardTitle, { color: activeTheme.colors.text.primary }]}
          numberOfLines={2}
        >
          {project.title}
        </Text>
        <Text
          style={[styles.shelfCardAuthor, { color: activeTheme.colors.text.secondary }]}
          numberOfLines={1}
        >
          {project.creator.name}
        </Text>

        {shelf === 'reading' && (
          <>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={[styles.progressLabel, { color: activeTheme.colors.text.muted }]}>
              Ch.{completedChapters} of {project.chapters.length}
            </Text>
          </>
        )}

        {shelf === 'want-to-read' && (
          <Text style={[styles.shelfTagLabel, { color: activeTheme.colors.text.muted }]}>
            {project.chapters.length} chapters
          </Text>
        )}

        {shelf === 'finished' && (
          <Text style={[styles.shelfTagLabel, { color: '#10b981' }]}>✓ Finished</Text>
        )}

        {shelf === 'dropped' && (
          <Text style={[styles.shelfTagLabel, { color: '#888' }]}>Dropped</Text>
        )}
      </View>

      {shelf === 'reading' && onContinue && (
        <TouchableOpacity
          style={styles.resumeBtn}
          onPress={(e) => {
            e.stopPropagation();
            onContinue();
          }}
        >
          <BookOpen size={14} color="#fff" />
          <Text style={styles.resumeBtnText}>Resume</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

// ─── Long-press action sheet ────────────────────────────────────────────────
interface ActionSheetAction {
  label: string;
  icon: React.ComponentType<any>;
  color?: string;
  onPress: () => void;
}

function ShelfActionSheet({
  visible,
  project,
  currentShelf,
  onClose,
  onMove,
  onRemove,
}: {
  visible: boolean;
  project: Project | null;
  currentShelf: Shelf;
  onClose: () => void;
  onMove: (shelf: Shelf) => void;
  onRemove: () => void;
}) {
  const { activeTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!project) return null;

  const ALL_MOVE_OPTIONS: { shelf: Shelf; label: string; icon: React.ComponentType<any>; color: string }[] = [
    { shelf: 'want-to-read', label: 'Move to Want to Read', icon: Bookmark, color: '#818cf8' },
    { shelf: 'finished', label: 'Move to Finished', icon: CheckCircle, color: '#10b981' },
    { shelf: 'dropped', label: 'Move to Dropped', icon: XCircle, color: '#f59e0b' },
  ];
  const MOVE_OPTIONS = ALL_MOVE_OPTIONS.filter((o) => o.shelf !== currentShelf);

  const c = activeTheme.colors;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: c.surface, paddingBottom: insets.bottom + 8, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
        <Text style={[styles.sheetProjectTitle, { color: c.text.primary }]} numberOfLines={1}>
          {project.title}
        </Text>

        {MOVE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <TouchableOpacity
              key={opt.shelf}
              style={[styles.sheetRow, { borderColor: c.border }]}
              onPress={() => { onMove(opt.shelf); onClose(); }}
              activeOpacity={0.7}
            >
              <Icon size={20} color={opt.color} />
              <Text style={[styles.sheetRowLabel, { color: c.text.primary }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.sheetRow, styles.sheetRowDanger, { borderColor: c.border }]}
          onPress={() => { onRemove(); onClose(); }}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#ef4444" />
          <Text style={[styles.sheetRowLabel, { color: '#ef4444' }]}>Remove from Shelf</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sheetCancel} onPress={onClose} activeOpacity={0.7}>
          <Text style={[styles.sheetCancelText, { color: c.text.muted }]}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─── Shelf tab config ────────────────────────────────────────────────────────
const SHELF_TABS: { key: Shelf; label: string }[] = [
  { key: 'reading', label: 'Reading' },
  { key: 'want-to-read', label: 'Want to Read' },
  { key: 'finished', label: 'Finished' },
  { key: 'dropped', label: 'Dropped' },
];

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const [activeShelf, setActiveShelf] = useState<Shelf>('reading');
  const insets = useSafeAreaInsets();
  const { projects, setCurrentProject, setCurrentChapterIndex } = useAppStore();
  const { activeTheme } = useTheme();

  // shelf state: project id → current shelf
  const [shelfMap, setShelfMap] = useState<Record<string, Shelf>>(() => {
    const map: Record<string, Shelf> = {};
    projects.slice(0, 3).forEach((p) => { map[p.id] = 'reading'; });
    projects.slice(3, 6).forEach((p) => { map[p.id] = 'want-to-read'; });
    projects.slice(6, 8).forEach((p) => { map[p.id] = 'finished'; });
    projects.slice(8, 9).forEach((p) => { map[p.id] = 'dropped'; });
    return map;
  });

  const shelfProjects = React.useMemo(() => {
    const map: Record<Shelf, Project[]> = {
      reading: [],
      'want-to-read': [],
      finished: [],
      dropped: [],
    };
    Object.entries(shelfMap).forEach(([id, shelf]) => {
      const project = projects.find((p) => p.id === id);
      if (project) map[shelf].push(project);
    });
    return map;
  }, [shelfMap, projects]);

  const mockProgress: Record<string, number> = {
    [projects[0]?.id]: 0.35,
    [projects[1]?.id]: 0.72,
    [projects[2]?.id]: 0.1,
  };

  const inProgressStory = shelfProjects['reading'][0];
  const inProgressProgress = inProgressStory ? (mockProgress[inProgressStory.id] ?? 0.35) : 0;

  // Long-press sheet state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const handleLongPress = useCallback((project: Project) => {
    setSelectedProject(project);
    setSheetVisible(true);
  }, []);

  const handleMove = useCallback((shelf: Shelf) => {
    if (!selectedProject) return;
    setShelfMap((prev) => ({ ...prev, [selectedProject.id]: shelf }));
  }, [selectedProject]);

  const handleRemove = useCallback(() => {
    if (!selectedProject) return;
    setShelfMap((prev) => {
      const next = { ...prev };
      delete next[selectedProject.id];
      return next;
    });
  }, [selectedProject]);

  const handleContinue = useCallback((project: Project) => {
    setCurrentProject(project);
    setCurrentChapterIndex(0);
    router.push('/reader');
  }, [setCurrentProject, setCurrentChapterIndex]);

  const handleProjectPress = useCallback((project: Project) => {
    setCurrentProject(project);
    router.push(`/project/${project.id}`);
  }, [setCurrentProject]);

  const currentList = shelfProjects[activeShelf];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: activeTheme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: activeTheme.colors.text.primary }]}>Library</Text>
      </View>

      {/* Continue Reading banner */}
      {activeShelf === 'reading' && inProgressStory && (
        <TouchableOpacity
          style={styles.continueReadingBanner}
          onPress={() => handleContinue(inProgressStory)}
          activeOpacity={0.88}
        >
          <SafeImage
            uri={inProgressStory.cover}
            style={styles.bannerCover}
            resizeMode="cover"
            fallback={<View style={[styles.bannerCover, { backgroundColor: '#333' }]} />}
          />
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerLabel}>Continue Reading</Text>
            <Text style={styles.bannerTitle} numberOfLines={1}>{inProgressStory.title}</Text>
            <View style={styles.bannerProgressBarContainer}>
              <View style={[styles.bannerProgressBarFill, { width: `${Math.round(inProgressProgress * 100)}%` }]} />
            </View>
            <Text style={styles.bannerProgressText}>{Math.round(inProgressProgress * 100)}% complete</Text>
          </View>
          <View style={styles.bannerArrow}>
            <ChevronRight size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Shelf tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {SHELF_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeShelf === tab.key && styles.tabActive]}
            onPress={() => setActiveShelf(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTheme.colors.text.secondary },
                activeShelf === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {shelfProjects[tab.key].length > 0 && (
              <View style={[styles.tabCount, activeShelf === tab.key && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, activeShelf === tab.key && styles.tabCountTextActive]}>
                  {shelfProjects[tab.key].length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Shelf content */}
      {currentList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: activeTheme.colors.text.primary }]}>
            {activeShelf === 'reading' && 'Nothing in progress'}
            {activeShelf === 'want-to-read' && 'Nothing saved yet'}
            {activeShelf === 'finished' && 'No finished stories'}
            {activeShelf === 'dropped' && 'No dropped stories'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: activeTheme.colors.text.secondary }]}>
            {activeShelf === 'reading' && 'Start a story from your feed to see it here.'}
            {activeShelf === 'want-to-read' && 'Tap ♥ Save on any story to add it here.'}
            {activeShelf === 'finished' && 'Stories you\'ve fully completed will appear here.'}
            {activeShelf === 'dropped' && 'Stories you\'ve stopped will appear here.'}
          </Text>
          {(activeShelf === 'reading' || activeShelf === 'want-to-read') && (
            <TouchableOpacity
              style={styles.discoverBtn}
              onPress={() => router.push('/(tabs)/explore' as any)}
            >
              <Text style={styles.discoverBtnText}>Discover Stories →</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ShelfCard
              project={item}
              shelf={activeShelf}
              progress={mockProgress[item.id] ?? 0}
              onPress={() => handleProjectPress(item)}
              onContinue={activeShelf === 'reading' ? () => handleContinue(item) : undefined}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Long-press action sheet */}
      <ShelfActionSheet
        visible={sheetVisible}
        project={selectedProject}
        currentShelf={selectedProject ? (shelfMap[selectedProject.id] ?? activeShelf) : activeShelf}
        onClose={() => setSheetVisible(false)}
        onMove={handleMove}
        onRemove={handleRemove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  // Continue Reading banner
  continueReadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  bannerCover: { width: 52, height: 72, borderRadius: 8 },
  bannerInfo: { flex: 1, marginLeft: 12 },
  bannerLabel: {
    color: '#6366f1',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  bannerTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  bannerProgressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 4,
  },
  bannerProgressBarFill: { height: 3, backgroundColor: '#6366f1', borderRadius: 2 },
  bannerProgressText: { color: '#888', fontSize: 11 },
  bannerArrow: { paddingLeft: 8 },
  // Tabs
  tabsScroll: { flexGrow: 0, marginBottom: 8 },
  tabsContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
  },
  tabText: { fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#6366f1', fontWeight: '700' },
  tabCount: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountActive: { backgroundColor: 'rgba(99,102,241,0.3)' },
  tabCountText: { color: '#aaa', fontSize: 11, fontWeight: '600' },
  tabCountTextActive: { color: '#6366f1' },
  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  // Shelf card
  shelfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  shelfCover: { width: 52, height: 72, borderRadius: 8 },
  shelfCardInfo: { flex: 1, gap: 4 },
  shelfCardTitle: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  shelfCardAuthor: { fontSize: 13 },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginTop: 4,
  },
  progressBarFill: { height: 3, backgroundColor: '#6366f1', borderRadius: 2 },
  progressLabel: { fontSize: 11, marginTop: 2 },
  shelfTagLabel: { fontSize: 12, marginTop: 2 },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  resumeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  discoverBtn: {
    marginTop: 12,
    backgroundColor: '#6366f1',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  discoverBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Action sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetProjectTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  sheetRowDanger: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  sheetRowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  sheetCancel: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
