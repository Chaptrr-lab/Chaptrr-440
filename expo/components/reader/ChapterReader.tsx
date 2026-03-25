import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Block, Character } from '@/types';
import { BubbleRenderer } from '@/components/bubbles/BubbleRenderer';

interface ChapterReaderProps {
  blocks: Block[];
  characters: Character[];
  globalSpacing?: number;
  debug?: boolean;
}

interface BgSpan {
  openIndex: number;
  closeIndex: number;
  imageUrl: string;
  fadeTop: boolean;
  fadeBottom: boolean;
}

function computeSpans(blocks: Block[]): BgSpan[] {
  const spans: BgSpan[] = [];
  const openStack: Array<{ index: number; imageUrl: string }> = [];

  blocks.forEach((block, index) => {
    if (block.type === 'BG' && block.bgStyle) {
      const mode = block.bgStyle.mode;
      const imageUrl = block.bgStyle.imageUrl || '';
      
      if (mode === 'OPEN') {
        openStack.push({ index, imageUrl });
      } else if (mode === 'CLOSE') {
        const openData = openStack.pop();
        if (openData !== undefined) {
          const openBlock = blocks[openData.index];
          const fadeTop = openBlock.bgStyle?.fadeEdge ?? true;
          const fadeBottom = block.bgStyle?.fadeEdge ?? true;
          spans.push({ 
            openIndex: openData.index, 
            closeIndex: index, 
            imageUrl: openData.imageUrl, 
            fadeTop, 
            fadeBottom 
          });
        }
      } else if (mode === 'BRIDGE') {
        const openData = openStack.pop();
        if (openData !== undefined) {
          const openBlock = blocks[openData.index];
          const fadeTop = openBlock.bgStyle?.fadeEdge ?? true;
          const fadeBottom = block.bgStyle?.fadeEdge ?? true;
          spans.push({ 
            openIndex: openData.index, 
            closeIndex: index, 
            imageUrl: openData.imageUrl, 
            fadeTop, 
            fadeBottom 
          });
        }
        openStack.push({ index, imageUrl });
      }
    }
  });

  return spans;
}

function hasAnyBG(blocks: Block[]): boolean {
  return blocks.some(b => b.type === 'BG');
}

export function ChapterReader({ blocks, characters, globalSpacing = 0, debug = false }: ChapterReaderProps) {
  const spans = useMemo(() => computeSpans(blocks), [blocks]);

  React.useEffect(() => {
    if (hasAnyBG(blocks) && spans.length === 0) {
      console.warn('[BG] No spans computed — check brackets or renderer.');
    }
  }, [blocks, spans]);

  const sections: Array<{
    startIndex: number;
    endIndex: number;
    hasBg: boolean;
    imageUrl?: string;
    fadeTop?: boolean;
    fadeBottom?: boolean;
  }> = useMemo(() => {
    const result: Array<{
      startIndex: number;
      endIndex: number;
      hasBg: boolean;
      imageUrl?: string;
      fadeTop?: boolean;
      fadeBottom?: boolean;
    }> = [];

    let currentIndex = 0;

    spans.forEach((span) => {
      if (currentIndex < span.openIndex) {
        result.push({
          startIndex: currentIndex,
          endIndex: span.openIndex - 1,
          hasBg: false,
        });
      }

      result.push({
        startIndex: span.openIndex,
        endIndex: span.closeIndex,
        hasBg: true,
        imageUrl: span.imageUrl,
        fadeTop: span.fadeTop,
        fadeBottom: span.fadeBottom,
      });

      currentIndex = span.closeIndex + 1;
    });

    if (currentIndex < blocks.length) {
      result.push({
        startIndex: currentIndex,
        endIndex: blocks.length - 1,
        hasBg: false,
      });
    }

    return result;
  }, [blocks, spans]);

  return (
    <View style={styles.container}>
      {debug && spans.length > 0 && (
        <View style={styles.debugBanner}>
          <Text style={styles.debugText}>BG spans: {spans.length}</Text>
        </View>
      )}
      {sections.map((section, sectionIndex) => {
        const sectionBlocks = blocks.slice(section.startIndex, section.endIndex + 1);

        const prev = blocks[section.startIndex - 1];
        const next = blocks[section.endIndex + 1];
        const sPrev = Number(prev?.spacing) || 1;
        const sNext = Number(next?.spacing) || 1;
        const fadeH = Math.max(40, (sPrev + sNext) * 20);

        return (
          <Section
            key={`section-${sectionIndex}`}
            hasBg={section.hasBg}
            imageUrl={section.imageUrl}
            fadeTop={section.fadeTop ?? false}
            fadeBottom={section.fadeBottom ?? false}
            fadeH={fadeH}
            debug={debug}
          >
            {sectionBlocks.map((block) => {
              if (block.type === 'BG') {
                return null;
              }

              const blockSpacing = Number(block.spacing) || 0;
              const spacingValue = 8 + ((globalSpacing + blockSpacing) * 20);
              return (
                <View key={block.id} style={{ marginVertical: spacingValue }}>
                  <BubbleRenderer block={block} characters={characters} />
                </View>
              );
            })}
          </Section>
        );
      })}
    </View>
  );
}

interface SectionProps {
  hasBg: boolean;
  imageUrl?: string;
  fadeTop: boolean;
  fadeBottom: boolean;
  fadeH: number;
  debug?: boolean;
  children: React.ReactNode;
}

const Section = memo(function Section({ hasBg, imageUrl, fadeTop, fadeBottom, fadeH, debug, children }: SectionProps) {
  const [height, setHeight] = React.useState(0);

  return (
    <View
      style={styles.section}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      {hasBg && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: -1 }]}>
          {imageUrl && imageUrl.trim() ? (
            <ImageBackground
              source={{ uri: imageUrl }}
              resizeMode="repeat"
              style={{ flex: 1, width: '100%' }}
            />
          ) : (
            <View style={styles.placeholderBg}>
              <Text style={styles.placeholderText}>No BG Image</Text>
            </View>
          )}
          {fadeTop && (
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(0,0,0,1)', 'transparent']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: fadeH,
              }}
            />
          )}
          {fadeBottom && (
            <LinearGradient
              pointerEvents="none"
              colors={['transparent', 'rgba(0,0,0,1)']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: fadeH,
              }}
            />
          )}
        </View>
      )}
      <View style={{ zIndex: 0 }}>{children}</View>
      {debug && hasBg && (
        <Text testID="bgDebug" style={styles.debugOverlay}>
          BG span • fadeH={fadeH}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'stretch',
    overflow: 'visible',
  },
  section: {
    position: 'relative',
    overflow: 'visible',
  },
  placeholderBg: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
  },
  debugBanner: {
    backgroundColor: '#f59e0b',
    padding: 8,
    alignItems: 'center',
  },
  debugText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  debugOverlay: {
    position: 'absolute',
    top: 4,
    right: 8,
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
});
