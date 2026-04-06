import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SectionList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { ArrowLeft, Search, X, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app-store';
import SafeImage from '@/ui/SafeImage';
import { Project, Creator } from '@/types';
import { mockCreators } from '@/data/mock-data';

const TRENDING_TAGS = ['Fantasy', 'Romance', 'Thriller', 'Sci-Fi', 'Horror', 'Mystery'];

// ─── Story result row ─────────────────────────────────────────────────────────
function StoryRow({ project, query, onPress }: { project: Project; query: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.75}>
      <SafeImage
        uri={project.cover}
        style={styles.rowCover}
        resizeMode="cover"
        fallback={<View style={[styles.rowCover, { backgroundColor: '#333' }]} />}
      />
      <View style={styles.rowInfo}>
        <HighlightText text={project.title} query={query} style={styles.rowTitle} />
        <Text style={styles.rowSub} numberOfLines={1}>by {project.creator.name}</Text>
        <Text style={styles.rowDesc} numberOfLines={2}>
          {project.shortDescription || project.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Author result row ────────────────────────────────────────────────────────
function AuthorRow({ creator, query, onPress }: { creator: Creator; query: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.75}>
      <SafeImage
        uri={creator.avatar}
        style={styles.rowAvatar}
        resizeMode="cover"
        fallback={<View style={[styles.rowAvatar, { backgroundColor: '#555' }]} />}
      />
      <View style={styles.rowInfo}>
        <HighlightText text={creator.name} query={query} style={styles.rowTitle} />
        <Text style={styles.rowSub}>{creator.followers.toLocaleString()} followers</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Highlight matching text ──────────────────────────────────────────────────
function HighlightText({ text, query, style }: { text: string; query: string; style?: any }) {
  if (!query) return <Text style={style}>{text}</Text>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={i} style={styles.highlight}>{part}</Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const insets = useSafeAreaInsets();
  const { projects, setCurrentProject, incrementViews } = useAppStore();

  // 300ms debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Grouped results
  const sections = React.useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();

    const stories = projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );

    const authors = mockCreators.filter(
      (c) => c.name.toLowerCase().includes(q)
    );

    const tagMatches = Array.from(
      new Set(
        projects.flatMap((p) => p.tags).filter((t) => t.toLowerCase().includes(q))
      )
    ).slice(0, 8);

    const result: { title: string; data: any[] }[] = [];
    if (stories.length > 0) result.push({ title: 'Stories', data: stories });
    if (authors.length > 0) result.push({ title: 'Authors', data: authors });
    if (tagMatches.length > 0) result.push({ title: 'Tags', data: tagMatches });
    return result;
  }, [debouncedQuery, projects]);

  const totalCount = sections.reduce((n, s) => n + s.data.length, 0);

  const handleStoryPress = useCallback((project: Project) => {
    setCurrentProject(project);
    incrementViews(project.id);
    router.push(`/project/${project.id}`);
  }, [setCurrentProject, incrementViews]);

  const handleAuthorPress = useCallback((creator: Creator) => {
    router.push(`/author/${creator.id}` as any);
  }, []);

  const handleTagPress = useCallback((tag: string) => {
    setQuery(tag);
  }, []);

  const renderItem = ({ item, section }: { item: any; section: { title: string } }) => {
    if (section.title === 'Stories') {
      return <StoryRow project={item} query={debouncedQuery} onPress={() => handleStoryPress(item)} />;
    }
    if (section.title === 'Authors') {
      return <AuthorRow creator={item} query={debouncedQuery} onPress={() => handleAuthorPress(item)} />;
    }
    // Tags
    return (
      <TouchableOpacity style={styles.tagPill} onPress={() => handleTagPress(item)} activeOpacity={0.7}>
        <Text style={styles.tagPillText}>#{item}</Text>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Search bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Search size={16} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Stories, authors, tags…"
            placeholderTextColor="#555"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {debouncedQuery === '' ? (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View style={styles.idleContent}>
              {/* Trending */}
              <View style={styles.trendingHeader}>
                <TrendingUp size={18} color="#6366f1" />
                <Text style={styles.trendingTitle}>Trending</Text>
              </View>
              <View style={styles.tagRow}>
                {TRENDING_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.trendingPill}
                    onPress={() => setQuery(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.trendingPillText}>#{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Trending stories */}
              <Text style={styles.subSectionTitle}>Top Stories Right Now</Text>
              {projects.slice(0, 5).map((p) => (
                <StoryRow
                  key={p.id}
                  project={p}
                  query=""
                  onPress={() => handleStoryPress(p)}
                />
              ))}
            </View>
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <>
          <Text style={styles.resultsCount}>
            {totalCount} result{totalCount !== 1 ? 's' : ''} for "{debouncedQuery}"
          </Text>
          {sections.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsSub}>Try a different search term or browse trending tags.</Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item, idx) =>
                typeof item === 'string' ? item : item.id ?? String(idx)
              }
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.sectionListContent}
              stickySectionHeadersEnabled={false}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  backBtn: { padding: 4 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  // Idle
  idleContent: {
    padding: 20,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  trendingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  trendingPill: {
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  trendingPillText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
  subSectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  // Results count
  resultsCount: {
    color: '#666',
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  sectionListContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Result rows
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowCover: {
    width: 46,
    height: 62,
    borderRadius: 6,
  },
  rowAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  rowInfo: { flex: 1 },
  rowTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowSub: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  rowDesc: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  highlight: {
    backgroundColor: '#6366f1',
    color: '#fff',
    borderRadius: 2,
  },
  // Tag results
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    marginRight: 8,
  },
  tagPillText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
  // No results
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  noResultsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  noResultsSub: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
