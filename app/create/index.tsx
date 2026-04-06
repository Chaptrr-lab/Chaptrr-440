import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createProject } from '@/lib/database';
import { Image as ImageIcon, X } from 'lucide-react-native';
import SafeImage from '@/ui/SafeImage';

const GENRES = [
  'Fantasy',
  'Romance',
  'Thriller',
  'Sci-Fi',
  'Horror',
  'Slice of Life',
  'Mystery',
  'Action',
  'Drama',
  'Comedy',
];

export default function CreateScreen() {
  const { activeTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [shortDescription, setShortDescription] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const canCreate = title.trim().length > 0;

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre);
      }
      if (prev.length >= 3) return prev;
      return [...prev, genre];
    });
  };

  const handlePickCover = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll access to add a cover image.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const result = await createProject({
        title: title.trim(),
        genres: selectedGenres,
        shortDescription: shortDescription.trim() || undefined,
        coverUrl: coverUri || undefined,
      });
      router.replace(`/create/project/${result.id}/chapters` as any);
    } catch (err) {
      console.error('Error creating project:', err);
      Alert.alert('Error', 'Failed to create project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const c = activeTheme.colors;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.heading, { color: c.text.primary }]}>New Story</Text>
        <Text style={[styles.subheading, { color: c.text.muted }]}>
          Fill in the details to get started.
        </Text>

        {/* Cover image */}
        <TouchableOpacity
          style={[styles.coverPicker, { borderColor: c.border }]}
          onPress={handlePickCover}
          activeOpacity={0.7}
        >
          {coverUri ? (
            <>
              <SafeImage
                uri={coverUri}
                style={styles.coverImage}
                resizeMode="cover"
                fallback={<View style={[styles.coverImage, { backgroundColor: c.border }]} />}
              />
              <TouchableOpacity
                style={styles.coverRemove}
                onPress={() => setCoverUri(null)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.coverPlaceholder}>
              <ImageIcon size={32} color={c.text.muted} />
              <Text style={[styles.coverPlaceholderText, { color: c.text.muted }]}>
                Add Cover Image
              </Text>
              <Text style={[styles.coverPlaceholderSub, { color: c.text.muted }]}>
                Optional • 3:4 ratio
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title */}
        <Text style={[styles.label, { color: c.text.secondary }]}>Title *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              color: c.text.primary,
            },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder="Story title"
          placeholderTextColor={c.text.muted}
          maxLength={80}
          returnKeyType="next"
        />

        {/* Genre pills */}
        <Text style={[styles.label, { color: c.text.secondary }]}>
          Genre{' '}
          <Text style={{ color: c.text.muted, fontWeight: '400' }}>(pick up to 3)</Text>
        </Text>
        <View style={styles.genreGrid}>
          {GENRES.map((genre) => {
            const selected = selectedGenres.includes(genre);
            const disabled = !selected && selectedGenres.length >= 3;
            return (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genrePill,
                  {
                    backgroundColor: selected ? c.accent : c.surface,
                    borderColor: selected ? c.accent : c.border,
                    opacity: disabled ? 0.4 : 1,
                  },
                ]}
                onPress={() => toggleGenre(genre)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.genrePillText,
                    { color: selected ? c.background : c.text.secondary },
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Short description */}
        <Text style={[styles.label, { color: c.text.secondary }]}>
          Short Description{' '}
          <Text style={{ color: c.text.muted, fontWeight: '400' }}>(optional)</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.inputMultiline,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              color: c.text.primary,
            },
          ]}
          value={shortDescription}
          onChangeText={setShortDescription}
          placeholder="A brief hook for your story…"
          placeholderTextColor={c.text.muted}
          multiline
          numberOfLines={2}
          maxLength={200}
          textAlignVertical="top"
        />

        {/* Create button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor: canCreate ? c.accent : c.border,
            },
          ]}
          onPress={handleCreate}
          disabled={!canCreate || creating}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator color={c.background} />
          ) : (
            <Text
              style={[
                styles.createButtonText,
                { color: canCreate ? c.background : c.text.muted },
              ]}
            >
              CREATE PROJECT
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    marginBottom: 28,
  },
  coverPicker: {
    alignSelf: 'center',
    width: 160,
    height: 213,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    padding: 4,
  },
  coverPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  coverPlaceholderText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  coverPlaceholderSub: {
    fontSize: 11,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  inputMultiline: {
    minHeight: 72,
    paddingTop: 12,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  genrePillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
