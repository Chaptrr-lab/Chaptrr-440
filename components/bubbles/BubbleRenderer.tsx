import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ScrollView } from 'react-native';
import ShoutBubble from './ShoutBubble';
import SafeImage from '@/ui/SafeImage';
import { Block, Character } from '@/types';

interface BubbleRendererProps {
  block: Block;
  characters: Character[];
}

export const BubbleRenderer = memo(function BubbleRenderer({ block, characters }: BubbleRendererProps) {
  if (block.type === 'image') {
    return <ImageRenderer block={block} />;
  }
  
  if (block.type === 'BG') {
    return null; // Background blocks are handled separately in the reader
  }
  
  if (block.type !== 'text') return null;
  
  return <TextRenderer block={block} characters={characters} />;
});

const TextRenderer = memo(function TextRenderer({ block, characters }: { block: Block; characters: Character[] }) {
  const textStyle = block.textStyle;
  const alignment = textStyle?.alignment || 'center';
  const isBold = textStyle?.isBold || false;
  const isItalic = textStyle?.isItalic || false;
  const bubbleType = textStyle?.bubbleType || 'plain';
  const characterId = textStyle?.characterId;
  
  // Find character
  const character = characters.find(c => c.id === characterId);
  const bubbleColor = character?.color || '#6366f1';
  
  // Compute per-item alignment via alignSelf
  const wrapStyle = [
    styles.wrap,
    alignment === 'left' ? { alignSelf: 'flex-start' as const } :
    alignment === 'right' ? { alignSelf: 'flex-end' as const } :
                            { alignSelf: 'center' as const }
  ];
  
  // Determine text alignment within bubble
  const textAlign = alignment === 'center' ? 'center' : 'left';
  
  if (bubbleType === 'plain') {
    return (
      <View style={wrapStyle}>
        <Text style={[
          styles.textContent,
          { 
            textAlign, 
            fontWeight: isBold ? '700' : '400',
            fontStyle: isItalic ? 'italic' : 'normal'
          }
        ]}>
          {block.content}
        </Text>
      </View>
    );
  }
  
  if (bubbleType === 'shout') {
    return (
      <View style={wrapStyle}>
        {character && (
          <Text style={[
            styles.characterName,
            { 
              color: bubbleColor,
              marginBottom: 4,
            }
          ]}>
            {character.name}
          </Text>
        )}
        <ShoutBubble 
          stroke={bubbleColor}
          fill={bubbleColor}
        >
          {block.content}
        </ShoutBubble>
      </View>
    );
  }
  

  
  // Other bubble types (speech, thinking)
  const getBubbleStyle = () => {
    let baseStyle: any = {
      backgroundColor: bubbleType === 'thinking' ? bubbleColor + '20' : bubbleColor,
      borderColor: bubbleColor,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxWidth: '85%',
      marginHorizontal: 8,
    };
    
    if (bubbleType === 'thinking') {
      baseStyle = { ...baseStyle, borderRadius: 25, borderStyle: 'dashed' };
    } else {
      baseStyle = { ...baseStyle, borderRadius: 20 };
    }
    
    // Alignment-based tail effect
    if (alignment === 'left') {
      return { ...baseStyle, borderBottomLeftRadius: 4 };
    } else if (alignment === 'right') {
      return { ...baseStyle, borderBottomRightRadius: 4 };
    }
    return baseStyle;
  };
  
  const getTextStyle = () => {
    let fontSize = 16;
    let fontWeight: '400' | '700' = isBold ? '700' : '400';
    
    if (bubbleType === 'thinking') {
      fontSize = 15;
      fontWeight = '400';
    }
    
    return {
      color: '#fff',
      fontSize,
      fontWeight,
      fontStyle: (isItalic ? 'italic' : 'normal') as 'italic' | 'normal',
      textAlign: textAlign as 'left' | 'center' | 'right',
      lineHeight: fontSize * 1.3,
    };
  };
  
  return (
    <View style={wrapStyle}>
      {character && (
        <Text style={[
          styles.characterName,
          { 
            color: bubbleColor,
            marginBottom: 4,
          }
        ]}>
          {character.name}
        </Text>
      )}
      <View style={getBubbleStyle()}>
        {bubbleType === 'thinking' && (
          <Text style={[getTextStyle(), { fontStyle: 'italic', opacity: 0.9 }]}>
            {block.content}
          </Text>
        )}
        {bubbleType === 'dialogue' && (
          <Text style={getTextStyle()}>
            {block.content}
          </Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    maxWidth: '88%',
    marginVertical: 16,
  },
  textContent: {
    color: '#e5e5e5',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  characterName: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  shoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  imageContainer: {
    marginVertical: 12,
  },
  imageView: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

const ImageRenderer = memo(function ImageRenderer({ block }: { block: Block }) {
  const imageStyle = block.imageStyle;
  const alignment = imageStyle?.alignment || 'center';
  const sizeMode = imageStyle?.sizeMode || 'default';
  const roundedCorners = imageStyle?.roundedCorners || false;
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(
    imageStyle?.meta?.naturalW && imageStyle?.meta?.naturalH 
      ? { width: imageStyle.meta.naturalW, height: imageStyle.meta.naturalH }
      : null
  );
  const [isLoading, setIsLoading] = useState(!naturalDimensions);
  const [loadTimeout, setLoadTimeout] = useState(false);
  
  const screenWidth = Dimensions.get('window').width;
  const padding = 32;
  const containerW = screenWidth - padding;
  
  const borderRadius = roundedCorners ? 12 : 0;
  
  useEffect(() => {
    if (!block.content || naturalDimensions) return;
    
    let cancelled = false;
    setIsLoading(true);
    setLoadTimeout(false);
    
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLoadTimeout(true);
        setIsLoading(false);
      }
    }, 1500);
    
    Image.getSize(
      block.content,
      (width, height) => {
        if (!cancelled) {
          clearTimeout(timeout);
          setNaturalDimensions({ width, height });
          setIsLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          clearTimeout(timeout);
          setLoadTimeout(true);
          setIsLoading(false);
        }
      }
    );
    
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [block.content, naturalDimensions]);
  
  if (!block.content || !block.content.trim()) {
    return (
      <View style={[styles.imageContainer, { alignSelf: 'center' }]}>
        <View style={[{ backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', minHeight: 120, borderRadius }]}>
          <Text style={{ color: '#666', fontSize: 12 }}>No image</Text>
        </View>
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View style={[styles.imageContainer, { alignSelf: 'center' }]}>
        <View style={[{ backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', minHeight: 120, borderRadius }]}>
          <Text style={{ color: '#666', fontSize: 12 }}>Loading...</Text>
        </View>
      </View>
    );
  }
  
  // Use fallback dimensions if we couldn't get natural dimensions
  let renderW: number, renderH: number;
  let needsScrollView = false;
  
  if (!naturalDimensions || loadTimeout) {
    // Fallback: use reasonable default dimensions based on size mode
    switch (sizeMode) {
      case 'original':
        renderW = Math.min(containerW, 300); // Reasonable default width
        renderH = 200; // Reasonable default height
        needsScrollView = false;
        break;
      case 'full':
        renderW = containerW;
        renderH = Math.round(containerW * 0.6); // 16:10 aspect ratio fallback
        break;
      case 'default':
      default:
        renderW = Math.min(containerW, 250);
        renderH = Math.round(renderW * 0.75); // 4:3 aspect ratio fallback
        break;
    }
  } else {
    const { width: nw, height: nh } = naturalDimensions;
    
    // Calculate render dimensions based on size mode
    switch (sizeMode) {
      case 'default':
        // DEFAULT: never upscales, scales down if too large
        if (nw <= containerW) {
          renderW = nw;
        } else {
          renderW = containerW;
        }
        renderH = Math.round(nh * (renderW / nw));
        break;
        
      case 'original':
        // ORIGINAL: 1:1 pixels, scrollable if wider than container
        renderW = nw;
        renderH = nh;
        needsScrollView = renderW > containerW;
        break;
        
      case 'full':
      default:
        // FULL: fills container width, preserves aspect ratio
        renderW = containerW;
        renderH = Math.round(nh * (containerW / nw));
        break;
    }
  }
  
  const alignmentStyle = {
    left: { alignSelf: 'flex-start' as const },
    center: { alignSelf: 'center' as const },
    right: { alignSelf: 'flex-end' as const }
  }[alignment];
  
  const renderImageComponent = () => (
    <View style={[
      { 
        width: renderW, 
        height: renderH, 
        borderRadius, 
        overflow: 'hidden' 
      },
      sizeMode === 'full' ? {} : alignmentStyle
    ]}>
      <SafeImage 
        uri={block.content}
        style={[styles.image, { width: renderW, height: renderH }] as any}
        resizeMode="contain"
        fallback={
          <View style={[
            { 
              backgroundColor: '#333', 
              justifyContent: 'center', 
              alignItems: 'center',
              width: renderW,
              height: renderH,
              borderRadius
            }
          ]}>
            <Text style={{ color: '#666', fontSize: 12 }}>Image Error</Text>
          </View>
        }
      />
    </View>
  );
  
  if (needsScrollView) {
    return (
      <View style={[styles.imageContainer, alignmentStyle]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderImageComponent()}
        </ScrollView>
      </View>
    );
  }
  
  return (
    <View style={[styles.imageContainer, sizeMode === 'full' ? { alignSelf: 'stretch' } : alignmentStyle]}>
      {renderImageComponent()}
    </View>
  );
});

