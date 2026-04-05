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
  ToastAndroid,
  Platform,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import SafeImage from '@/ui/SafeImage';
import { ArrowLeft, Trash2, Image as ImageIcon, Type, MessageCircle, Cloud, Settings, AlignLeft, AlignCenter, AlignRight, Upload, Camera, X, Plus, Eye } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChapter, updateChapter, listCharacters, updateChapterBlocks, addChapterToBroadcastQueue, createChapter as dbCreateChapter, listCustomBubbles, createCustomBubble } from '@/lib/database';
import { Block, Character, CustomBubble } from '@/types';
import { BubbleRenderer } from '@/components/bubbles/BubbleRenderer';
import NovelEditor from '@/components/novel/NovelEditor';

import { useTheme } from '@/theme/ThemeProvider';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { parseTXT, parseDOCX, ParsedChapter } from '@/lib/upload-parser';
import { goBackOrFallback } from '@/lib/navigation';

interface BubbleTypePickerProps {
  visible: boolean;
  onClose: () => void;
  activeBlockId: string | null;
  getBlockById: (id: string) => Block | undefined;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  customBubbles: CustomBubble[];
}

function BubbleTypePicker({ visible, onClose, activeBlockId, getBlockById, updateBlock, customBubbles }: BubbleTypePickerProps) {
  const { activeTheme } = useTheme();
  const block = activeBlockId ? getBlockById(activeBlockId) : null;
  
  if (!block || block.type !== 'text') return null;
  
  const handleBubbleTypeChange = (bubbleType: 'plain' | 'dialogue' | 'thinking' | 'shout' | 'custom', customBubbleId?: string) => {
    try {
      if (!activeBlockId || !block) {
        console.warn('No active block');
        return;
      }
      if (bubbleType === 'custom' && customBubbleId) {
        updateBlock(activeBlockId, { textStyle: { ...block.textStyle, bubbleType: 'custom', customBubbleId } });
      } else {
        updateBlock(activeBlockId, { textStyle: { ...block.textStyle, bubbleType, customBubbleId: undefined } });
      }
      onClose();
    } catch (error) {
      console.error('Error changing bubble type:', error);
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.bubblePickerOverlay}
        onPress={onClose}
      >
        <View style={[styles.bubblePickerContainer, { backgroundColor: activeTheme.colors.surface }]}>
          <Text style={[styles.bubblePickerTitle, { color: activeTheme.colors.text.primary }]}>Select Bubble Type</Text>
          <ScrollView style={styles.bubblePickerScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.bubblePickerButtons}>
              <TouchableOpacity
                style={[styles.bubblePickerButton, { backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.border }]}
                onPress={() => handleBubbleTypeChange('plain')}
                testID="bubbleTypePlain"
              >
                <Type size={20} color="#10b981" />
                <Text style={[styles.bubblePickerButtonText, { color: activeTheme.colors.text.primary }]}>Plain</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bubblePickerButton, { backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.border }]}
                onPress={() => handleBubbleTypeChange('dialogue')}
                testID="bubbleTypeDialogue"
              >
                <MessageCircle size={20} color="#6366f1" />
                <Text style={[styles.bubblePickerButtonText, { color: activeTheme.colors.text.primary }]}>Dialogue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bubblePickerButton, { backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.border }]}
                onPress={() => handleBubbleTypeChange('shout')}
                testID="bubbleTypeShout"
              >
                <View style={{ width: 20, height: 20 }}>
                  <Svg width="20" height="20" viewBox="0 0 24 24">
                    <Path fill="#f59e0b" d="m17.7 17.7l-2.15-4.175L18.075 11L16 8.925V6h-2.925L11 3.925L8.925 6H6v2.925L3.925 11L6 13.075V16h2.925L11 18.075l2.5-2.5l4.2 2.125Zm3 3q-.2.2-.513.275t-.637-.1L13.9 18l-2.2 2.2q-.3.3-.7.3t-.7-.3L8.1 18H5q-.425 0-.713-.288T4 17v-3.1l-2.2-2.2q-.3-.3-.3-.7t.3-.7L4 8.1V5q0-.425.288-.713T5 4h3.1l2.2-2.2q.3-.3.7-.3t.7.3L13.9 4H17q.425 0 .713.288T18 5v3.1l2.2 2.2q.3.3.3.7t-.3.7L18 13.9l2.875 5.65q.175.325.1.637t-.275.513ZM11 11Z"/>
                  </Svg>
                </View>
                <Text style={[styles.bubblePickerButtonText, { color: activeTheme.colors.text.primary }]}>Shout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bubblePickerButton, { backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.border }]}
                onPress={() => handleBubbleTypeChange('thinking')}
                testID="bubbleTypeThinking"
              >
                <Cloud size={20} color="#8b5cf6" />
                <Text style={[styles.bubblePickerButtonText, { color: activeTheme.colors.text.primary }]}>Thinking</Text>
              </TouchableOpacity>
              
              {customBubbles.map((bubble) => (
                <TouchableOpacity
                  key={bubble.id}
                  style={[styles.bubblePickerButton, { backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.border }]}
                  onPress={() => handleBubbleTypeChange('custom', bubble.id)}
                  testID={`bubbleTypeCustom-${bubble.id}`}
                >
                  <SafeImage 
                    uri={bubble.imageUrl} 
                    style={{ width: 20, height: 20, borderRadius: 4 }}
                    resizeMode="cover"
                    fallback={<View style={{ width: 20, height: 20, backgroundColor: '#666', borderRadius: 4 }} />}
                  />
                  <Text style={[styles.bubblePickerButtonText, { color: activeTheme.colors.text.primary }]}>{bubble.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

interface BlockSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  activeBlockId: string | null;
  getBlockById: (id: string) => Block | undefined;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  blocks: Block[];
  characters: Character[];
  onDelete: () => void;
  projectId: string;
  onOpenCustomBubbleEditor: () => void;
}

function BlockSettingsSheet({ visible, onClose, activeBlockId, getBlockById, updateBlock, blocks, characters, onDelete, projectId: _projectId, onOpenCustomBubbleEditor }: BlockSettingsSheetProps) {
  const { activeTheme } = useTheme();
  const [imageUrl, setImageUrl] = useState('');
  
  const block = activeBlockId ? getBlockById(activeBlockId) : null;
  
  useEffect(() => {
    if (block) {
      setImageUrl(block.content || '');
    }
  }, [block]);
  
  if (!block) return null;
  
  const handleImageUrlChange = (url: string) => {
    if (!url.trim() || !activeBlockId) return;
    setImageUrl(url);
    updateBlock(activeBlockId, { content: url });
  };
  
  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    if (!activeBlockId || !block) return;
    if (block.type === 'text') {
      updateBlock(activeBlockId, { textStyle: { ...block.textStyle, alignment } });
    } else if (block.type === 'image') {
      updateBlock(activeBlockId, { imageStyle: { ...block.imageStyle, alignment } });
    }
  };
  
  const handleBubbleTypeChange = (bubbleType: 'plain' | 'dialogue' | 'thinking' | 'shout') => {
    if (!activeBlockId || !block) return;
    updateBlock(activeBlockId, { textStyle: { ...block.textStyle, bubbleType } });
  };
  
  const handleCharacterChange = (characterId: string) => {
    if (!activeBlockId || !block) return;
    if (!characterId.trim()) {
      updateBlock(activeBlockId, { textStyle: { ...block.textStyle, characterId: '' } });
    } else {
      updateBlock(activeBlockId, { textStyle: { ...block.textStyle, characterId } });
    }
  };
  
  const isValidUrl = (url: string) => {
    return url && (url.startsWith('http') || url.startsWith('data:') || url.startsWith('file://'));
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheetContainer, { backgroundColor: activeTheme.colors.background }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: activeTheme.colors.border }]}>
          <Text style={[styles.sheetTitle, { color: activeTheme.colors.text.primary }]}>
            {block.type === 'image' ? 'Image Settings' : block.type === 'BG' ? 'BG Settings' : 'Text Settings'}
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
            <X size={24} color={activeTheme.colors.text.primary} />
          </Pressable>
        </View>
        
        <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>

          
          {block.type === 'image' && (
            <>
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetLabel, { color: activeTheme.colors.text.primary }]}>Size Mode</Text>
                <View style={styles.segmentControl} testID="imgSizeSegment">
                  {[
                    { value: 'default', label: 'Default', testID: 'imgSizeDefault' },
                    { value: 'original', label: 'Original', testID: 'imgSizeOriginal' },
                    { value: 'full', label: 'Full', testID: 'imgSizeFull' }
                  ].map(({ value, label, testID }) => (
                    <TouchableOpacity
                      key={value}
                      testID={testID}
                      style={[
                        styles.segmentButton,
                        {
                          backgroundColor: (block.imageStyle?.sizeMode || 'default') === value 
                            ? '#6366f1' 
                            : activeTheme.colors.surface,
                          borderColor: (block.imageStyle?.sizeMode || 'default') === value 
                            ? '#6366f1' 
                            : activeTheme.colors.border
                        }
                      ]}
                      onPress={() => activeBlockId && updateBlock(activeBlockId, { imageStyle: { ...block.imageStyle, sizeMode: value as 'default' | 'original' | 'full' } })}
                    >
                      <Text style={[
                        styles.segmentButtonText,
                        {
                          color: (block.imageStyle?.sizeMode || 'default') === value 
                            ? '#fff' 
                            : activeTheme.colors.text.primary
                        }
                      ]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetLabel, { color: activeTheme.colors.text.primary }]}>Corner</Text>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: (block.imageStyle?.roundedCorners || false) ? '#6366f1' : activeTheme.colors.surface,
                      borderColor: (block.imageStyle?.roundedCorners || false) ? '#6366f1' : activeTheme.colors.border
                    }
                  ]}
                  onPress={() => activeBlockId && updateBlock(activeBlockId, { imageStyle: { ...block.imageStyle, roundedCorners: !(block.imageStyle?.roundedCorners || false) } })}
                  testID="imgCornerToggle"
                >
                  <Text style={[
                    styles.segmentButtonText,
                    {
                      color: (block.imageStyle?.roundedCorners || false) ? '#fff' : activeTheme.colors.text.primary
                    }
                  ]}>Round</Text>
                </TouchableOpacity>
              </View>
              

              
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetLabel, { color: activeTheme.colors.text.primary }]}>Block Spacing</Text>
                <View style={styles.segmentControl}>
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[
                        styles.segmentButton,
                        {
                          backgroundColor: (block.spacing ?? 0) === n 
                            ? '#6366f1' 
                            : activeTheme.colors.surface,
                          borderColor: (block.spacing ?? 0) === n 
                            ? '#6366f1' 
                            : activeTheme.colors.border
                        }
                      ]}
                      onPress={() => activeBlockId && updateBlock(activeBlockId, { spacing: n })}
                    >
                      <Text style={[
                        styles.segmentButtonText,
                        {
                          color: (block.spacing ?? 0) === n 
                            ? '#fff' 
                            : activeTheme.colors.text.primary
                        }
                      ]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetLabel, { color: activeTheme.colors.text.primary }]}>Image URL</Text>
                <TextInput
                  style={[
                    styles.sheetInput,
                    { 
                      backgroundColor: activeTheme.colors.surface, 
                      color: activeTheme.colors.text.primary, 
                      borderColor: !isValidUrl(imageUrl) && imageUrl ? '#ef4444' : activeTheme.colors.border 
                    }
                  ]}
                  value={imageUrl}
                  onChangeText={handleImageUrlChange}
                  placeholder="Enter image URL..."
                  placeholderTextColor={activeTheme.colors.text.muted}
                  testID="imgUrlInput"
                  multiline
                />
                {!isValidUrl(imageUrl) && imageUrl && (
                  <Text style={styles.errorText}>Please enter a valid image URL</Text>
                )}
              </View>
              
              <View style={styles.sheetSection}>
                <TouchableOpacity 
                  style={[styles.sheetButton, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                  onPress={() => {
                    // Focus the URL input
                  }}
                  testID="imgReplaceBtn"
                >
                  <Upload size={16} color={activeTheme.colors.text.primary} />
                  <Text style={[styles.sheetButtonText, { color: activeTheme.colors.text.primary }]}>Change Image</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          
          {block.type === 'BG' && (() => {
            const blockIndex = blocks.findIndex(b => b.id === activeBlockId);
            const currentBlock = blockIndex >= 0 ? blocks[blockIndex] : null;
            const currentMode = currentBlock?.bgStyle?.mode || 'OPEN';
            
            return (
              <>
                <View style={styles.sheetSection}>
                  <Text style={[styles.sheetLabel, { color: activeTheme.colors.text.primary }]}>Mode</Text>
                  <View style={styles.segmentControl}>
                    {[
                      { value: 'OPEN', label: 'Open' },
                      { value: 'BRIDGE', label: 'Bridge' },
                      { value: 'CLOSE', label: 'Close' }
                    ].map(({ value, label }) => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.segmentButton,
                          {
                            backgroundColor: currentMode === value 
                              ? '#6366f1' 
                              : activeTheme.colors.surface,
                            borderColor: currentMode === value 
                              ? '#6366f1' 
                              : activeTheme.colors.border
                          }
                        ]}
                        onPress={() => activeBlockId && updateBlock(activeBlockId, { bgStyle: { ...block.bgStyle, mode: value as 'OPEN' | 'CLOSE' | 'BRIDGE', imageUrl: block.bgStyle?.imageUrl, transition: block.bgStyle?.transition || 'fade' } })}
                      >
                        <Text style={[
                          styles.segmentButtonText,
                          {
                            color: currentMode === value 
                              ? '#fff' 
                              : activeTheme.colors.text.primary
                          }
                        ]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {currentMode === 'BRIDGE' && (
                  <View style={styles.sheetSection}>
                    <Text style={[styles.sheetLabel, { color: activeTheme.colors.text.primary }]}>Transition</Text>
                    <View style={styles.segmentControl}>
                      {[
                        { value: 'fade', label: 'Fade' },
                        { value: 'hard', label: 'Hard' }
                      ].map(({ value, label }) => (
                        <TouchableOpacity
                          key={value}
                          style={[
                            styles.segmentButton,
                            {
                              backgroundColor: (block.bgStyle?.transition || 'fade') === value 
                                ? '#6366f1' 
                                : activeTheme.colors.surface,
                              borderColor: (block.bgStyle?.transition || 'fade') === value 
                                ? '#6366f1' 
                                : activeTheme.colors.border
                            }
                          ]}
                          onPress={() => activeBlockId && updateBlock(activeBlockId, { bgStyle: { ...block.bgStyle, mode: currentMode, imageUrl: block.bgStyle?.imageUrl, transition: value as 'fade' | 'hard' } })}
                        >
                          <Text style={[
                            styles.segmentButtonText,
                            {
                              color: (block.bgStyle?.transition || 'fade') === value 
                                ? '#fff' 
                                : activeTheme.colors.text.primary
                            }
                          ]}>{label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                <View style={styles.sheetSection}>
                  <Text style={[styles.sheetLabel, { color: activeTheme.colors.text.primary }]}>Background Image</Text>
                  {block.bgStyle?.imageUrl ? (
                    <View style={styles.bgImagePreview}>
                      <SafeImage 
                        uri={block.bgStyle.imageUrl} 
                        style={styles.bgImagePreviewImage}
                        resizeMode="cover"
                        fallback={
                          <View style={[styles.bgImagePreviewImage, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ color: '#666', fontSize: 12 }}>Invalid Image</Text>
                          </View>
                        }
                      />
                      <View style={styles.bgImageActions}>
                        <TouchableOpacity 
                          style={[styles.sheetButton, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border, flex: 1 }]}
                          onPress={async () => {
                            try {
                              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                              if (status !== 'granted') {
                                Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
                                return;
                              }
                              const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: false,
                                quality: 0.9,
                                base64: Platform.OS === 'web',
                              });
                              if (!result.canceled && result.assets[0]) {
                                const asset = result.assets[0];
                                let imageUri = asset.uri;
                                if (Platform.OS === 'web' && asset.base64) {
                                  imageUri = `data:image/jpeg;base64,${asset.base64}`;
                                }
                                if (activeBlockId) {
                                  updateBlock(activeBlockId, { bgStyle: { ...block.bgStyle, mode: currentMode, imageUrl: imageUri, transition: block.bgStyle?.transition || 'fade' } });
                                }
                              }
                            } catch (error) {
                              console.error('Error picking image:', error);
                              Alert.alert('Error', 'Failed to pick image. Please try again.');
                            }
                          }}
                          testID="bgUploadBtn"
                        >
                          <Upload size={16} color={activeTheme.colors.text.primary} />
                          <Text style={[styles.sheetButtonText, { color: activeTheme.colors.text.primary }]}>Upload Image</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.deleteButton, { flex: 1 }]}
                          onPress={() => activeBlockId && updateBlock(activeBlockId, { bgStyle: { ...block.bgStyle, mode: currentMode, imageUrl: '', transition: block.bgStyle?.transition || 'fade' } })}
                          testID="bgClearBtn"
                        >
                          <Trash2 size={16} color="#ef4444" />
                          <Text style={[styles.deleteButtonText, { color: '#ef4444' }]}>Clear</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.bgImageUploadPlaceholder}>
                      <View style={styles.bgImageUploadButtons}>
                        <TouchableOpacity 
                          style={[styles.sheetButton, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                          onPress={async () => {
                            try {
                              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                              if (status !== 'granted') {
                                Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
                                return;
                              }
                              const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: false,
                                quality: 0.9,
                                base64: Platform.OS === 'web',
                              });
                              if (!result.canceled && result.assets[0]) {
                                const asset = result.assets[0];
                                let imageUri = asset.uri;
                                if (Platform.OS === 'web' && asset.base64) {
                                  imageUri = `data:image/jpeg;base64,${asset.base64}`;
                                }
                                if (activeBlockId) {
                                  updateBlock(activeBlockId, { bgStyle: { ...block.bgStyle, mode: currentMode, imageUrl: imageUri, transition: block.bgStyle?.transition || 'fade' } });
                                }
                              }
                            } catch (error) {
                              console.error('Error picking image:', error);
                              Alert.alert('Error', 'Failed to pick image. Please try again.');
                            }
                          }}
                          testID="bgUploadBtn"
                        >
                          <Upload size={16} color={activeTheme.colors.text.primary} />
                          <Text style={[styles.sheetButtonText, { color: activeTheme.colors.text.primary }]}>Upload Image</Text>
                        </TouchableOpacity>
                        {Platform.OS !== 'web' && (
                          <TouchableOpacity 
                            style={[styles.sheetButton, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                            onPress={async () => {
                              try {
                                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                                if (status !== 'granted') {
                                  Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos.');
                                  return;
                                }
                                const result = await ImagePicker.launchCameraAsync({
                                  allowsEditing: false,
                                  quality: 0.9,
                                  base64: Platform.OS === 'web',
                                });
                                if (!result.canceled && result.assets[0]) {
                                  const asset = result.assets[0];
                                  let imageUri = asset.uri;
                                  if (Platform.OS === 'web' && asset.base64) {
                                    imageUri = `data:image/jpeg;base64,${asset.base64}`;
                                  }
                                  if (activeBlockId) {
                                  updateBlock(activeBlockId, { bgStyle: { ...block.bgStyle, mode: currentMode, imageUrl: imageUri, transition: block.bgStyle?.transition || 'fade' } });
                                }
                                }
                              } catch (error) {
                                console.error('Error taking photo:', error);
                                Alert.alert('Error', 'Failed to take photo. Please try again.');
                              }
                            }}
                          >
                            <Camera size={16} color="#10b981" />
                            <Text style={[styles.sheetButtonText, { color: activeTheme.colors.text.primary }]}>Take Photo</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={[styles.bgImageUploadHint, { color: activeTheme.colors.text.muted }]}>
                        Upload a background image from your device or take a new photo
                      </Text>
                    </View>
                  )}
                </View>
              </>
            );
          })()}
          
          {block.type === 'text' && (
            <>
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetLabel, { color: activeTheme.colors.text.primary }]}>Character</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.characterScroll}>
                  <TouchableOpacity
                    style={[
                      styles.characterButton,
                      {
                        backgroundColor: !block.textStyle?.characterId 
                          ? '#6366f1' 
                          : activeTheme.colors.surface,
                        borderColor: !block.textStyle?.characterId 
                          ? '#6366f1' 
                          : activeTheme.colors.border
                      }
                    ]}
                    onPress={() => handleCharacterChange('')}
                  >
                    <Text style={[
                      styles.characterButtonText, 
                      { color: !block.textStyle?.characterId ? '#fff' : activeTheme.colors.text.primary }
                    ]}>None</Text>
                  </TouchableOpacity>
                  {characters.map((character) => (
                    <TouchableOpacity
                      key={character.id}
                      style={[
                        styles.characterButton,
                        {
                          backgroundColor: block.textStyle?.characterId === character.id 
                            ? character.color 
                            : activeTheme.colors.surface,
                          borderColor: block.textStyle?.characterId === character.id 
                            ? character.color 
                            : activeTheme.colors.border
                        }
                      ]}
                      onPress={() => handleCharacterChange(character.id)}
                    >
                      <Text style={[
                        styles.characterButtonText,
                        { color: block.textStyle?.characterId === character.id ? '#fff' : activeTheme.colors.text.primary }
                      ]}>
                        {character.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.sheetSection}>
                <View style={styles.bubbleTypeHeader}>
                  <Text style={[styles.sheetLabel, { color: activeTheme.colors.text.primary }]}>Bubble Type</Text>
                  <TouchableOpacity 
                    style={styles.addBubbleButton}
                    onPress={() => {
                      console.log('[addBubbleButton] Opening custom bubble editor');
                      onOpenCustomBubbleEditor();
                    }}
                  >
                    <Plus size={16} color="#6366f1" />
                  </TouchableOpacity>
                </View>
                <View style={styles.segmentControl}>
                  {[
                    { type: 'plain', icon: Type, color: '#10b981', label: 'Plain' },
                    { type: 'dialogue', icon: MessageCircle, color: '#6366f1', label: 'Dialogue' },
                    { type: 'thinking', icon: Cloud, color: '#8b5cf6', label: 'Thinking' },
                    { type: 'shout', color: '#f59e0b', label: 'Shout' }
                  ].map(({ type, icon: Icon, color, label }) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.segmentButton,
                        {
                          backgroundColor: (block.textStyle?.bubbleType || 'plain') === type 
                            ? '#6366f1' 
                            : activeTheme.colors.surface,
                          borderColor: (block.textStyle?.bubbleType || 'plain') === type 
                            ? '#6366f1' 
                            : activeTheme.colors.border
                        }
                      ]}
                      onPress={() => handleBubbleTypeChange(type as any)}
                    >
                      {type === 'shout' ? (
                        <View style={{ width: 16, height: 16 }}>
                          <Svg width="16" height="16" viewBox="0 0 24 24">
                            <Path fill={(block.textStyle?.bubbleType || 'plain') === type ? '#fff' : color} d="m17.7 17.7l-2.15-4.175L18.075 11L16 8.925V6h-2.925L11 3.925L8.925 6H6v2.925L3.925 11L6 13.075V16h2.925L11 18.075l2.5-2.5l4.2 2.125Zm3 3q-.2.2-.513.275t-.637-.1L13.9 18l-2.2 2.2q-.3.3-.7.3t-.7-.3L8.1 18H5q-.425 0-.713-.288T4 17v-3.1l-2.2-2.2q-.3-.3-.3-.7t.3-.7L4 8.1V5q0-.425.288-.713T5 4h3.1l2.2-2.2q.3-.3.7-.3t.7.3L13.9 4H17q.425 0 .713.288T18 5v3.1l2.2 2.2q.3.3.3.7t-.3.7L18 13.9l2.875 5.65q.175.325.1.637t-.275.513ZM11 11Z"/>
                          </Svg>
                        </View>
                      ) : Icon ? (
                        <Icon size={16} color={
                          (block.textStyle?.bubbleType || 'plain') === type 
                            ? '#fff' 
                            : color
                        } />
                      ) : null}
                      <Text style={[
                        styles.segmentButtonText,
                        {
                          color: (block.textStyle?.bubbleType || 'plain') === type 
                            ? '#fff' 
                            : activeTheme.colors.text.primary
                        }
                      ]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetLabel, { color: activeTheme.colors.text.primary }]}>Alignment</Text>
                <View style={styles.segmentControl}>
                  {[
                    { value: 'left', icon: AlignLeft, label: 'Left' },
                    { value: 'center', icon: AlignCenter, label: 'Center' },
                    { value: 'right', icon: AlignRight, label: 'Right' }
                  ].map(({ value, icon: Icon, label }) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.segmentButton,
                        {
                          backgroundColor: (block.textStyle?.alignment || 'center') === value 
                            ? '#6366f1' 
                            : activeTheme.colors.surface,
                          borderColor: (block.textStyle?.alignment || 'center') === value 
                            ? '#6366f1' 
                            : activeTheme.colors.border
                        }
                      ]}
                      onPress={() => handleAlignmentChange(value as any)}
                    >
                      <Icon size={16} color={
                        (block.textStyle?.alignment || 'center') === value 
                          ? '#fff' 
                          : activeTheme.colors.text.primary
                      } />
                      <Text style={[
                        styles.segmentButtonText,
                        {
                          color: (block.textStyle?.alignment || 'center') === value 
                            ? '#fff' 
                            : activeTheme.colors.text.primary
                        }
                      ]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.sheetSection}>
                <Text style={[styles.sheetLabel, { color: activeTheme.colors.text.primary }]}>Block Spacing</Text>
                <View style={styles.segmentControl}>
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[
                        styles.segmentButton,
                        {
                          backgroundColor: (block.spacing ?? 0) === n 
                            ? '#6366f1' 
                            : activeTheme.colors.surface,
                          borderColor: (block.spacing ?? 0) === n 
                            ? '#6366f1' 
                            : activeTheme.colors.border
                        }
                      ]}
                      onPress={() => activeBlockId && updateBlock(activeBlockId, { spacing: n })}
                    >
                      <Text style={[
                        styles.segmentButtonText,
                        {
                          color: (block.spacing ?? 0) === n 
                            ? '#fff' 
                            : activeTheme.colors.text.primary
                        }
                      ]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            </>
          )}
          
          <View style={styles.sheetSection}>
            <TouchableOpacity 
              style={[styles.deleteButton, { borderColor: '#ef4444' }]}
              onPress={() => {
                Alert.alert(
                  'Delete Block',
                  'Are you sure you want to delete this block?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => { onDelete(); onClose(); } }
                  ]
                );
              }}
              testID="imgDeleteBtn"
            >
              <Trash2 size={16} color="#ef4444" />
              <Text style={[styles.deleteButtonText, { color: '#ef4444' }]}>Delete Block</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

interface BlockEditorProps {
  block: Block;
  index: number;
  characters: Character[];
  blocks: Block[];
  onUpdate: (index: number, block: Block) => void;
  onDelete: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onOpenSettings: (block: Block, index: number) => void;
  isActive: boolean;
  onFocus: () => void;
  globalSpacing: number;
  onOpenBubblePicker: (blockId: string) => void;
}

function BlockEditor({ block, index, characters, blocks: _blocks, onUpdate, onDelete, onMoveUp, onMoveDown, onOpenSettings, isActive, onFocus, globalSpacing, onOpenBubblePicker }: BlockEditorProps) {
  const { activeTheme } = useTheme();
  
  console.log('[render]', block.id, block.spacing);

  const handleContentChange = (content: string) => {
    onUpdate(index, { ...block, content });
  };

  const handleImagePicker = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Don't force editing to preserve original dimensions
        quality: 0.9, // Higher quality
        base64: Platform.OS === 'web', // Use base64 for web, URI for native
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let imageUri = asset.uri;
        
        // For web, use base64 data URI
        if (Platform.OS === 'web' && asset.base64) {
          imageUri = `data:image/jpeg;base64,${asset.base64}`;
        }
        
        console.log('Image selected:', { uri: imageUri, width: asset.width, height: asset.height });
        onUpdate(index, { ...block, content: imageUri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleCameraPicker = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Don't force editing to preserve original dimensions
        quality: 0.9, // Higher quality
        base64: Platform.OS === 'web',
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let imageUri = asset.uri;
        
        // For web, use base64 data URI
        if (Platform.OS === 'web' && asset.base64) {
          imageUri = `data:image/jpeg;base64,${asset.base64}`;
        }
        
        console.log('Photo taken:', { uri: imageUri, width: asset.width, height: asset.height });
        onUpdate(index, { ...block, content: imageUri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    if (block.type === 'text') {
      onUpdate(index, {
        ...block,
        textStyle: { ...block.textStyle, alignment }
      });
    } else if (block.type === 'image') {
      onUpdate(index, {
        ...block,
        imageStyle: { ...block.imageStyle, alignment }
      });
    }
  };



  const getBubbleIcon = (bubbleType?: string) => {
    switch (bubbleType) {
      case 'dialogue': return <MessageCircle size={16} color="#6366f1" />;
      case 'thinking': return <Cloud size={16} color="#8b5cf6" />;
      case 'shout': return (
        <View style={{ width: 16, height: 16 }}>
          <Svg width="16" height="16" viewBox="0 0 24 24">
            <Path fill="#f59e0b" d="m17.7 17.7l-2.15-4.175L18.075 11L16 8.925V6h-2.925L11 3.925L8.925 6H6v2.925L3.925 11L6 13.075V16h2.925L11 18.075l2.5-2.5l4.2 2.125Zm3 3q-.2.2-.513.275t-.637-.1L13.9 18l-2.2 2.2q-.3.3-.7.3t-.7-.3L8.1 18H5q-.425 0-.713-.288T4 17v-3.1l-2.2-2.2q-.3-.3-.3-.7t.3-.7L4 8.1V5q0-.425.288-.713T5 4h3.1l2.2-2.2q.3-.3.7-.3t.7.3L13.9 4H17q.425 0 .713.288T18 5v3.1l2.2 2.2q.3.3.3.7t-.3.7L18 13.9l2.875 5.65q.175.325.1.637t-.275.513ZM11 11Z"/>
          </Svg>
        </View>
      );
      default: return <Type size={16} color="#10b981" />;
    }
  };

  const selectedCharacter = characters.find(c => c.id === block.textStyle?.characterId);

  return (
    <Pressable 
      onPress={onFocus}
      style={[
        styles.blockEditor, 
        { 
          backgroundColor: activeTheme.colors.card,
          borderWidth: isActive ? 2 : 1,
          borderColor: isActive ? '#6366f1' : activeTheme.colors.border,
          marginVertical: 8 + ((globalSpacing + (Number(block.spacing) || 0)) * 20)
        }
      ]}
    >
      <View style={[styles.blockHeader, { backgroundColor: activeTheme.colors.surface }]}>
        <TouchableOpacity 
          style={styles.blockType}
          onPress={() => {
            console.log('Block type pressed:', { blockType: block.type, blockId: block.id });
            if (block.type === 'text') {
              onFocus();
              onOpenBubblePicker(block.id);
            } else {
              onOpenSettings(block, index);
            }
          }}
        >
          {block.type === 'image' ? (
            <ImageIcon size={16} color="#10b981" />
          ) : block.type === 'BG' ? (
            <ImageIcon size={16} color="#f59e0b" />
          ) : (
            getBubbleIcon(block.textStyle?.bubbleType)
          )}
          <Text style={[styles.blockTypeText, { color: activeTheme.colors.text.primary }]}>
            {block.type === 'image' ? 'Image' : block.type === 'BG' ? `BG ${block.bgStyle?.mode || 'OPEN'}` : (block.textStyle?.bubbleType || 'Text')}
          </Text>
          {selectedCharacter && (
            <View style={[styles.characterIndicator, { backgroundColor: selectedCharacter.color }]}>
              <Text style={styles.characterInitial}>{selectedCharacter.name[0]}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.blockActions}>
          {(block.type === 'text' || block.type === 'image') && (
            <View style={styles.alignmentControls}>
              <TouchableOpacity
                style={[
                  styles.alignmentButton,
                  (block.type === 'text' ? block.textStyle?.alignment : block.imageStyle?.alignment) === 'left' && styles.alignmentButtonActive,
                  block.type === 'image' && block.imageStyle?.sizeMode === 'full' && styles.alignmentButtonDisabled
                ]}
                onPress={() => handleAlignmentChange('left')}
                disabled={block.type === 'image' && block.imageStyle?.sizeMode === 'full'}
              >
                <AlignLeft size={14} color={
                  block.type === 'image' && block.imageStyle?.sizeMode === 'full' 
                    ? '#666' 
                    : (block.type === 'text' ? block.textStyle?.alignment : block.imageStyle?.alignment) === 'left' 
                      ? '#6366f1' 
                      : activeTheme.colors.text.muted
                } />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.alignmentButton,
                  (block.type === 'text' ? block.textStyle?.alignment : block.imageStyle?.alignment) === 'center' && styles.alignmentButtonActive,
                  block.type === 'image' && block.imageStyle?.sizeMode === 'full' && styles.alignmentButtonDisabled
                ]}
                onPress={() => handleAlignmentChange('center')}
                disabled={block.type === 'image' && block.imageStyle?.sizeMode === 'full'}
              >
                <AlignCenter size={14} color={
                  block.type === 'image' && block.imageStyle?.sizeMode === 'full' 
                    ? '#666' 
                    : (block.type === 'text' ? block.textStyle?.alignment : block.imageStyle?.alignment) === 'center' 
                      ? '#6366f1' 
                      : activeTheme.colors.text.muted
                } />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.alignmentButton,
                  (block.type === 'text' ? block.textStyle?.alignment : block.imageStyle?.alignment) === 'right' && styles.alignmentButtonActive,
                  block.type === 'image' && block.imageStyle?.sizeMode === 'full' && styles.alignmentButtonDisabled
                ]}
                onPress={() => handleAlignmentChange('right')}
                disabled={block.type === 'image' && block.imageStyle?.sizeMode === 'full'}
              >
                <AlignRight size={14} color={
                  block.type === 'image' && block.imageStyle?.sizeMode === 'full' 
                    ? '#666' 
                    : (block.type === 'text' ? block.textStyle?.alignment : block.imageStyle?.alignment) === 'right' 
                      ? '#6366f1' 
                      : activeTheme.colors.text.muted
                } />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={() => onMoveUp(index)} disabled={index === 0}>
            <Text style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onMoveDown(index)}>
            <Text style={styles.moveButton}>↓</Text>
          </TouchableOpacity>
          <Pressable 
            onPress={() => {
              console.log('Settings button pressed:', { blockType: block.type, blockId: block.id });
              onOpenSettings(block, index);
            }}
            style={[
              { padding: 4, borderRadius: 4, zIndex: 10 },
              { backgroundColor: 'rgba(99, 102, 241, 0.2)' }
            ]}
            hitSlop={10}
            testID={block.type === 'image' ? 'imgGear' : 'textGear'}
          >
            <Settings size={16} color="#6366f1" />
          </Pressable>
          <TouchableOpacity onPress={() => onDelete(index)}>
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.blockContent}>
        {block.type === 'BG' ? (
          <View style={styles.bgBlockContainer}>
            <View style={styles.bgBlockInputRow}>
              <TextInput
                style={[
                  styles.bgBlockInput,
                  { 
                    backgroundColor: activeTheme.colors.surface, 
                    color: activeTheme.colors.text.primary, 
                    borderColor: activeTheme.colors.border 
                  }
                ]}
                value={block.bgStyle?.imageUrl || ''}
                onChangeText={(url) => onUpdate(index, { ...block, bgStyle: { ...block.bgStyle, mode: block.bgStyle?.mode || 'OPEN', imageUrl: url, transition: block.bgStyle?.transition || 'fade' } })}
                placeholder="Enter background image URL..."
                placeholderTextColor={activeTheme.colors.text.muted}
                multiline
              />
            </View>
            <Text style={[styles.bgBlockLabel, { color: activeTheme.colors.text.primary }]}>
              {block.bgStyle?.mode === 'OPEN' ? '🔓 Background Start' : block.bgStyle?.mode === 'BRIDGE' ? '🌉 Background Bridge' : '🔒 Background End'} ({block.bgStyle?.transition || 'fade'})
            </Text>
          </View>
        ) : block.type === 'text' ? (
          <TextInput
            style={[
              styles.blockInput,
              { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text.primary, borderColor: activeTheme.colors.border },
              selectedCharacter && { borderLeftColor: selectedCharacter.color, borderLeftWidth: 3 }
            ]}
            value={block.content}
            onChangeText={handleContentChange}
            placeholder="Enter text content..."
            placeholderTextColor={activeTheme.colors.text.muted}
            multiline
          />

        ) : (
          <View style={styles.imageUploadContainer}>
            {!block.content ? (
              <View style={styles.imageUploadPlaceholder}>
                <View style={styles.imageUploadButtons}>
                  <TouchableOpacity 
                    style={[styles.imageUploadButton, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                    onPress={handleImagePicker}
                  >
                    <Upload size={20} color="#6366f1" />
                    <Text style={[styles.imageUploadButtonText, { color: activeTheme.colors.text.primary }]}>Upload Image</Text>
                  </TouchableOpacity>
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity 
                      style={[styles.imageUploadButton, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                      onPress={handleCameraPicker}
                    >
                      <Camera size={20} color="#10b981" />
                      <Text style={[styles.imageUploadButtonText, { color: activeTheme.colors.text.primary }]}>Take Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={[styles.imageUploadHint, { color: activeTheme.colors.text.muted }]}>
                  Upload an image from your device or take a new photo
                </Text>
              </View>
            ) : (
              <View style={styles.imageUploadPreview}>
                <SafeImage 
                  uri={block.content} 
                  style={styles.imagePreviewLarge}
                  resizeMode="cover"
                  fallback={
                    <View style={[styles.imagePreviewLarge, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: '#666', fontSize: 12 }}>Invalid Image</Text>
                    </View>
                  }
                />
                <View style={styles.imageUploadActions}>
                  <TouchableOpacity 
                    style={[styles.imageChangeButton, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                    onPress={handleImagePicker}
                  >
                    <Upload size={16} color="#6366f1" />
                    <Text style={[styles.imageChangeButtonText, { color: activeTheme.colors.text.primary }]}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.imageRemoveButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }]}
                    onPress={() => onUpdate(index, { ...block, content: '' })}
                  >
                    <Trash2 size={16} color="#ef4444" />
                    <Text style={[styles.imageRemoveButtonText, { color: '#ef4444' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        
        {block.type === 'text' && block.content && (
          <View style={[
            styles.blockPreview, 
            { backgroundColor: 'rgba(0, 0, 0, 0.3)' }
          ]}>
            <BubbleRenderer block={block} characters={characters} />
          </View>
        )}
        
        {block.type === 'image' && block.content && (
          <View style={[
            styles.blockPreview, 
            { backgroundColor: 'rgba(0, 0, 0, 0.3)' }
          ]}>
            <BubbleRenderer block={block} characters={characters} />
          </View>
        )}
        

      </View>


    </Pressable>
  );
}

export default function ChapterEditScreen() {
  const { projectId, chapterId: initialChapterId } = useLocalSearchParams<{ 
    projectId: string; 
    chapterId: string; 
  }>();
  const [chapterId, setChapterId] = useState(initialChapterId);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [afterNote, setAfterNote] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { activeTheme } = useTheme();
  
  // Settings sheet state
  const [settingsSheetVisible, setSettingsSheetVisible] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [spacingMenuVisible, setSpacingMenuVisible] = useState(false);
  const [globalSpacing, setGlobalSpacing] = useState(0);
  const [bubbleTypePickerVisible, setBubbleTypePickerVisible] = useState(false);
  const [_customBubbleEditorVisible, setCustomBubbleEditorVisible] = useState(false);
  const [customBubbles, setCustomBubbles] = useState<CustomBubble[]>([]);
  
  // Custom bubble editor state
  const [bubbleName, setBubbleName] = useState('');
  const [bubbleImageUrl, setBubbleImageUrl] = useState('');
  const [bubbleCapInsets, setBubbleCapInsets] = useState({ top: 20, left: 20, bottom: 20, right: 20 });
  const [bubbleTintable, setBubbleTintable] = useState(false);

  // Novel mode state
  const [novelMode, setNovelMode] = useState(false);
  const [novelText, setNovelText] = useState('');
  const [novelPreview, setNovelPreview] = useState(false);

  
  // Load existing chapter and characters
  useEffect(() => {
    const loadData = async () => {
      if (chapterId && projectId) {
        try {
          const chapter = await getChapter(chapterId);
          if (chapter) {
            console.log('Loaded chapter:', { title: chapter.title, blocksCount: chapter.blocks.length });
            setTitle(chapter.title);
            setBlocks(chapter.blocks);
            setAfterNote(chapter.afterNote || '');
            setThumbnail((chapter as any).thumbnail || null);
            setGlobalSpacing(chapter.globalSpacing ?? 0);
          }
          
          const chars = await listCharacters(projectId);
          setCharacters(chars);
          
          const bubbles = await listCustomBubbles(projectId);
          setCustomBubbles(bubbles);
        } catch (error) {
          console.error('Error loading chapter data:', error);
        }
      } else if (projectId) {
        // New chapter - just load characters and custom bubbles
        try {
          const chars = await listCharacters(projectId);
          setCharacters(chars);
          
          const bubbles = await listCustomBubbles(projectId);
          setCustomBubbles(bubbles);
        } catch (error) {
          console.error('Error loading characters:', error);
        }
      }
    };
    
    void loadData();
  }, [chapterId, projectId]);

  const showToast = (message: string) => {
    if (!message.trim()) return;
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  };

  const _validateImageContent = async (content: string): Promise<boolean> => {
    if (!content?.trim()) return false;
    
    // For base64 data URIs (web)
    if (content.startsWith('data:image/')) {
      return true; // Base64 images are valid by default
    }
    
    // For file URIs (native)
    if (content.startsWith('file://') || content.startsWith('content://')) {
      return true; // Local file URIs are valid by default
    }
    
    // For HTTP URLs (legacy support)
    if (content.startsWith('http')) {
      try {
        if (Platform.OS === 'web') {
          if (!content.trim()) return false;
          const response = await fetch(content, { method: 'HEAD' });
          return response.ok && (response.headers.get('content-type')?.startsWith('image/') || false);
        }

        return new Promise((resolve) => {
          Image.getSize(
            content,
            () => resolve(true),
            () => resolve(false)
          );
        });
      } catch {
        return false;
      }
    }
    
    return false;
  };

  const handleSaveDraft = React.useCallback(async () => {
    if (!projectId) {
      console.error('Missing projectId:', { projectId });
      setSaveError('Missing project ID');
      showToast('Error: Missing project ID');
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);

    try {
      // If in novel mode, convert prose to blocks before saving
      const blocksToSave = novelMode ? novelTextToBlocks(novelText) : blocks;
      if (novelMode && blocksToSave.length > 0) {
        setBlocks(blocksToSave);
      }

      console.log('[saveDraft] Starting save draft:', { title, afterNote, blocksCount: blocksToSave.length, projectId, chapterId });

      // Validate blocks have proper spacing values and ensure all required fields
      const validatedBlocks = blocksToSave.map((block, index) => {
        // Sanitize content to remove control characters that cause syntax errors
        let sanitizedContent = '';
        try {
          if (block.content === null || block.content === undefined) {
            sanitizedContent = '';
          } else {
            const rawContent = typeof block.content === 'string' ? block.content : String(block.content);
            sanitizedContent = rawContent
              .split('')
              .filter((character) => {
                const code = character.charCodeAt(0);
                if (block.type === 'text') {
                  return code >= 32 || code === 10 || code === 13;
                }

                return code >= 32;
              })
              .join('');

            if (block.type !== 'text') {
              sanitizedContent = sanitizedContent.replace(/[\r\n]+/g, '').trim();
            }
          }
        } catch (e) {
          console.error('[saveDraft] Error sanitizing content:', e);
          sanitizedContent = '';
        }
        
        const baseBlock: Block = {
          id: block.id,
          type: block.type,
          content: sanitizedContent,
          order: index,
          spacing: typeof block.spacing === 'string' ? parseInt(block.spacing, 10) : (block.spacing ?? 0)
        };
        
        // Ensure text blocks have textStyle
        if (baseBlock.type === 'text') {
          baseBlock.textStyle = block.textStyle || {
            bubbleType: 'plain',
            alignment: 'center',
            isBold: false,
            isItalic: false
          };
        }
        
        // Ensure image blocks have imageStyle
        if (baseBlock.type === 'image') {
          baseBlock.imageStyle = block.imageStyle || {
            alignment: 'center',
            sizeMode: 'default',
            roundedCorners: false
          };
        }
        
        // Ensure BG blocks have bgStyle
        if (baseBlock.type === 'BG') {
          baseBlock.bgStyle = block.bgStyle || {
            mode: 'OPEN',
            imageUrl: sanitizedContent,
            transition: 'fade'
          };
        }
        
        return baseBlock;
      });
      
      let savedChapterId = chapterId;
      
      // If no chapterId, create a new chapter first
      if (!chapterId) {
        const result = await dbCreateChapter(projectId, { title: title.trim() || 'Untitled Chapter' });
        savedChapterId = result.id;
        setChapterId(savedChapterId);
        console.log('[saveDraft] Created new chapter:', savedChapterId);
      }
      
      // Update chapter metadata
      await updateChapter(savedChapterId, {
        title: title.trim() || 'Untitled Chapter',
        afterNote: afterNote.trim(),
        status: 'DRAFT',
        globalSpacing,
        thumbnail: thumbnail || undefined
      } as any);
      
      // Update chapter blocks - CRITICAL: Save blocks to database
      console.log('[saveDraft] Saving blocks to database:', validatedBlocks.length);
      await updateChapterBlocks(savedChapterId, validatedBlocks);
      
      // Verify blocks were saved by reloading
      const reloadedChapter = await getChapter(savedChapterId);
      console.log('[saveDraft] Verified saved blocks:', reloadedChapter?.blocks.length);
      
      // Update local state to match saved data
      if (reloadedChapter?.blocks) {
        setBlocks(reloadedChapter.blocks);
      }
      
      console.log('[saveDraft] Draft saved successfully:', { 
        id: savedChapterId, 
        title: title.trim(), 
        blocksCount: validatedBlocks.length,
        globalSpacing 
      });
      const now = new Date();
      setLastSaved(now);
      showToast(`Draft saved • ${now.toLocaleTimeString()}`);
    } catch (error) {
      console.error('[saveDraft] Error:', error);
      setSaveError('Failed to save draft');
      showToast('Failed to save draft: ' + String(error));
    } finally {
      setIsSaving(false);
    }
  }, [title, blocks, afterNote, projectId, chapterId, globalSpacing, thumbnail, novelMode, novelText]);

  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // Auto-save every 15 seconds
    const timer = setTimeout(() => {
      if (title.trim() || blocks.length > 0 || afterNote.trim()) {
        void handleSaveDraft();
      }
    }, 15000);
    
    setAutoSaveTimer(timer);
    
    return () => {
      clearTimeout(timer);
    };
  }, [title, blocks.length, afterNote, globalSpacing, autoSaveTimer, handleSaveDraft]);

  const handleToBroadcast = async () => {
    if (!projectId) {
      console.error('Missing projectId for broadcast:', { projectId });
      Alert.alert('Error', 'Missing project information');
      return;
    }
    
    // Validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a chapter title');
      return;
    }
    if (blocks.length === 0 && (!novelMode || !novelText.trim())) {
      Alert.alert('Validation Error', 'Please add at least one block to your chapter');
      return;
    }
    
    // Check for empty text blocks
    const emptyTextBlocks = blocks.filter(block => 
      block.type === 'text' && (!block.content || !block.content.trim())
    );
    if (emptyTextBlocks.length > 0) {
      Alert.alert(
        'Validation Error', 
        `Please add content to all text blocks before sending to broadcast. ${emptyTextBlocks.length} text block(s) are empty.`
      );
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      console.log('[toBroadcast] Starting send to broadcast:', { title, blocks: blocks.length, projectId, chapterId });
      
      // Validate blocks have proper spacing values
      const validatedBlocks = blocks.map(block => ({
        ...block,
        spacing: typeof block.spacing === 'string' ? parseInt(block.spacing, 10) : (block.spacing ?? 0)
      }));
      
      let savedChapterId = chapterId;
      
      // If no chapterId, create a new chapter first
      if (!chapterId) {
        const result = await dbCreateChapter(projectId, { title: title.trim() });
        savedChapterId = result.id;
        setChapterId(savedChapterId);
        console.log('[toBroadcast] Created new chapter:', savedChapterId);
      }
      
      // Update chapter metadata
      await updateChapter(savedChapterId, {
        title: title.trim(),
        afterNote: afterNote.trim(),
        status: 'DRAFT',
        globalSpacing,
        thumbnail: thumbnail || undefined
      } as any);
      
      // Update chapter blocks
      await updateChapterBlocks(savedChapterId, validatedBlocks);
      
      // Add to broadcast queue
      await addChapterToBroadcastQueue(projectId, savedChapterId);
      
      console.log('[toBroadcast] Chapter sent to broadcast successfully:', { id: savedChapterId, title: title.trim() });
      showToast('Sent to Broadcast!');
      
      // Navigate back to chapters list after a short delay
      setTimeout(() => {
        goBackOrFallback(router, '/');
      }, 1500);
    } catch (error) {
      console.warn('[toBroadcast]', error);
      setSaveError('Failed to send to broadcast');
      Alert.alert('Error', 'Failed to send to broadcast. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlock = (type: 'text' | 'image' | 'BG', bubbleType?: 'plain' | 'dialogue' | 'thinking' | 'shout') => {
    // Calculate next order (always append to end)
    const nextOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.order)) + 1 : 0;
    
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: '',
      order: nextOrder,
      spacing: 0, // Default spacing
      textStyle: type === 'text' ? {
        bubbleType: bubbleType || 'plain',
        alignment: 'center',
        isBold: false,
        isItalic: false
      } : undefined,
      imageStyle: type === 'image' ? {
        alignment: 'center',
        sizeMode: 'default',
        roundedCorners: false
      } : undefined,
      bgStyle: type === 'BG' ? {
        mode: 'OPEN',
        imageUrl: '',
        transition: 'fade'
      } : undefined
    };
    
    setBlocks([...blocks, newBlock]);
    
    // Auto-focus the new block (scroll to it)
    setTimeout(() => {
      // In a real implementation, you'd scroll to the new block
      console.log('New block added:', newBlock.id);
    }, 100);
  };

  const handleUpdateBlock = (index: number, block: Block) => {
    const updated = [...blocks];
    updated[index] = { ...block, order: index };
    setBlocks(updated);
  };
  
  const handleOpenSettings = (block: Block, index: number) => {
    if (!block) return;
    console.log('Opening settings for block:', { type: block.type, id: block.id, index });
    setActiveBlockId(block.id);
    setSettingsSheetVisible(true);
  };
  
  const updateBlock = (id: string, patch: Partial<Block>) => {
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b));
  };
  
  const getBlockById = (id: string) => {
    return blocks.find(b => b.id === id);
  };

  // Convert novel prose text to Block[] for saving
  const novelTextToBlocks = (text: string): Block[] => {
    const segs: Block[] = [];
    const parts = text.split(/("[^"]+")/g);
    let order = 0;
    for (const part of parts) {
      if (!part.trim()) continue;
      if (part.startsWith('"') && part.endsWith('"')) {
        const content = part.slice(1, -1).trim();
        if (!content) continue;
        segs.push({
          id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${order}`,
          type: 'text', content, order: order++, spacing: 0,
          textStyle: { bubbleType: content.includes('!') ? 'shout' : 'dialogue', alignment: 'center', isBold: false, isItalic: false },
        });
      } else {
        const paras = part.split(/\n\s*\n/).filter(p => p.trim());
        for (const para of paras) {
          segs.push({
            id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${order}`,
            type: 'text', content: para.trim(), order: order++, spacing: 0,
            textStyle: { bubbleType: 'plain', alignment: 'center', isBold: false, isItalic: false },
          });
        }
      }
    }
    return segs;
  };

  // Convert existing blocks to novel prose for novel mode
  const blocksToNovelText = (blks: Block[]): string => {
    return blks
      .filter(b => b.type === 'text')
      .map(b => {
        const bt = b.textStyle?.bubbleType;
        if (bt === 'dialogue' || bt === 'shout') return `"${b.content}"`;
        return b.content;
      })
      .join('\n\n');
  };

  const handleToggleNovelMode = () => {
    if (!novelMode) {
      // Entering novel mode — seed from existing blocks
      setNovelText(blocksToNovelText(blocks));
    } else {
      // Leaving novel mode — convert prose back to blocks
      const converted = novelTextToBlocks(novelText);
      if (converted.length > 0) setBlocks(converted);
    }
    setNovelMode(m => !m);
    setNovelPreview(false);
  };

  const handleSettingsDelete = () => {
    const blockIndex = blocks.findIndex(b => b.id === activeBlockId);
    if (blockIndex >= 0) {
      handleDeleteBlock(blockIndex);
    }
  };
  
  const handleCloseSettings = () => {
    setSettingsSheetVisible(false);
    // Keep activeBlockId for spacing functionality
  };

  const handleDeleteBlock = (index: number) => {
    const updated = blocks.filter((_, i) => i !== index);
    setBlocks(updated.map((block, i) => ({ ...block, order: i })));
  };

  const handleMoveBlockUp = (index: number) => {
    if (index === 0) return;
    const updated = [...blocks];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setBlocks(updated.map((block, i) => ({ ...block, order: i })));
  };

  const handleMoveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const updated = [...blocks];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setBlocks(updated.map((block, i) => ({ ...block, order: i })));
  };

  const _handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const fileUri = file.uri;
      const fileName = file.name.toLowerCase();

      let parsedChapters: ParsedChapter[] = [];

      if (fileName.endsWith('.txt')) {
        parsedChapters = await parseTXT(fileUri);
      } else if (fileName.endsWith('.docx')) {
        const DOCX_ENABLED = false;
        if (!DOCX_ENABLED) {
          showToast('DOCX disabled. Please use TXT format.');
          return;
        }
        parsedChapters = await parseDOCX(fileUri);
      } else {
        showToast('Unsupported file type. Use .txt or .docx');
        return;
      }

      if (parsedChapters.length === 0) {
        showToast('No content found in file');
        return;
      }

      const firstChapter = parsedChapters[0];
      if (!title.trim()) {
        setTitle(firstChapter.title);
      }

      const startOrder = blocks.length;
      const newBlocks = firstChapter.blocks.map((block, idx) => ({
        ...block,
        order: startOrder + idx,
      }));

      setBlocks([...blocks, ...newBlocks]);
      showToast(`Imported ${newBlocks.length} blocks from ${fileName.endsWith('.txt') ? 'TXT' : 'DOCX'}`);
    } catch (error) {
      console.error('[handleUploadFile] Error:', error);
      showToast('Upload Failed: Could not parse this file into story blocks.');
    }
  };

  const handleExit = () => {
    if (title.trim() || blocks.length > 0 || afterNote.trim()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before leaving?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => goBackOrFallback(router, '/') },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Draft & Exit', onPress: () => { void handleSaveDraft(); goBackOrFallback(router, '/'); } }
        ]
      );
    } else {
      goBackOrFallback(router, '/');
    }
  };

  const _handleSaveCustomBubble = async () => {
    if (!bubbleName.trim()) {
      Alert.alert('Validation Error', 'Please enter a bubble name');
      return;
    }
    if (!bubbleImageUrl.trim()) {
      Alert.alert('Validation Error', 'Please upload a bubble image');
      return;
    }
    
    try {
      await createCustomBubble(projectId!, {
        name: bubbleName.trim(),
        imageUrl: bubbleImageUrl,
        capInsets: bubbleCapInsets,
        tintable: bubbleTintable,
      });
      
      // Reload custom bubbles
      const bubbles = await listCustomBubbles(projectId!);
      setCustomBubbles(bubbles);
      
      // Reset form
      setBubbleName('');
      setBubbleImageUrl('');
      setBubbleCapInsets({ top: 20, left: 20, bottom: 20, right: 20 });
      setBubbleTintable(false);
      
      setCustomBubbleEditorVisible(false);
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Custom bubble created', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Custom bubble created');
      }
    } catch (error) {
      console.error('Error saving custom bubble:', error);
      Alert.alert('Error', 'Failed to save custom bubble');
    }
  };
  
  const _handlePickBubbleImage = async () => {
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
        
        setBubbleImageUrl(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const canPublish = title.trim() && (blocks.length > 0 || (novelMode && novelText.trim())) && !isSaving;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: activeTheme.colors.background }]}>
      <StatusBar barStyle={activeTheme.colors.background === '#000000' ? 'light-content' : 'dark-content'} backgroundColor={activeTheme.colors.background} />
      
      <View style={[styles.header, { borderBottomColor: activeTheme.colors.border }]}>
        <TouchableOpacity style={styles.backIcon} onPress={handleExit}>
          <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter} />
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[
              styles.previewButton,
              (!chapterId || blocks.length === 0) && styles.buttonDisabled
            ]} 
            onPress={() => {
              if (chapterId && blocks.length > 0) {
                router.push(`/project/${projectId}/chapters/${chapterId}/preview` as any);
              }
            }}
            disabled={!chapterId || blocks.length === 0}
            testID="btnPreview"
          >
            <Eye size={16} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.draftButton,
              isSaving && styles.buttonDisabled
            ]} 
            onPress={handleSaveDraft}
            disabled={isSaving}
            testID="btnSaveDraft"
          >
            <Text style={styles.draftButtonText}>
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.field}>
            <View style={styles.titleRow}>
              <Text style={[styles.editChapterTitle, { color: activeTheme.colors.text.primary }]}>Edit Chapter</Text>
              <TouchableOpacity 
                style={[
                  styles.publishButton, 
                  !canPublish && styles.publishButtonDisabled
                ]} 
                onPress={handleToBroadcast}
                disabled={!canPublish}
                testID="btnToBroadcast"
              >
                <Text style={styles.publishButtonText}>
                  {isSaving ? 'Sending...' : 'To Broadcast'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.label, { color: activeTheme.colors.text.primary }]}>Chapter Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: activeTheme.colors.card, color: activeTheme.colors.text.primary, borderColor: activeTheme.colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter chapter title..."
              placeholderTextColor={activeTheme.colors.text.muted}
            />
            
            <View style={styles.thumbnailSection}>
              <Text style={[styles.label, { color: activeTheme.colors.text.primary }]}>Chapter Thumbnail (Optional)</Text>
              <Text style={[styles.fieldDescription, { color: activeTheme.colors.text.muted }]}>
                Upload a thumbnail image for this chapter. It will appear in the chapter list for readers.
              </Text>
              {thumbnail ? (
                <View style={styles.thumbnailCompactPreview}>
                  <SafeImage 
                    uri={thumbnail} 
                    style={styles.thumbnailCompactImage}
                    resizeMode="cover"
                    fallback={
                      <View style={[styles.thumbnailCompactImage, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#666', fontSize: 10 }}>Invalid</Text>
                      </View>
                    }
                  />
                  <View style={styles.thumbnailCompactActions}>
                    <TouchableOpacity 
                      style={[styles.thumbnailCompactButton, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                      onPress={async () => {
                        try {
                          const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [16, 9],
                            quality: 0.8,
                            base64: Platform.OS === 'web',
                          });
                          if (!result.canceled && result.assets[0]) {
                            const asset = result.assets[0];
                            let imageUri = asset.uri;
                            if (Platform.OS === 'web' && asset.base64) {
                              imageUri = `data:image/jpeg;base64,${asset.base64}`;
                            }
                            setThumbnail(imageUri);
                          }
                        } catch (error) {
                          console.error('Error picking thumbnail:', error);
                          Alert.alert('Error', 'Failed to pick image');
                        }
                      }}
                    >
                      <Upload size={14} color={activeTheme.colors.text.primary} />
                      <Text style={[styles.thumbnailCompactButtonText, { color: activeTheme.colors.text.primary }]}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.thumbnailCompactButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }]}
                      onPress={() => setThumbnail(null)}
                    >
                      <Trash2 size={14} color="#ef4444" />
                      <Text style={[styles.thumbnailCompactButtonText, { color: '#ef4444' }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.thumbnailCompactUploadButton, { borderColor: activeTheme.colors.border }]}
                  onPress={async () => {
                    try {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [16, 9],
                        quality: 0.8,
                        base64: Platform.OS === 'web',
                      });
                      if (!result.canceled && result.assets[0]) {
                        const asset = result.assets[0];
                        let imageUri = asset.uri;
                        if (Platform.OS === 'web' && asset.base64) {
                          imageUri = `data:image/jpeg;base64,${asset.base64}`;
                        }
                        setThumbnail(imageUri);
                      }
                    } catch (error) {
                      console.error('Error picking thumbnail:', error);
                      Alert.alert('Error', 'Failed to pick image');
                    }
                  }}
                >
                  <ImageIcon size={20} color={activeTheme.colors.text.muted} />
                  <Text style={[styles.thumbnailCompactUploadText, { color: activeTheme.colors.text.muted }]}>Tap to upload</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.editorArea}>
            <View style={styles.editorHeader}>
              <Text style={[styles.editorTitle, { color: activeTheme.colors.text.primary }]}>Chapter Content</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {!novelMode && (
                  <TouchableOpacity
                    style={styles.spacingButton}
                    onPress={() => setSpacingMenuVisible(true)}
                    testID="spacingBtn"
                  >
                    <Text style={[styles.spacingButtonText, { color: activeTheme.colors.text.primary }]}>
                      Spacing ▾ ({globalSpacing})
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.spacingButton, novelMode && { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.12)' }]}
                  onPress={handleToggleNovelMode}
                  testID="btnNovelMode"
                >
                  <Text style={[styles.spacingButtonText, { color: novelMode ? '#6366f1' : activeTheme.colors.text.primary }]}>
                    {novelMode ? '📖 Novel' : '⬛ Blocks'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {novelMode ? (
              <View style={{ minHeight: 400 }}>
                <NovelEditor
                  value={novelText}
                  onChange={setNovelText}
                  preview={novelPreview}
                  onPreviewChange={setNovelPreview}
                />
              </View>
            ) : (
              <>
                {blocks.length === 0 ? (
                  <View style={[styles.editorPlaceholder, { backgroundColor: activeTheme.colors.surface }]}>
                    <Text style={[styles.editorPlaceholderText, { color: activeTheme.colors.text.muted }]}>
                      Add text blocks, images, and dialogue bubbles to build your chapter
                    </Text>
                  </View>
                ) : (
                  <View style={styles.blocksList}>
                    {blocks.map((block, index) => (
                      <BlockEditor
                        key={block.id}
                        block={block}
                        index={index}
                        characters={characters}
                        blocks={blocks}
                        onUpdate={handleUpdateBlock}
                        onDelete={handleDeleteBlock}
                        onMoveUp={handleMoveBlockUp}
                        onMoveDown={handleMoveBlockDown}
                        onOpenSettings={handleOpenSettings}
                        isActive={activeBlockId === block.id}
                        onFocus={() => {
                          setActiveBlockId(block.id);
                        }}
                        globalSpacing={globalSpacing}
                        onOpenBubblePicker={(blockId) => {
                          setActiveBlockId(blockId);
                          setBubbleTypePickerVisible(true);
                        }}
                      />
                    ))}
                  </View>
                )}

                {/* Add Block toolbar at bottom */}
                <View style={styles.addBlockToolbar}>
                  <TouchableOpacity
                    style={[styles.addBlockButton, { borderColor: '#6366f1' }]}
                    onPress={() => handleAddBlock('text')}
                    testID="btnAddText"
                  >
                    <Type size={16} color="#6366f1" />
                    <Text style={[styles.addBlockText, { color: '#6366f1' }]}>+ Text</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addBlockButton, { borderColor: '#6366f1' }]}
                    onPress={() => handleAddBlock('image')}
                    testID="btnAddImage"
                  >
                    <ImageIcon size={16} color="#6366f1" />
                    <Text style={[styles.addBlockText, { color: '#6366f1' }]}>+ Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addBlockButton, { borderColor: '#6366f1' }]}
                    onPress={() => handleAddBlock('BG')}
                    testID="btnAddBG"
                  >
                    <ImageIcon size={16} color="#6366f1" />
                    <Text style={[styles.addBlockText, { color: '#6366f1' }]}>+ BG</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: activeTheme.colors.text.primary }]}>After Note (Optional)</Text>
            <Text style={[styles.fieldDescription, { color: activeTheme.colors.text.muted }]}>
              A note that appears at the end of the chapter for readers
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: activeTheme.colors.card, color: activeTheme.colors.text.primary, borderColor: activeTheme.colors.border }]}
              value={afterNote}
              onChangeText={setAfterNote}
              placeholder="Write a note for your readers (optional)..."
              placeholderTextColor={activeTheme.colors.text.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Status indicators */}
          {isSaving && (
            <View style={styles.statusBar}>
              <Text style={styles.statusText}>Saving...</Text>
            </View>
          )}
          {saveError && (
            <TouchableOpacity style={styles.statusBar} onPress={handleSaveDraft}>
              <Text style={[styles.statusText, { color: '#ef4444' }]}>
                {saveError} — tap to retry
              </Text>
            </TouchableOpacity>
          )}
          {lastSaved && !isSaving && !saveError && (
            <View style={styles.statusBar}>
              <Text style={styles.statusText}>
                Saved as draft • {lastSaved.toLocaleTimeString()}
              </Text>
            </View>
          )}

          {characters.length === 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                💡 Create characters first to assign them to dialogue bubbles
              </Text>
              <TouchableOpacity 
                style={styles.charactersLink}
                onPress={() => router.push(`/create/project/${projectId}/characters`)}
              >
                <Text style={styles.charactersLinkText}>Manage Characters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      
      <BubbleTypePicker
        visible={bubbleTypePickerVisible}
        onClose={() => setBubbleTypePickerVisible(false)}
        activeBlockId={activeBlockId}
        getBlockById={getBlockById}
        updateBlock={updateBlock}
        customBubbles={customBubbles}
      />
      
      <BlockSettingsSheet
        visible={settingsSheetVisible}
        onClose={handleCloseSettings}
        activeBlockId={activeBlockId}
        getBlockById={getBlockById}
        updateBlock={updateBlock}
        blocks={blocks}
        characters={characters}
        onDelete={handleSettingsDelete}
        projectId={projectId!}
        onOpenCustomBubbleEditor={() => {
          console.log('[onOpenCustomBubbleEditor] Navigating to bubble editor');
          setSettingsSheetVisible(false);
          setTimeout(() => {
            router.push(`/create/project/${projectId}/bubbles` as any);
          }, 100);
        }}
      />
      
      {/* Spacing Menu Modal */}
      <Modal
        visible={spacingMenuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setSpacingMenuVisible(false)}
      >
        <Pressable 
          style={styles.spacingModalOverlay}
          onPress={() => setSpacingMenuVisible(false)}
        >
          <View style={[styles.spacingModalContent, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
            <Text style={[styles.spacingModalTitle, { color: activeTheme.colors.text.primary }]}>Global Spacing</Text>
            <View style={styles.spacingOptions}>
              {[0, 1, 2, 3, 4, 5].map(n => (
                <Pressable
                  key={n}
                  testID={`spacingOpt${n}`}
                  style={({ pressed }) => [
                    styles.spacingOption,
                    {
                      backgroundColor: pressed 
                        ? '#6366f1' 
                        : activeTheme.colors.background,
                      borderColor: activeTheme.colors.border,
                      transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }]
                    }
                  ]}
                  onPress={() => {
                    console.log('[global-spacing]', n);
                    setGlobalSpacing(n);
                    requestAnimationFrame(() => setSpacingMenuVisible(false));
                  }}
                  hitSlop={10}
                >
                  {({ pressed }) => (
                    <Text style={[
                      styles.spacingOptionText, 
                      { 
                        color: pressed 
                          ? '#fff' 
                          : activeTheme.colors.text.primary 
                      }
                    ]}>
                      {n}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
      
      {/* Bubble Type Picker Modal */}
      <Modal
        visible={bubbleTypePickerVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setBubbleTypePickerVisible(false)}
      >
        <Pressable 
          style={styles.bubblePickerOverlay}
          onPress={() => setBubbleTypePickerVisible(false)}
        >
          <View style={[styles.bubblePickerContent, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
            <Text style={[styles.bubblePickerTitle, { color: activeTheme.colors.text.primary }]}>Bubble Type</Text>
            <View style={styles.bubblePickerOptions}>
              {[
                { type: 'plain', icon: Type, color: '#10b981', label: 'Plain' },
                { type: 'dialogue', icon: MessageCircle, color: '#6366f1', label: 'Dialogue' },
                { type: 'thinking', icon: Cloud, color: '#8b5cf6', label: 'Thinking' },
                { type: 'shout', color: '#f59e0b', label: 'Shout' }
              ].map(({ type, icon: Icon, color, label }) => (
                <Pressable
                  key={type}
                  testID={`bubbleType${type}`}
                  style={({ pressed }) => [
                    styles.bubblePickerOption,
                    {
                      backgroundColor: pressed ? color : activeTheme.colors.background,
                      borderColor: color,
                      transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }]
                    }
                  ]}
                  onPress={() => {
                    try {
                      if (!activeBlockId) {
                        showToast('Block missing');
                        setBubbleTypePickerVisible(false);
                        return;
                      }
                      const block = getBlockById(activeBlockId);
                      if (!block || block.type !== 'text') {
                        showToast('Block missing');
                        setBubbleTypePickerVisible(false);
                        return;
                      }
                      updateBlock(activeBlockId, { 
                        textStyle: { 
                          ...block.textStyle, 
                          bubbleType: type as 'plain' | 'dialogue' | 'thinking' | 'shout' 
                        } 
                      });
                      setBubbleTypePickerVisible(false);
                    } catch (error) {
                      console.error('[bubbleTypePicker] Error updating:', error);
                      showToast('Failed to update bubble type');
                      setBubbleTypePickerVisible(false);
                    }
                  }}
                  hitSlop={10}
                >
                  {({ pressed }) => (
                    <View style={styles.bubblePickerOptionInner}>
                      {type === 'shout' ? (
                        <View style={{ width: 24, height: 24 }}>
                          <Svg width="24" height="24" viewBox="0 0 24 24">
                            <Path fill={pressed ? '#fff' : color} d="m17.7 17.7l-2.15-4.175L18.075 11L16 8.925V6h-2.925L11 3.925L8.925 6H6v2.925L3.925 11L6 13.075V16h2.925L11 18.075l2.5-2.5l4.2 2.125Zm3 3q-.2.2-.513.275t-.637-.1L13.9 18l-2.2 2.2q-.3.3-.7.3t-.7-.3L8.1 18H5q-.425 0-.713-.288T4 17v-3.1l-2.2-2.2q-.3-.3-.3-.7t.3-.7L4 8.1V5q0-.425.288-.713T5 4h3.1l2.2-2.2q.3-.3.7-.3t.7.3L13.9 4H17q.425 0 .713.288T18 5v3.1l2.2 2.2q.3.3.3.7t-.3.7L18 13.9l2.875 5.65q.175.325.1.637t-.275.513ZM11 11Z"/>
                          </Svg>
                        </View>
                      ) : Icon ? (
                        <Icon size={24} color={pressed ? '#fff' : color} />
                      ) : null}
                      <Text style={[
                        styles.bubblePickerOptionText,
                        { color: pressed ? '#fff' : activeTheme.colors.text.primary }
                      ]}>{label}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backIcon: {
    padding: 4,
    marginRight: 16,
  },
  editChapterTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  draftButtonText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  publishButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  publishButtonDisabled: {
    backgroundColor: '#666',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 100,
  },
  fieldDescription: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  editorArea: {
    marginBottom: 24,
  },
  editorTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editorPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  editorPlaceholderText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusBar: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  blocksList: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 16,
  },
  addBlockToolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  addBlockText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginTop: 16,
  },
  warningText: {
    color: '#f59e0b',
    fontSize: 14,
    marginBottom: 8,
  },
  charactersLink: {
    alignSelf: 'flex-start',
  },
  charactersLinkText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  blockEditor: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 120,
    maxHeight: 400,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  blockType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockTypeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  characterIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterInitial: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  blockActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moveButton: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  moveButtonDisabled: {
    color: '#666',
  },
  blockContent: {
    padding: 12,
  },
  blockInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 60,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 8,
    resizeMode: 'cover',
  },
  imageUploadContainer: {
    minHeight: 120,
  },
  imageUploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageUploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  imageUploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageUploadHint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  imageUploadPreview: {
    gap: 12,
  },
  imagePreviewLarge: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  bgImagePreview: {
    gap: 12,
  },
  bgImagePreviewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  bgImageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bgImageUploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bgImageUploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bgImageUploadHint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  imageUploadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  imageChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  imageChangeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  imageRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  imageRemoveButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  blockPreview: {
    marginTop: 8,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  blockControls: {
    padding: 12,
    gap: 12,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlLabel: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
    width: 60,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bubbleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  alignmentControls: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 4,
  },
  alignmentButton: {
    padding: 4,
    borderRadius: 4,
  },
  alignmentButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  alignmentButtonDisabled: {
    opacity: 0.4,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  controlButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  alignmentText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  formatText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  characterScroll: {
    flex: 1,
  },
  characterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  characterButtonActive: {
    borderColor: '#6366f1',
  },
  characterButtonText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  rangeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    padding: 8,
    color: '#fff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: 60,
    textAlign: 'center',
  },
  opacityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sheetSection: {
    marginVertical: 16,
  },
  sheetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  sheetInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 44,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  sheetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentControl: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  segmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubblePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubblePickerContainer: {
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  bubblePickerScroll: {
    maxHeight: 400,
  },
  bubblePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  bubblePickerButtons: {
    gap: 12,
  },
  bubblePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  bubblePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  spacingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  spacingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  spacingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacingModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    borderWidth: 1,
  },
  spacingModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  spacingOptions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  spacingOption: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  spacingOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bubblePickerContent: {
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    borderWidth: 1,
  },
  bubblePickerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  bubblePickerOption: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  bubblePickerOptionInner: {
    alignItems: 'center',
    gap: 4,
  },
  bubblePickerOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailSection: {
    marginTop: 16,
  },
  thumbnailCompactPreview: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbnailCompactImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  thumbnailCompactActions: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  thumbnailCompactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    flex: 1,
  },
  thumbnailCompactButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailCompactUploadButton: {
    marginTop: 8,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  thumbnailCompactUploadText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bubbleTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addBubbleButton: {
    padding: 4,
  },
  thumbnailPreview: {
    marginTop: 12,
    gap: 12,
  },
  thumbnailImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  thumbnailActions: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    flex: 1,
  },
  thumbnailButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  thumbnailUploadButton: {
    marginTop: 12,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  thumbnailUploadText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bgBlockContainer: {
    padding: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  bgBlockLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bgBlockUrl: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  bgBlockInputRow: {
    marginBottom: 8,
  },
  bgBlockInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 44,
  },
});