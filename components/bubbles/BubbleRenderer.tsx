import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ScrollView } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, G, Text as SvgText } from 'react-native-svg';
import ShoutBubble from './ShoutBubble';
import AnimatedShoutBubble from './AnimatedShoutBubble';
import LoudBubble from './LoudBubble';
import MachineBubble from './MachineBubble';
import BloomBubble from './BloomBubble';
import SafeImage from '@/ui/SafeImage';
import { Block, Character } from '@/types';

// ---- Emotion Accessory overlays ----

type EmotionType = NonNullable<NonNullable<Block['textStyle']>['emotionAccessory']>;

const EMOTION_SIZE = 36;

function EmotionAccessory({ emotion, color }: { emotion: EmotionType; color: string }) {
  const s = EMOTION_SIZE;
  const c = s / 2;

  switch (emotion) {
    case 'nervous': {
      // Small sweat drops
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            {[0, 1, 2].map((i) => (
              <Path
                key={i}
                d={`M ${8 + i * 10} ${10} Q ${8 + i * 10 - 4} ${20} ${8 + i * 10} ${24} Q ${8 + i * 10 + 4} ${20} ${8 + i * 10} ${10}`}
                fill="#60a5fa"
                opacity={0.75 - i * 0.15}
              />
            ))}
          </Svg>
        </View>
      );
    }
    case 'embarrass': {
      // Two blush ovals
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            <Ellipse cx={10} cy={22} rx={8} ry={5} fill="#f9a8d4" opacity={0.7} />
            <Ellipse cx={26} cy={22} rx={8} ry={5} fill="#f9a8d4" opacity={0.7} />
          </Svg>
        </View>
      );
    }
    case 'daze': {
      // Spiral / stars
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            {[0, 1, 2].map((i) => {
              const angle = (i / 3) * Math.PI * 2;
              const r = 10;
              const x = c + Math.cos(angle) * r;
              const y = c + Math.sin(angle) * r;
              return (
                <G key={i}>
                  <Circle cx={x} cy={y} r={3} fill="#fbbf24" opacity={0.9} />
                  <Line x1={x - 5} y1={y} x2={x + 5} y2={y} stroke="#fbbf24" strokeWidth={1} opacity={0.5} />
                  <Line x1={x} y1={y - 5} x2={x} y2={y + 5} stroke="#fbbf24" strokeWidth={1} opacity={0.5} />
                </G>
              );
            })}
          </Svg>
        </View>
      );
    }
    case 'fright': {
      // Jagged spike lines radiating outward
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            {[0, 1, 2, 3].map((i) => {
              const angle = (i / 4) * Math.PI * 2 + 0.3;
              const x1 = c + Math.cos(angle) * 6;
              const y1 = c + Math.sin(angle) * 6;
              const x2 = c + Math.cos(angle) * 16;
              const y2 = c + Math.sin(angle) * 16;
              return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} opacity={0.8} />;
            })}
          </Svg>
        </View>
      );
    }
    case 'sad': {
      // Teardrop
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            <Path d={`M ${c} 8 Q ${c - 8} 20 ${c} 28 Q ${c + 8} 20 ${c} 8`} fill="#93c5fd" opacity={0.8} />
          </Svg>
        </View>
      );
    }
    case 'shout': {
      // Radiating impact lines
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2;
              const x2 = c + Math.cos(angle) * 15;
              const y2 = c + Math.sin(angle) * 15;
              return <Line key={i} x1={c} y1={c} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} opacity={0.7} />;
            })}
          </Svg>
        </View>
      );
    }
    case 'whisper': {
      // Three small dots
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            {[8, 18, 28].map((x) => (
              <Circle key={x} cx={x} cy={c} r={3} fill="#d1d5db" opacity={0.6} />
            ))}
          </Svg>
        </View>
      );
    }
    case 'love': {
      // Two small hearts
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            {[10, 24].map((cx, i) => (
              <Path
                key={i}
                d={`M ${cx} ${c + 4} Q ${cx - 7} ${c - 6} ${cx - 7} ${c} Q ${cx - 7} ${c + 8} ${cx} ${c + 10} Q ${cx + 7} ${c + 8} ${cx + 7} ${c} Q ${cx + 7} ${c - 6} ${cx} ${c + 4}`}
                fill="#f472b6"
                opacity={0.85 - i * 0.2}
                transform={`scale(${1 - i * 0.15}) translate(${i * 2}, 0)`}
              />
            ))}
          </Svg>
        </View>
      );
    }
    case 'anger': {
      // Cross/vein mark
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            <Path
              d={`M ${c - 8} ${c} Q ${c - 4} ${c - 8} ${c} ${c} Q ${c + 4} ${c + 8} ${c + 8} ${c}`}
              stroke="#ef4444"
              strokeWidth={2}
              fill="none"
              opacity={0.85}
            />
            <Path
              d={`M ${c} ${c - 8} Q ${c + 8} ${c - 4} ${c} ${c} Q ${c - 8} ${c + 4} ${c} ${c + 8}`}
              stroke="#ef4444"
              strokeWidth={2}
              fill="none"
              opacity={0.85}
            />
          </Svg>
        </View>
      );
    }
    case 'surprise': {
      // Exclamation mark
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            <SvgText x={c} y={s - 6} fontSize={28} fill={color} textAnchor="middle" fontWeight="bold" opacity={0.9}>!</SvgText>
          </Svg>
        </View>
      );
    }
    case 'think': {
      // Ellipsis
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            {[6, 16, 26].map((x) => (
              <Circle key={x} cx={x} cy={c + 4} r={4} fill="#9ca3af" opacity={0.7} />
            ))}
          </Svg>
        </View>
      );
    }
    case 'sarcasm': {
      // Curved air-quote marks
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            <SvgText x={c} y={s - 4} fontSize={22} fill="#a78bfa" textAnchor="middle" opacity={0.85}>"</SvgText>
          </Svg>
        </View>
      );
    }
    case 'cold': {
      // Snowflake-ish asterisk
      return (
        <View style={[emotionStyles.badge, { pointerEvents: 'none' }]}>
          <Svg width={s} height={s}>
            {[0, 1, 2].map((i) => {
              const angle = (i / 3) * Math.PI;
              const x1 = c + Math.cos(angle) * 14;
              const y1 = c + Math.sin(angle) * 14;
              const x2 = c - Math.cos(angle) * 14;
              const y2 = c - Math.sin(angle) * 14;
              return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bae6fd" strokeWidth={2} opacity={0.8} />;
            })}
            <Circle cx={c} cy={c} r={3} fill="#bae6fd" opacity={0.9} />
          </Svg>
        </View>
      );
    }
    default:
      return null;
  }
}

const emotionStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -EMOTION_SIZE / 2,
    right: -EMOTION_SIZE / 2,
    width: EMOTION_SIZE,
    height: EMOTION_SIZE,
    zIndex: 10,
  },
});

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
  const emotionAccessory = textStyle?.emotionAccessory;

  // Find character
  const character = characters.find(c => c.id === characterId);
  const bubbleColor = character?.color || '#6366f1';
  const fillColor = '#f5f5f0';

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
        <View style={{ position: 'relative' }}>
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
          {emotionAccessory && <EmotionAccessory emotion={emotionAccessory} color={bubbleColor} />}
        </View>
      </View>
    );
  }

  if (bubbleType === 'shout') {
    return (
      <View style={wrapStyle}>
        {character && (
          <Text style={[styles.characterName, { color: bubbleColor, marginBottom: 4 }]}>
            {character.name}
          </Text>
        )}
        <View style={{ position: 'relative' }}>
          <AnimatedShoutBubble fillColor={fillColor}>
            {block.content}
          </AnimatedShoutBubble>
          {emotionAccessory && <EmotionAccessory emotion={emotionAccessory} color={bubbleColor} />}
        </View>
      </View>
    );
  }

  if (bubbleType === 'loud') {
    return (
      <View style={wrapStyle}>
        {character && (
          <Text style={[styles.characterName, { color: bubbleColor, marginBottom: 4 }]}>{character.name}</Text>
        )}
        <View style={{ position: 'relative' }}>
          <LoudBubble variant="concave" fillColor={fillColor}>{block.content}</LoudBubble>
          {emotionAccessory && <EmotionAccessory emotion={emotionAccessory} color={bubbleColor} />}
        </View>
      </View>
    );
  }

  if (bubbleType === 'loud-convex') {
    return (
      <View style={wrapStyle}>
        {character && (
          <Text style={[styles.characterName, { color: bubbleColor, marginBottom: 4 }]}>{character.name}</Text>
        )}
        <View style={{ position: 'relative' }}>
          <LoudBubble variant="convex" fillColor={fillColor}>{block.content}</LoudBubble>
          {emotionAccessory && <EmotionAccessory emotion={emotionAccessory} color={bubbleColor} />}
        </View>
      </View>
    );
  }

  if (bubbleType === 'machine') {
    return (
      <View style={wrapStyle}>
        {character && (
          <Text style={[styles.characterName, { color: bubbleColor, marginBottom: 4 }]}>{character.name}</Text>
        )}
        <View style={{ position: 'relative' }}>
          <MachineBubble fillColor={fillColor}>{block.content}</MachineBubble>
          {emotionAccessory && <EmotionAccessory emotion={emotionAccessory} color={bubbleColor} />}
        </View>
      </View>
    );
  }

  if (bubbleType === 'bloom') {
    return (
      <View style={wrapStyle}>
        {character && (
          <Text style={[styles.characterName, { color: bubbleColor, marginBottom: 4 }]}>{character.name}</Text>
        )}
        <View style={{ position: 'relative' }}>
          <BloomBubble fillColor={fillColor}>{block.content}</BloomBubble>
          {emotionAccessory && <EmotionAccessory emotion={emotionAccessory} color={bubbleColor} />}
        </View>
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
      <View style={{ position: 'relative' }}>
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
        {emotionAccessory && <EmotionAccessory emotion={emotionAccessory} color={bubbleColor} />}
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

