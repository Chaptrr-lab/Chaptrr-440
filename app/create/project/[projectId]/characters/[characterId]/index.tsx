import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCharacter, updateCharacter, deleteCharacter, getProject } from '@/lib/database';
import { Character, Project } from '@/types';

export default function CharacterDetailScreen() {
  const { projectId, characterId } = useLocalSearchParams<{ 
    projectId: string; 
    characterId: string; 
  }>();
  const insets = useSafeAreaInsets();
  
  const [project, setProject] = useState<Project | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading character:', characterId, 'for project:', projectId);
        
        if (!projectId || !characterId) {
          console.error('Missing projectId or characterId');
          setLoading(false);
          return;
        }
        
        // Load project data first
        const projectData = await getProject(projectId as string);
        console.log('Project data loaded:', projectData?.title);
        
        if (!projectData) {
          console.error('Project not found');
          setLoading(false);
          return;
        }
        
        // Find character in project's characters array
        const characterData = projectData.characters?.find(c => c.id === characterId);
        console.log('Character data found:', characterData?.name);
        
        if (!characterData) {
          console.error('Character not found in project');
          setLoading(false);
          return;
        }
        
        setProject(projectData);
        setCharacter(characterData);
        setName(characterData.name);
        setDescription(characterData.description || '');
        setSelectedColor(characterData.color);
      } catch (error) {
        console.error('Error loading character:', error);
        Alert.alert('Error', 'Failed to load character data');
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId && characterId) {
      loadData();
    }
  }, [projectId, characterId]);

  const colors = [
    '#6366f1', '#ec4899', '#10b981', '#f59e0b', 
    '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
  ];

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!project || !character) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Character not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Character name is required');
      return;
    }
    
    try {
      setSaving(true);
      await updateCharacter(characterId as string, {
        name: name.trim(),
        description: description.trim(),
        color: selectedColor
      });
      
      Alert.alert('Success', 'Character updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating character:', error);
      Alert.alert('Error', 'Failed to update character');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Character',
      `Are you sure you want to delete "${character.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await deleteCharacter(characterId as string);
              Alert.alert('Success', 'Character deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting character:', error);
              Alert.alert('Error', 'Failed to delete character');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const chaptersWhereAppears = (project?.chapters || []).filter(chapter => 
    character?.appearances?.includes(chapter.id)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Character Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.deleteButton, saving && styles.disabledButton]} 
            onPress={handleDelete}
            disabled={saving}
          >
            <Trash2 size={18} color={saving ? "#666" : "#ef4444"} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.disabledButton]} 
            onPress={handleSave}
            disabled={saving}
          >
            <Save size={18} color={saving ? "#666" : "#6366f1"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.field}>
            <Text style={styles.label}>Character Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter character name..."
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Character Color</Text>
            <View style={styles.colorPicker}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected
                  ]}
                  onPress={() => {
                    if (color && color.trim() && color.length <= 7) {
                      setSelectedColor(color.trim());
                    }
                  }}
                />
              ))}
            </View>
            <Text style={styles.colorNote}>
              This color will be used for all dialogue bubbles from this character
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe this character..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Relationships</Text>
            <View style={styles.relationshipsContainer}>
              {character.relationships && character.relationships.length > 0 ? (
                character.relationships.map((rel) => {
                  const relatedCharacter = project.characters.find(c => c.id === rel.characterId);
                  return (
                    <View key={`${rel.characterId}-${rel.relationshipType}`} style={styles.relationshipCard}>
                      <View style={[styles.relationshipColor, { backgroundColor: relatedCharacter?.color || '#666' }]} />
                      <View style={styles.relationshipInfo}>
                        <Text style={styles.relationshipName}>{relatedCharacter?.name || 'Unknown'}</Text>
                        <Text style={styles.relationshipType}>{rel.relationshipType}</Text>
                        <Text style={styles.relationshipDescription}>{rel.description}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>No relationships defined</Text>
              )}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Appearances ({chaptersWhereAppears.length} chapters)</Text>
            <View style={styles.appearancesContainer}>
              {chaptersWhereAppears.length > 0 ? (
                chaptersWhereAppears.map((chapter, index) => (
                  <TouchableOpacity 
                    key={chapter.id} 
                    style={styles.chapterCard}
                    onPress={() => router.push(`/create/project/${projectId}/chapters/${chapter.id}/edit`)}
                  >
                    <View style={styles.chapterNumber}>
                      <Text style={styles.chapterNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>This character hasn&apos;t appeared in any chapters yet</Text>
              )}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.updateButton, saving && styles.disabledButton]} 
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={[styles.updateButtonText, saving && styles.disabledText]}>
              {saving ? 'Updating...' : 'Update Character'}
            </Text>
          </TouchableOpacity>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  saveButton: {
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
  field: {
    marginBottom: 24,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
  },
  colorNote: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  relationshipsContainer: {
    gap: 12,
  },
  relationshipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  relationshipColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  relationshipInfo: {
    flex: 1,
  },
  relationshipName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  relationshipType: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  relationshipDescription: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
  },
  appearancesContainer: {
    gap: 8,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  chapterNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  chapterTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  updateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
});