import React from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Block } from '@/types';

interface BgSpan {
  openIndex: number;
  closeIndex: number;
  imageUrl: string;
  fadeOpen: boolean;
  fadeClose: boolean;
  transition?: 'fade' | 'hard';
}

interface BgSectionProps {
  children: React.ReactNode;
  hasBg: boolean;
  imageUrl?: string;
  fadeTop?: boolean;
  fadeBottom?: boolean;
  fadeHeight?: number;
}

function BgSection({ children, hasBg, imageUrl, fadeTop, fadeBottom, fadeHeight = 80 }: BgSectionProps) {
  return (
    <View style={styles.sectionContainer}>
      {hasBg && imageUrl && (
        <View style={[StyleSheet.absoluteFill, styles.bgContainer]} pointerEvents="none">
          <ImageBackground
            source={{ uri: imageUrl }}
            style={styles.bgImage}
            resizeMode="repeat"
          />
          {fadeTop && (
            <LinearGradient
              pointerEvents="none"
              colors={['transparent', 'rgba(0,0,0,0)']}
              style={[styles.fadeGradient, { top: 0, height: fadeHeight }]}
            />
          )}
          {fadeBottom && (
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(0,0,0,0)', 'transparent']}
              style={[styles.fadeGradient, { bottom: 0, height: fadeHeight }]}
            />
          )}
        </View>
      )}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

export function preprocessBgBlocks(blocks: Block[]): BgSpan[] {
  const spans: BgSpan[] = [];
  const openStack: { index: number; imageUrl: string; transition: 'fade' | 'hard' }[] = [];

  blocks.forEach((block, index) => {
    if (block.type === 'BG' && block.bgStyle) {
      const mode = block.bgStyle.mode || 'OPEN';
      const imageUrl = block.bgStyle.imageUrl || '';
      const transition = block.bgStyle.transition || 'fade';
      
      if (mode === 'OPEN') {
        openStack.push({ 
          index, 
          imageUrl,
          transition
        });
      } else if (mode === 'CLOSE') {
        const openBlock = openStack.pop();
        if (openBlock) {
          spans.push({
            openIndex: openBlock.index,
            closeIndex: index,
            imageUrl: openBlock.imageUrl,
            fadeOpen: openBlock.transition === 'fade',
            fadeClose: transition === 'fade',
            transition: openBlock.transition
          });
        }
      } else if (mode === 'BRIDGE') {
        // BRIDGE acts as both CLOSE and OPEN
        const openBlock = openStack.pop();
        if (openBlock) {
          // Close the previous span
          spans.push({
            openIndex: openBlock.index,
            closeIndex: index,
            imageUrl: openBlock.imageUrl,
            fadeOpen: openBlock.transition === 'fade',
            fadeClose: transition === 'fade',
            transition: openBlock.transition
          });
        }
        // Start a new span
        openStack.push({ 
          index, 
          imageUrl,
          transition
        });
      }
    }
  });

  return spans;
}

interface BgRendererProps {
  blocks: Block[];
  children: (block: Block, index: number) => React.ReactNode;
}

export function BgRenderer({ blocks, children }: BgRendererProps) {
  const spans = preprocessBgBlocks(blocks);
  
  const calculateFadeHeight = (blockIndex: number): number => {
    const prevBlock = blockIndex > 0 ? blocks[blockIndex - 1] : null;
    const nextBlock = blockIndex < blocks.length - 1 ? blocks[blockIndex + 1] : null;
    
    const prevSpacing = prevBlock?.spacing ?? 1;
    const nextSpacing = nextBlock?.spacing ?? 1;
    
    const fadeHeight = (prevSpacing + nextSpacing) * 20;
    return Math.max(fadeHeight, 20); // Minimum fade height of 20px
  };
  
  if (spans.length === 0) {
    return (
      <View style={styles.container}>
        {blocks.map((block, index) => (
          <View key={block.id}>
            {children(block, index)}
          </View>
        ))}
      </View>
    );
  }

  const sections: React.ReactNode[] = [];
  let currentIndex = 0;

  spans.forEach((span, spanIndex) => {
    // Render blocks before this span
    if (currentIndex < span.openIndex) {
      const beforeBlocks = blocks.slice(currentIndex, span.openIndex);
      sections.push(
        <BgSection key={`before-${spanIndex}`} hasBg={false}>
          {beforeBlocks.map((block, index) => (
            <View key={block.id}>
              {children(block, currentIndex + index)}
            </View>
          ))}
        </BgSection>
      );
    }

    // Render the span with background
    const spanBlocks = blocks.slice(span.openIndex, span.closeIndex + 1);
    const nextSpan = spans[spanIndex + 1];
    const isNextSpanImmediate = nextSpan && nextSpan.openIndex === span.closeIndex + 1;
    
    const fadeHeight = calculateFadeHeight(span.closeIndex);
    
    sections.push(
      <BgSection
        key={`span-${spanIndex}`}
        hasBg={true}
        imageUrl={span.imageUrl}
        fadeTop={span.fadeOpen}
        fadeBottom={span.fadeClose && !isNextSpanImmediate}
        fadeHeight={fadeHeight}
      >
        {spanBlocks.map((block, index) => (
          <View key={block.id}>
            {children(block, span.openIndex + index)}
          </View>
        ))}
      </BgSection>
    );

    currentIndex = span.closeIndex + 1;
  });

  // Render remaining blocks after all spans
  if (currentIndex < blocks.length) {
    const remainingBlocks = blocks.slice(currentIndex);
    sections.push(
      <BgSection key="remaining" hasBg={false}>
        {remainingBlocks.map((block, index) => (
          <View key={block.id}>
            {children(block, currentIndex + index)}
          </View>
        ))}
      </BgSection>
    );
  }

  return (
    <View style={styles.container}>
      {sections}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'visible',
  },
  sectionContainer: {
    position: 'relative',
  },
  bgContainer: {
    zIndex: -1,
  },
  bgImage: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    zIndex: 0,
  },
  fadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
  },

});