import React from 'react';
import { View, StyleSheet, ViewStyle, ImageStyle, Text } from 'react-native';
import { Image } from 'expo-image';

type SafeImageProps = {
  uri?: string | null;
  style?: ViewStyle | ImageStyle;
  /** For expo-image this is called contentFit */
  resizeMode?: 'cover' | 'contain' | 'center' | 'fill' | 'scale-down' | 'none';
  fallback?: React.ReactNode;
};

export default function SafeImage({
  uri,
  style,
  resizeMode = 'cover',
  fallback,
}: SafeImageProps) {
  // nothing to show → fallback box
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    return (
      <View style={[styles.fallback, style]}>
        {fallback ?? <Text />}
      </View>
    );
  }

  const trimmed = uri.trim();

  // only allow http/https/file/content/data URIs
  const isValid =
    trimmed.startsWith('http') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:') ||
    trimmed.startsWith('data:image/');

  if (!isValid) {
    return <View style={[styles.fallback, style]} />;
  }

  try {
    return (
      <Image
        source={{ uri: trimmed }}
        style={[styles.image, style]}
        // expo-image uses contentFit instead of resizeMode
        contentFit={resizeMode}
      />
    );
  } catch (err) {
    // On any render error, fall back to a blank box
    return <View style={[styles.fallback, style]} />;
  }
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
  },
});
