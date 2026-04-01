// /home/user/Chaptrr-440/components/reader/SceneRenderer.tsx
import React, { useRef, useCallback, MutableRefObject } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Scene, Character, Block } from '@/types';
import { BubbleRenderer } from '@/components/bubbles/BubbleRenderer';
import { BeatEffectsOverlay } from './BeatEffects';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TRIGGER_LINE = SCREEN_HEIGHT * 0.4;

interface SceneRendererProps {
  scene: Scene;
  characters: Character[];
  sceneIndex: number;
  totalScenes: number;
  scrollY: MutableRefObject<number>;
  onBlockLayout: (blockId: string, absoluteY: number) => void;
  globalSpacing?: number;
}

// ---- Location Header (procedurally generated gradient header using scene data) ----

function LocationHeader({ scene, sceneIndex }: { scene: Scene; sceneIndex: number }) {
  const header = scene.locationHeader;
  if (!header) return null;

  const height = header.height || 180;

  // Time-of-day gradient colors
  const gradientColors: Record<string, [string, string]> = {
    dawn: ['#ff9a6c', '#1a0a2a'],
    day: ['#4a90d9', '#1a3a5a'],
    dusk: ['#e05c3a', '#2a1a3a'],
    night: ['#0a0a1a', '#1a0a2a'],
  };
  const tod = header.timeOfDay || 'night';
  const [topColor, bottomColor] = gradientColors[tod] || gradientColors.night;

  return (
    <View style={[styles.locationHeader, { height }]}>
      {/* Background gradient layer */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: topColor }]} />
      {/* SVG silhouette placeholder — sky gradient at bottom */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            top: height * 0.5,
            backgroundColor: bottomColor,
            opacity: 0.8,
          },
        ]}
      />
      {/* Location label */}
      {header.name && (
        <View style={styles.locationLabelContainer}>
          <Text style={styles.locationLabel}>{header.name}</Text>
        </View>
      )}
    </View>
  );
}

// ---- Atmosphere Tint ----

function AtmosphereTint({ scene }: { scene: Scene }) {
  const tint = scene.moodTint;
  if (!tint) return null;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          pointerEvents: 'none',
          backgroundColor: tint.color,
          opacity: tint.opacity,
        },
      ]}
    />
  );
}

// ---- Animated Block Wrapper ----

function AnimatedBlock({
  block,
  characters,
  globalSpacing,
  scrollY,
  onLayout,
}: {
  block: Block;
  characters: Character[];
  globalSpacing: number;
  scrollY: MutableRefObject<number>;
  onLayout: (blockId: string, absoluteY: number) => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const hasAnimated = useRef(false);
  const blockTopY = useRef(-9999); // -9999 prevents premature beat/entrance triggers
  // Keep entrance animation type stable across renders
  const entranceAnimRef = useRef(block.entranceAnimation);

  const handleLayout = useCallback(
    (e: any) => {
      const { y } = e.nativeEvent.layout;
      blockTopY.current = y;
      onLayout(block.id, y);
    },
    [block.id, onLayout]
  );

  // Entrance animation polling — stable deps (only refs), so interval is created once
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (hasAnimated.current) return;
      const blockScreenTop = blockTopY.current - scrollY.current;
      const progress = 1 - (blockScreenTop - TRIGGER_LINE) / (SCREEN_HEIGHT - TRIGGER_LINE);
      if (progress > 0.1) {
        hasAnimated.current = true;
        clearInterval(interval);
        const animation = entranceAnimRef.current || 'fade-up';
        if (animation === 'none') {
          fadeAnim.setValue(1);
          slideAnim.setValue(0);
          return;
        }
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
      }
    }, 32);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable: all deps are refs, created once per block

  const spacingPx = 8 + globalSpacing * 20;
  const entranceStyle =
    block.entranceAnimation === 'none'
      ? {}
      : {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        };

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[{ marginVertical: spacingPx }, entranceStyle]}
    >
      {block.beatEffect && (
        <BeatEffectsOverlay beat={block.beatEffect} scrollY={scrollY} blockTopY={blockTopY} />
      )}
      <BubbleRenderer block={block} characters={characters} />
    </Animated.View>
  );
}

// ---- Scene Renderer ----

export function SceneRenderer({
  scene,
  characters,
  sceneIndex,
  totalScenes,
  scrollY,
  onBlockLayout,
  globalSpacing = 0,
}: SceneRendererProps) {
  const visibleBlocks = scene.blocks.filter((b) => b.type !== 'BG');

  return (
    <View style={styles.scene}>
      {/* Location header (first appearance = tall, return = compact) */}
      <LocationHeader scene={scene} sceneIndex={sceneIndex} />

      {/* Atmosphere mood tint overlay */}
      <AtmosphereTint scene={scene} />

      {/* Scene divider for scenes after the first */}
      {sceneIndex > 0 && (
        <View style={styles.sceneDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>Scene {sceneIndex + 1}</Text>
          <View style={styles.dividerLine} />
        </View>
      )}

      {/* Content blocks */}
      <View style={styles.blocksContainer}>
        {visibleBlocks.map((block) => (
          <AnimatedBlock
            key={block.id}
            block={block}
            characters={characters}
            globalSpacing={globalSpacing}
            scrollY={scrollY}
            onLayout={onBlockLayout}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    position: 'relative',
    overflow: 'visible',
  },
  blocksContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  locationHeader: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  locationLabelContainer: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  locationLabel: {
    color: '#e4e4e8',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.08,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  sceneDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 24,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    letterSpacing: 0.06,
    textTransform: 'uppercase',
  },
});
