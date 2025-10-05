import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import SafeImage from '@/ui/SafeImage';
import { Coins, Search, ChevronRight, Library } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app-store';
import { Project } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';

interface SubscribedProjectCardProps {
  project: Project;
  onPress: () => void;
}

const SubscribedProjectCard = memo(function SubscribedProjectCard({ project, onPress }: SubscribedProjectCardProps) {
  const totalReadTime = project.chapters.reduce((sum, chapter) => sum + chapter.readTime, 0);
  const { activeTheme } = useTheme();
  
  return (
    <TouchableOpacity style={[styles.projectCard, { backgroundColor: activeTheme.colors.card }]} onPress={onPress}>
      <SafeImage 
        uri={project.cover} 
        style={styles.projectCover}
        resizeMode="cover"
        fallback={<View style={[styles.projectCover, { backgroundColor: '#333' }]} />}
      />
      <View style={styles.projectInfo}>
        <Text style={[styles.projectTitle, { color: activeTheme.colors.text.primary }]} numberOfLines={2}>
          {project.title}
        </Text>
        <Text style={[styles.creatorName, { color: activeTheme.colors.text.secondary }]}>{project.creator.name}</Text>
        <View style={styles.updateBadge}>
          <Text style={styles.updateText}>Updated 2 days ago</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

interface ReadingHistoryItemProps {
  project: Project;
  chapterTitle: string;
  timestamp: string;
  onPress: () => void;
}

const ReadingHistoryItem = memo(function ReadingHistoryItem({ project, chapterTitle, timestamp, onPress }: ReadingHistoryItemProps) {
  const { activeTheme } = useTheme();
  
  return (
    <TouchableOpacity style={[styles.historyItem, { backgroundColor: activeTheme.colors.card }]} onPress={onPress}>
      <SafeImage 
        uri={project.cover} 
        style={styles.historyThumbnail}
        resizeMode="cover"
        fallback={<View style={[styles.historyThumbnail, { backgroundColor: '#333' }]} />}
      />
      <View style={styles.historyInfo}>
        <Text style={[styles.historyChapter, { color: activeTheme.colors.text.primary }]} numberOfLines={1}>
          {chapterTitle}
        </Text>
        <Text style={[styles.historyProject, { color: activeTheme.colors.text.secondary }]} numberOfLines={1}>
          {project.title}
        </Text>
        <Text style={[styles.historyTime, { color: activeTheme.colors.text.muted }]}>{timestamp}</Text>
      </View>
    </TouchableOpacity>
  );
});

interface PurchaseItemProps {
  project: Project;
  chapterTitle: string;
  amount: number;
  date: string;
}

const PurchaseItem = memo(function PurchaseItem({ project, chapterTitle, amount, date }: PurchaseItemProps) {
  const { activeTheme } = useTheme();
  
  return (
    <View style={[styles.purchaseItem, { backgroundColor: activeTheme.colors.card }]}>
      <SafeImage 
        uri={project.cover} 
        style={styles.purchaseThumbnail}
        resizeMode="cover"
        fallback={<View style={[styles.purchaseThumbnail, { backgroundColor: '#333' }]} />}
      />
      <View style={styles.purchaseInfo}>
        <Text style={[styles.purchaseChapter, { color: activeTheme.colors.text.primary }]} numberOfLines={1}>
          {chapterTitle}
        </Text>
        <Text style={[styles.purchaseProject, { color: activeTheme.colors.text.secondary }]} numberOfLines={1}>
          {project.title}
        </Text>
        <Text style={[styles.purchaseDate, { color: activeTheme.colors.text.muted }]}>{date}</Text>
      </View>
      <View style={styles.purchaseAmount}>
        <Text style={styles.purchaseAmountText}>{amount} coins</Text>
      </View>
    </View>
  );
});

export default function LibraryScreen() {
  const [subscribedProjects, setSubscribedProjects] = useState<Project[]>([]);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [currencyBalance] = useState(120);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  const { projects, setCurrentProject } = useAppStore();
  const { activeTheme } = useTheme();

  const filteredProjects = subscribedProjects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.creator.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    // Mock subscribed projects (first 3 projects)
    setSubscribedProjects(projects.slice(0, 3));
    
    // Mock reading history
    setReadingHistory([
      {
        id: '1',
        project: projects[0],
        chapterTitle: 'The Breaking Point',
        timestamp: '2 hours ago'
      },
      {
        id: '2',
        project: projects[1],
        chapterTitle: 'Shibuya Crossing',
        timestamp: '1 day ago'
      },
      {
        id: '3',
        project: projects[2],
        chapterTitle: 'The 100-Item Challenge',
        timestamp: '3 days ago'
      }
    ]);

    // Mock purchases
    setPurchases([
      {
        id: '1',
        project: projects[0],
        chapterTitle: 'Bali Beginnings',
        amount: 5,
        date: 'Jan 15, 2024'
      },
      {
        id: '2',
        project: projects[1],
        chapterTitle: 'Neon Dreams',
        amount: 3,
        date: 'Jan 12, 2024'
      }
    ]);
  }, [projects]);

  const handleProjectPress = useCallback((project: Project) => {
    setCurrentProject(project);
    router.push(`/project/${project.id}`);
  }, [setCurrentProject]);

  const handleHistoryPress = useCallback((item: any) => {
    setCurrentProject(item.project);
    router.push('/reader');
  }, [setCurrentProject]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: activeTheme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: activeTheme.colors.text.primary }]}>Library</Text>
          <TouchableOpacity 
            style={[styles.shelfButtonHeader, { backgroundColor: activeTheme.colors.card }]}
            onPress={() => router.push('/library/shelf' as any)}
          >
            <View style={styles.shelfIconFlipped}>
              <Library size={20} color={activeTheme.colors.accent} />
            </View>
            <Text style={[styles.shelfButtonHeaderText, { color: activeTheme.colors.text.primary }]}>Shelf</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
          <Search size={20} color={activeTheme.colors.text.muted} />
          <TextInput
            style={[styles.searchInput, { color: activeTheme.colors.text.primary }]}
            placeholder="Search your library..."
            placeholderTextColor={activeTheme.colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Latest Updates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary }]}>New Updates</Text>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => router.push('/library/updates' as any)}
            >
              <Text style={[styles.moreButtonText, { color: activeTheme.colors.accent }]}>More</Text>
              <ChevronRight size={16} color={activeTheme.colors.accent} />
            </TouchableOpacity>
          </View>
          {filteredProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: activeTheme.colors.text.secondary }]}>No subscribed projects yet</Text>
              <Text style={[styles.emptySubtext, { color: activeTheme.colors.text.muted }]}>
                Subscribe to projects to keep track of updates
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProjects}
              renderItem={({ item }) => (
                <SubscribedProjectCard
                  project={item}
                  onPress={() => handleProjectPress(item)}
                />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          )}
        </View>

        {/* Reading History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary }]}>Reading History</Text>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => router.push('/library/history' as any)}
            >
              <Text style={[styles.moreButtonText, { color: activeTheme.colors.accent }]}>More</Text>
              <ChevronRight size={16} color={activeTheme.colors.accent} />
            </TouchableOpacity>
          </View>
          {readingHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: activeTheme.colors.text.secondary }]}>No reading history yet</Text>
              <Text style={[styles.emptySubtext, { color: activeTheme.colors.text.muted }]}>
                Start reading stories to see your history here
              </Text>
            </View>
          ) : (
            <View>
              {readingHistory.slice(0, 3).map((item) => (
                <ReadingHistoryItem
                  key={item.id}
                  project={item.project}
                  chapterTitle={item.chapterTitle}
                  timestamp={item.timestamp}
                  onPress={() => handleHistoryPress(item)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Currency Balance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary }]}>Currency Balance</Text>
          <View style={styles.currencyCard}>
            <View style={styles.currencyHeader}>
              <Coins size={32} color="#f59e0b" />
              <View style={styles.currencyInfo}>
                <Text style={[styles.currencyAmount, { color: activeTheme.colors.text.primary }]}>{currencyBalance}</Text>
                <Text style={styles.currencyLabel}>Coins</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.purchaseButton}>
              <Text style={styles.purchaseButtonText}>Purchase Coins</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Purchases Log */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: activeTheme.colors.text.primary }]}>Purchases Log</Text>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => router.push('/library/purchases' as any)}
            >
              <Text style={[styles.moreButtonText, { color: activeTheme.colors.accent }]}>More</Text>
              <ChevronRight size={16} color={activeTheme.colors.accent} />
            </TouchableOpacity>
          </View>
          {purchases.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: activeTheme.colors.text.secondary }]}>No purchases yet</Text>
              <Text style={[styles.emptySubtext, { color: activeTheme.colors.text.muted }]}>
                Premium chapters you purchase will appear here
              </Text>
            </View>
          ) : (
            <View>
              {purchases.slice(0, 3).map((item) => (
                <PurchaseItem
                  key={item.id}
                  project={item.project}
                  chapterTitle={item.chapterTitle}
                  amount={item.amount}
                  date={item.date}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  shelfButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  shelfButtonHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  shelfIconFlipped: {
    transform: [{ scaleX: -1 }],
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  horizontalList: {
    paddingRight: 20,
  },
  projectCard: {
    width: 160,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  projectCover: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  projectInfo: {
    padding: 12,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  creatorName: {
    fontSize: 12,
    marginBottom: 8,
  },
  updateBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  updateText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
    resizeMode: 'cover',
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
  currencyCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencyInfo: {
    marginLeft: 16,
  },
  currencyAmount: {
    fontSize: 32,
    fontWeight: '800',
  },
  currencyLabel: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '600',
  },
  purchaseButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  purchaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  purchaseThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
    resizeMode: 'cover',
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseChapter: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  purchaseProject: {
    fontSize: 12,
    marginBottom: 2,
  },
  purchaseDate: {
    fontSize: 11,
  },
  purchaseAmount: {
    alignItems: 'flex-end',
  },
  purchaseAmountText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  shelfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  shelfButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});