import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { goBackOrFallback } from '@/lib/navigation';
import { getProject } from '@/lib/database';
import { Plus, X, ArrowDown, ArrowRight, Save, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import SafeImage from '@/ui/SafeImage';

export default function IntroEditorScreen() {
  const { activeTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [longDesc, setLongDesc] = useState('');
  const [swipeDirection, setSwipeDirection] = useState<'right' | 'down'>('right');

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      try {
        const proj = await getProject(projectId);
        setProject(proj);
        if (proj?.broadcast?.intro) {
          setImages(proj.broadcast.intro.images || []);
          setLongDesc(proj.broadcast.intro.longDesc || '');
          setSwipeDirection(proj.broadcast.intro.swipe || 'right');
        }
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setLoading(false);
      }
    };
    void loadProject();
  }, [projectId]);

  const handleAddImage = async () => {
    if (images.length >= 30) {
      Alert.alert('Limit Reached', 'Maximum 30 images allowed');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.9,
        base64: Platform.OS === 'web',
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let imageUri = asset.uri;
        if (Platform.OS === 'web' && asset.base64) {
          imageUri = `data:image/jpeg;base64,${asset.base64}`;
        }
        setImages([...images, imageUri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!projectId) return;
    try {
      console.log('Intro saved:', { projectId, images, longDesc, swipeDirection });
      Alert.alert('Success', 'Intro saved successfully!');
    } catch (error) {
      console.error('Error saving intro:', error);
      Alert.alert('Error', 'Failed to save intro. Please try again.');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
      paddingTop: insets.top,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: activeTheme.colors.border,
    },
    backButton: {
      padding: 4,
      marginRight: 12,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: activeTheme.colors.text.primary,
      textAlign: 'center' as const,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: activeTheme.colors.accent,
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: activeTheme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: activeTheme.colors.text.primary,
      marginBottom: 16,
    },
    imagesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    imageItem: {
      width: 80,
      height: 120,
      borderRadius: 8,
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      position: 'relative' as const,
      overflow: 'hidden' as const,
    },
    imagePreview: {
      width: '100%',
      height: '100%',
    },
    removeButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: activeTheme.colors.error,
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addImageButton: {
      width: 80,
      height: 120,
      borderRadius: 8,
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 2,
      borderColor: activeTheme.colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addImageText: {
      color: activeTheme.colors.text.muted,
      fontSize: 12,
      marginTop: 4,
      textAlign: 'center',
    },
    textArea: {
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: activeTheme.colors.text.primary,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    swipeOptions: {
      flexDirection: 'row',
      gap: 12,
    },
    swipeOption: {
      flex: 1,
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    swipeOptionActive: {
      backgroundColor: activeTheme.colors.accent,
      borderColor: activeTheme.colors.accent,
    },
    swipeOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: activeTheme.colors.text.primary,
    },
    swipeOptionTextActive: {
      color: activeTheme.colors.background,
    },
    imageCount: {
      fontSize: 12,
      color: activeTheme.colors.text.muted,
      marginBottom: 8,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: activeTheme.colors.text.primary, textAlign: 'center', marginTop: 40 }}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={{ color: activeTheme.colors.text.primary, textAlign: 'center', marginTop: 40 }}>
          Project not found
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => goBackOrFallback(router, '/(tabs)/studio')}>
            <ArrowLeft size={24} color={activeTheme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Intro Editor</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={16} color={activeTheme.colors.background} />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Images</Text>
          <Text style={styles.imageCount}>{images.length}/30 images</Text>
          
          <View style={styles.imagesGrid}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageItem}>
                <SafeImage 
                  uri={image} 
                  style={styles.imagePreview}
                  resizeMode="cover"
                  fallback={<View style={[styles.imagePreview, { backgroundColor: '#333' }]} />}
                />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <X size={12} color={activeTheme.colors.background} />
                </TouchableOpacity>
              </View>
            ))}
            
            {images.length < 30 && (
              <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
                <Plus size={20} color={activeTheme.colors.text.muted} />
                <Text style={styles.addImageText}>Add{'\n'}Image</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Long Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Long Summary</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Write a detailed summary of your story..."
            placeholderTextColor={activeTheme.colors.text.muted}
            value={longDesc}
            onChangeText={setLongDesc}
            multiline
          />
        </View>

        {/* Swipe Direction Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Swipe Direction</Text>
          <View style={styles.swipeOptions}>
            <TouchableOpacity 
              style={[
                styles.swipeOption,
                swipeDirection === 'right' && styles.swipeOptionActive
              ]}
              onPress={() => setSwipeDirection('right')}
            >
              <ArrowRight 
                size={16} 
                color={swipeDirection === 'right' ? activeTheme.colors.background : activeTheme.colors.text.primary} 
              />
              <Text style={[
                styles.swipeOptionText,
                swipeDirection === 'right' && styles.swipeOptionTextActive
              ]}>
                Right
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.swipeOption,
                swipeDirection === 'down' && styles.swipeOptionActive
              ]}
              onPress={() => setSwipeDirection('down')}
            >
              <ArrowDown 
                size={16} 
                color={swipeDirection === 'down' ? activeTheme.colors.background : activeTheme.colors.text.primary} 
              />
              <Text style={[
                styles.swipeOptionText,
                swipeDirection === 'down' && styles.swipeOptionTextActive
              ]}>
                Down
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </View>
    </>
  );
}