// /home/user/Chaptrr-440/components/reader/ChapterReader.tsx
import React, { useRef, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Scene, Chapter, Character } from '@/types';
import { SceneRenderer } from './SceneRenderer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TRIGGER_LINE = SCREEN_HEIGHT * 0.4;

interface ChapterReaderProps {
  chapter: Chapter; // uses liveScenes if live, else scenes
  characters: Character[];
  globalSpacing?: number;
}

// scrollProgress(blockTop, scrollY) → 0..1
// Returns 1 when block is at or above triggerLine, 0 when below viewport
export function computeBlockProgress(blockTopRelativeToScroll: number, scrollY: number): number {
  const blockScreenTop = blockTopRelativeToScroll - scrollY;
  const progress = 1 - (blockScreenTop - TRIGGER_LINE) / (SCREEN_HEIGHT - TRIGGER_LINE);
  return Math.max(0, Math.min(1, progress));
}

export function ChapterReader({ chapter, characters, globalSpacing = 0 }: ChapterReaderProps) {
  const scrollY = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const blockLayoutsRef = useRef<Record<string, number>>({}); // blockId → absolute Y

  // Use liveScenes for readers, scenes for preview
  const scenes = useMemo(
    () => (chapter.live && chapter.liveScenes ? chapter.liveScenes : chapter.scenes),
    [chapter]
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = e.nativeEvent.contentOffset.y;
    },
    []
  );

  const handleBlockLayout = useCallback((blockId: string, y: number) => {
    blockLayoutsRef.current[blockId] = y;
  }, []);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {scenes.map((scene, index) => (
        <SceneRenderer
          key={scene.id}
          scene={scene}
          characters={characters}
          sceneIndex={index}
          totalScenes={scenes.length}
          scrollY={scrollY}
          onBlockLayout={handleBlockLayout}
          globalSpacing={globalSpacing}
        />
      ))}
      {/* bottom padding so last content is scrollable to center */}
      <View style={{ height: SCREEN_HEIGHT * 0.5 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingBottom: 24,
  },
});
