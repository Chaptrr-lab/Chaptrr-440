import React, { ReactNode } from 'react';
import { View, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { useTheme } from '@/theme/ThemeProvider';

interface SafeImageProps {
  uri?: string | null;
  style?: ImageStyle | ViewStyle;
  resizeMode?: ImageContentFit;
  fallback?: ReactNode;
}

export default function SafeImage({ uri, style, resizeMode = 'cover', fallback }: SafeImageProps) {
  const { activeTheme } = useTheme();
  // Guard against empty or invalid URIs
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    if (__DEV__) {
      console.warn('SafeImage: Invalid URI detected:', { uri, type: typeof uri });
    }
    return (
      <>
        {fallback || (
          <View style={[styles.fallback, { backgroundColor: activeTheme.colors.surface }, style]}>
            {/* Empty fallback - just a colored background */}
          </View>
        )}
      </>
    );
  }
  
  const trimmedUri = uri.trim();
  
  // Check if URI is valid (HTTP, file://, content://, or data: URI)
  const isValidUri = trimmedUri.startsWith('http') || 
                     trimmedUri.startsWith('file://') || 
                     trimmedUri.startsWith('content://') || 
                     trimmedUri.startsWith('data:image/');
  
  if (!isValidUri) {
    if (__DEV__) {
      console.warn('SafeImage: Invalid URI format detected:', trimmedUri);
    }
    return (
      <>
        {fallback || (
          <View style={[styles.fallback, { backgroundColor: activeTheme.colors.surface }, style]}>
            {/* Invalid URI fallback */}
          </View>
        )}
      </>
    );
  }

  try {
    return (
      <Image 
        source={trimmedUri}
        style={style}
        contentFit={resizeMode}
        onError={(error) => {
          if (__DEV__) {
            console.warn('SafeImage: Failed to load image:', { uri: trimmedUri, error });
          }
        }}
        onLoad={() => {
          if (__DEV__) {
            console.log('SafeImage: Successfully loaded image:', trimmedUri.substring(0, 50) + '...');
          }
        }}
      />
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('SafeImage: Error rendering image:', error);
    }
    return (
      <>
        {fallback || (
          <View style={[styles.fallback, { backgroundColor: activeTheme.colors.surface }, style]}>
            {/* Error fallback */}
          </View>
        )}
      </>
    );
  }
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});