import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { ArrowLeft, Plus, Edit3 } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listCharacters } from '@/lib/database';
import { Character } from '@/types';

interface CharacterCardProps {
  character: Character;
  onPress: () => void;
}

function CharacterCard({ character, onPress }: CharacterCardProps) {
  return (
    <TouchableOpacity style={styles.characterCard} onPress={onPress}>
      <View style={[styles.colorIndicator, { backgroundColor: character.color }]} />
      <View style={styles.characterInfo}>
        <Text style={styles.characterName}>{character.name}</Text>
        <Text style={styles.characterMeta}>
          Appears in {character.appearances.length} chapters
        </Text>
      </View>
      <Edit3 size={16} color="#6366f1" />
    </TouchableOpacity>
  );
}

export default function CharactersListScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [characters, setCharacters] = useState<Character[]>([]);
  const insets = useSafeAreaInsets();

  // Refresh characters when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadCharacters = async () => {
        if (projectId) {
          const updatedCharacters = await listCharacters(projectId);
          setCharacters(updatedCharacters);
          console.log('Characters refreshed:', updatedCharacters.length);
        }
      };
      loadCharacters();
    }, [projectId])
  );

  if (!projectId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Project ID not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleAddCharacter = () => {
    router.push(`/create/project/${projectId}/characters/new`);
  };

  const handleCharacterPress = (characterId: string) => {
    router.push(`/create/project/${projectId}/characters/${characterId}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Characters</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Characters ({characters.length})
            </Text>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleAddCharacter}
            >
              <Plus size={20} color="#6366f1" />
              <Text style={styles.createButtonText}>Add Character</Text>
            </TouchableOpacity>
          </View>

          {characters.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No characters yet</Text>
              <Text style={styles.emptyDescription}>
                Add characters to your story to create dialogue bubbles and assign colors.
              </Text>
            </View>
          ) : (
            <View>
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onPress={() => handleCharacterPress(character.id)}
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
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backIcon: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6366f1',
  },

  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  createButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  characterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  characterInfo: {
    flex: 1,
  },
  characterName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  characterMeta: {
    color: '#ccc',
    fontSize: 12,
  },
});