import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { goBackOrFallback } from '@/lib/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app-store';
import { Project } from '@/types';

interface SearchResultProps {
  project: Project;
  onPress: () => void;
  searchQuery: string;
}

function SearchResult({ project, onPress, searchQuery }: SearchResultProps) {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => (
      <Text
        key={index}
        style={[
          styles.resultText,
          part.toLowerCase() === query.toLowerCase() && styles.highlightedText
        ]}
      >
        {part}
      </Text>
    ));
  };

  return (
    <TouchableOpacity style={styles.searchResult} onPress={onPress}>
      {project.cover ? (
        <Image source={{ uri: project.cover }} style={styles.resultCover} />
      ) : (
        <View style={[styles.resultCover, { backgroundColor: '#333' }]} />
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>
          {highlightText(project.title, searchQuery)}
        </Text>
        <Text style={styles.resultCreator}>by {project.creator.name}</Text>
        <Text style={styles.resultDescription} numberOfLines={2}>
          {project.shortDescription || project.description}
        </Text>
        <View style={styles.resultTags}>
          {project.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.resultTag}>
              <Text style={styles.resultTagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [recentSearches] = useState<string[]>([
    'digital nomad',
    'tokyo',
    'minimalism',
    'startup',
    'art therapy'
  ]);
  const insets = useSafeAreaInsets();
  const projects = useAppStore((state) => state.projects);
  const setCurrentProject = useAppStore((state) => state.setCurrentProject);
  const incrementViews = useAppStore((state) => state.incrementViews);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = projects.filter(project => {
        const query = searchQuery.toLowerCase();
        return (
          project.title.toLowerCase().includes(query) ||
          project.creator.name.toLowerCase().includes(query) ||
          project.tags.some(tag => tag.toLowerCase().includes(query)) ||
          project.description.toLowerCase().includes(query) ||
          (project.shortDescription && project.shortDescription.toLowerCase().includes(query))
        );
      });
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, projects]);

  const handleResultPress = (project: Project) => {
    if (!project?.id) return;
    setCurrentProject(project);
    incrementViews(project.id);
    router.push(`/project/${project.id}`);
  };

  const handleRecentSearchPress = (query: string) => {
    if (!query?.trim() || query.length > 100) return;
    const sanitized = query.trim();
    setSearchQuery(sanitized);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleBack = () => {
    goBackOrFallback(router, '/(tabs)/explore');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Search size={16} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stories, creators, tags..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {searchQuery.trim() === '' ? (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <View style={styles.recentSearches}>
              {recentSearches.map((query) => (
                <TouchableOpacity
                  key={query}
                  style={styles.recentSearchItem}
                  onPress={() => handleRecentSearchPress(query.trim())}
                >
                  <Search size={14} color="#666" />
                  <Text style={styles.recentSearchText}>{query}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.sectionTitle}>Popular Tags</Text>
            <View style={styles.popularTags}>
              {['Travel', 'Technology', 'Art', 'Lifestyle', 'Photography', 'Startup'].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.popularTag}
                  onPress={() => handleRecentSearchPress(tag.trim())}
                >
                  <Text style={styles.popularTagText}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsHeader}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
            </Text>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <SearchResult
                  project={item}
                  onPress={() => handleResultPress(item)}
                  searchQuery={searchQuery}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
            />
          </View>
        )}
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  recentSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 24,
  },
  recentSearches: {
    marginBottom: 8,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  recentSearchText: {
    color: '#ccc',
    fontSize: 16,
    marginLeft: 12,
  },
  popularTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  popularTagText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsSection: {
    flex: 1,
    padding: 20,
  },
  resultsHeader: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 16,
  },
  resultsList: {
    paddingBottom: 20,
  },
  searchResult: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resultCover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultText: {
    color: '#fff',
  },
  highlightedText: {
    backgroundColor: '#6366f1',
    color: '#fff',
  },
  resultCreator: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  resultDescription: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  resultTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  resultTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resultTagText: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: '600',
  },
});