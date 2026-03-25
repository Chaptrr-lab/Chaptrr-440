import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Platform,
  Modal,
  Pressable,
  ImageBackground,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { ArrowLeft, Plus, Trash2, Upload, Edit2 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import * as ImagePicker from 'expo-image-picker';
import { listCustomBubbles, createCustomBubble, updateCustomBubble, deleteCustomBubble } from '@/lib/database';
import { CustomBubble } from '@/types';

export default function BubbleEditorScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { activeTheme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [bubbles, setBubbles] = useState<CustomBubble[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingBubble, setEditingBubble] = useState<CustomBubble | null>(null);
  
  // Editor state
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [capInsets, setCapInsets] = useState({ top: 20, left: 20, bottom: 20, right: 20 });
  const [tintable, setTintable] = useState(false);

  const loadBubbles = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await listCustomBubbles(projectId);
      setBubbles(data);
    } catch (error) {
      console.error('Error loading custom bubbles:', error);
      Alert.alert('Error', 'Failed to load custom bubbles');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBubbles();
  }, [loadBubbles]);



  const handleCreateNew = () => {
    setEditingBubble(null);
    setName('');
    setImageUrl('');
    setCapInsets({ top: 20, left: 20, bottom: 20, right: 20 });
    setTintable(false);
    setEditorVisible(true);
  };

  const handleEdit = (bubble: CustomBubble) => {
    setEditingBubble(bubble);
    setName(bubble.name);
    setImageUrl(bubble.imageUrl);
    setCapInsets(bubble.capInsets);
    setTintable(bubble.tintable);
    setEditorVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a bubble name');
      return;
    }
    if (!imageUrl.trim()) {
      Alert.alert('Validation Error', 'Please upload a bubble image');
      return;
    }

    try {
      if (editingBubble) {
        await updateCustomBubble(editingBubble.id, {
          name: name.trim(),
          imageUrl,
          capInsets,
          tintable,
        });
      } else {
        await createCustomBubble(projectId!, {
          name: name.trim(),
          imageUrl,
          capInsets,
          tintable,
        });
      }
      
      setEditorVisible(false);
      loadBubbles();
      
      if (Platform.OS === 'android') {
        const { ToastAndroid } = require('react-native');
        ToastAndroid.show(editingBubble ? 'Bubble updated' : 'Bubble created', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Error saving bubble:', error);
      Alert.alert('Error', 'Failed to save bubble');
    }
  };

  const handleDelete = (bubble: CustomBubble) => {
    Alert.alert(
      'Delete Bubble',
      `Are you sure you want to delete "${bubble.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomBubble(bubble.id);
              loadBubbles();
              if (Platform.OS === 'android') {
                const { ToastAndroid } = require('react-native');
                ToastAndroid.show('Bubble deleted', ToastAndroid.SHORT);
              }
            } catch (error) {
              console.error('Error deleting bubble:', error);
              Alert.alert('Error', 'Failed to delete bubble');
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: Platform.OS === 'web',
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let uri = asset.uri;
        
        if (Platform.OS === 'web' && asset.base64) {
          uri = `data:image/png;base64,${asset.base64}`;
        }
        
        setImageUrl(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: activeTheme.colors.background }]}>
      <StatusBar barStyle={activeTheme.colors.background === '#000000' ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { borderBottomColor: activeTheme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeTheme.colors.text.primary }]}>Custom Bubbles</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateNew}>
          <Plus size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: activeTheme.colors.text.muted }]}>Loading...</Text>
          </View>
        ) : bubbles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: activeTheme.colors.text.muted }]}>
              No custom bubbles yet. Create one to get started!
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
              <Plus size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Bubble</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bubblesList}>
            {bubbles.map((bubble) => (
              <View key={bubble.id} style={[styles.bubbleCard, { backgroundColor: activeTheme.colors.card, borderColor: activeTheme.colors.border }]}>
                <View style={styles.bubblePreview}>
                  <ImageBackground
                    source={{ uri: bubble.imageUrl }}
                    style={styles.bubbleImage}
                    resizeMode="stretch"
                    imageStyle={{ borderRadius: 8 }}
                  >
                    <Text style={styles.bubblePreviewText}>Sample Text</Text>
                  </ImageBackground>
                </View>
                <View style={styles.bubbleInfo}>
                  <Text style={[styles.bubbleName, { color: activeTheme.colors.text.primary }]}>{bubble.name}</Text>
                  <Text style={[styles.bubbleDetails, { color: activeTheme.colors.text.muted }]}>
                    9-Slice: {bubble.capInsets.top}/{bubble.capInsets.left}/{bubble.capInsets.bottom}/{bubble.capInsets.right}
                  </Text>
                  {bubble.tintable && (
                    <Text style={[styles.bubbleDetails, { color: activeTheme.colors.text.muted }]}>Tintable</Text>
                  )}
                </View>
                <View style={styles.bubbleActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(bubble)}>
                    <Edit2 size={18} color="#6366f1" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(bubble)}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={editorVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditorVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: activeTheme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: activeTheme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: activeTheme.colors.text.primary }]}>
              {editingBubble ? 'Edit Bubble' : 'Create Bubble'}
            </Text>
            <TouchableOpacity onPress={() => setEditorVisible(false)}>
              <Text style={[styles.cancelText, { color: activeTheme.colors.text.muted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={[styles.label, { color: activeTheme.colors.text.primary }]}>Bubble Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: activeTheme.colors.card, color: activeTheme.colors.text.primary, borderColor: activeTheme.colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter bubble name..."
                placeholderTextColor={activeTheme.colors.text.muted}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: activeTheme.colors.text.primary }]}>Bubble Image</Text>
              {imageUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <ImageBackground
                    source={{ uri: imageUrl }}
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                  <TouchableOpacity style={styles.changeImageButton} onPress={handlePickImage}>
                    <Upload size={16} color="#6366f1" />
                    <Text style={[styles.changeImageText, { color: '#6366f1' }]}>Change Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={[styles.uploadButton, { borderColor: activeTheme.colors.border }]} onPress={handlePickImage}>
                  <Upload size={24} color={activeTheme.colors.text.muted} />
                  <Text style={[styles.uploadText, { color: activeTheme.colors.text.muted }]}>Upload Bubble Image</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: activeTheme.colors.text.primary }]}>9-Slice Cap Insets</Text>
              <Text style={[styles.description, { color: activeTheme.colors.text.muted }]}>
                Configure how the bubble stretches. Values define the non-stretchable edges.
              </Text>
              
              <View style={styles.sliderGroup}>
                <Text style={[styles.sliderLabel, { color: activeTheme.colors.text.primary }]}>Top: {capInsets.top}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={capInsets.top}
                  onValueChange={(value: number) => setCapInsets({ ...capInsets, top: value })}
                  minimumTrackTintColor="#6366f1"
                  maximumTrackTintColor={activeTheme.colors.border}
                />
              </View>

              <View style={styles.sliderGroup}>
                <Text style={[styles.sliderLabel, { color: activeTheme.colors.text.primary }]}>Left: {capInsets.left}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={capInsets.left}
                  onValueChange={(value: number) => setCapInsets({ ...capInsets, left: value })}
                  minimumTrackTintColor="#6366f1"
                  maximumTrackTintColor={activeTheme.colors.border}
                />
              </View>

              <View style={styles.sliderGroup}>
                <Text style={[styles.sliderLabel, { color: activeTheme.colors.text.primary }]}>Bottom: {capInsets.bottom}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={capInsets.bottom}
                  onValueChange={(value: number) => setCapInsets({ ...capInsets, bottom: value })}
                  minimumTrackTintColor="#6366f1"
                  maximumTrackTintColor={activeTheme.colors.border}
                />
              </View>

              <View style={styles.sliderGroup}>
                <Text style={[styles.sliderLabel, { color: activeTheme.colors.text.primary }]}>Right: {capInsets.right}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={capInsets.right}
                  onValueChange={(value: number) => setCapInsets({ ...capInsets, right: value })}
                  minimumTrackTintColor="#6366f1"
                  maximumTrackTintColor={activeTheme.colors.border}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Pressable
                style={[styles.toggleRow, { borderColor: activeTheme.colors.border }]}
                onPress={() => setTintable(!tintable)}
              >
                <Text style={[styles.toggleLabel, { color: activeTheme.colors.text.primary }]}>Tintable (Character Colors)</Text>
                <View style={[styles.checkbox, { borderColor: tintable ? '#6366f1' : activeTheme.colors.border, backgroundColor: tintable ? '#6366f1' : 'transparent' }]}>
                  {tintable && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </Pressable>
            </View>

            {imageUrl && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: activeTheme.colors.text.primary }]}>Preview</Text>
                <View style={styles.previewContainer}>
                  <ImageBackground
                    source={{ uri: imageUrl }}
                    style={styles.previewBubble}
                    resizeMode="stretch"
                    capInsets={capInsets}
                    imageStyle={tintable ? { tintColor: '#6366f1' } : undefined}
                  >
                    <Text style={styles.previewText}>This is a preview of your custom bubble!</Text>
                  </ImageBackground>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{editingBubble ? 'Update Bubble' : 'Create Bubble'}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bubblesList: {
    padding: 20,
    gap: 16,
  },
  bubbleCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  bubblePreview: {
    width: 80,
    height: 60,
  },
  bubbleImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubblePreviewText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  bubbleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bubbleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bubbleDetails: {
    fontSize: 12,
  },
  bubbleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cancelText: {
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    marginBottom: 12,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  uploadButton: {
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
  },
  imagePreviewContainer: {
    gap: 12,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderGroup: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  previewBubble: {
    width: 280,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  previewText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
