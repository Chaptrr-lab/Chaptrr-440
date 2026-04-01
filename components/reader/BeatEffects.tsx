// /home/user/Chaptrr-440/components/reader/BeatEffects.tsx
import React, { useRef, useEffect, useState, MutableRefObject } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Path, G } from 'react-native-svg';
import { BeatEffect } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TRIGGER_LINE = SCREEN_HEIGHT * 0.4;

function computeProgress(blockTopY: number, scrollY: number): number {
  const blockScreenTop = blockTopY - scrollY;
  const p = 1 - (blockScreenTop - TRIGGER_LINE) / (SCREEN_HEIGHT - TRIGGER_LINE);
  return Math.max(0, Math.min(1, p));
}

// Smoothstep easing
function ss(t: number): number {
  return t * t * (3 - 2 * t);
}

// ---- Beat path renderers ----

function BladeSwipe({ progress, color }: { progress: number; color: string }) {
  const w = SCREEN_WIDTH;
  const h = 60;
  const pathLength = w * 1.2;
  const drawn = ss(progress) * pathLength;
  const y = h / 2;
  const x1 = -w * 0.1;
  const x2 = x1 + drawn;

  return (
    <Svg width={w} height={h} style={{ overflow: 'visible' }}>
      <Line
        x1={x1}
        y1={y - 8}
        x2={Math.min(x2, w + 20)}
        y2={y + 8}
        stroke={color}
        strokeWidth={2}
        opacity={0.75}
      />
      <Line
        x1={x1 + 8}
        y1={y}
        x2={Math.min(x2 + 8, w + 28)}
        y2={y}
        stroke={color}
        strokeWidth={1}
        opacity={0.4}
      />
    </Svg>
  );
}

function ImpactBurst({ progress, color }: { progress: number; color: string }) {
  const cx = SCREEN_WIDTH / 2;
  const cy = 50;
  const maxR = 70 * ss(progress);
  const lines = 8;

  return (
    <Svg width={SCREEN_WIDTH} height={100} style={{ overflow: 'visible' }}>
      <G>
        {Array.from({ length: lines }).map((_, i) => {
          const angle = (i / lines) * Math.PI * 2;
          const r1 = maxR * 0.3;
          const r2 = maxR;
          const x1 = cx + Math.cos(angle) * r1;
          const y1 = cy + Math.sin(angle) * r1;
          const x2 = cx + Math.cos(angle) * r2;
          const y2 = cy + Math.sin(angle) * r2;
          return (
            <Line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={1.5}
              opacity={0.65 * ss(progress)}
            />
          );
        })}
        <Circle cx={cx} cy={cy} r={maxR * 0.15} fill={color} opacity={0.4 * ss(progress)} />
      </G>
    </Svg>
  );
}

function Heartbeat({ progress, color }: { progress: number; color: string }) {
  const w = SCREEN_WIDTH;
  const h = 50;
  const mid = h / 2;
  const drawn = ss(progress);
  const endX = w * drawn;

  // EKG path: flat, then spike, then flat
  const spikeStart = w * 0.35;
  const spikeEnd = w * 0.65;
  const spikeTop = mid - 22;
  const spikeBottom = mid + 14;

  let d = `M 0 ${mid}`;
  if (endX <= spikeStart) {
    d += ` L ${endX} ${mid}`;
  } else if (endX <= spikeStart + (spikeEnd - spikeStart) * 0.25) {
    d += ` L ${spikeStart} ${mid} L ${endX} ${spikeBottom}`;
  } else if (endX <= spikeStart + (spikeEnd - spikeStart) * 0.5) {
    const t = (endX - spikeStart) / (spikeEnd - spikeStart);
    const y = spikeBottom + (spikeTop - spikeBottom) * ((t - 0.25) / 0.25);
    d += ` L ${spikeStart} ${mid} L ${spikeStart + (spikeEnd - spikeStart) * 0.25} ${spikeBottom} L ${endX} ${Math.min(spikeTop, y)}`;
  } else {
    d += ` L ${spikeStart} ${mid} L ${spikeStart + (spikeEnd - spikeStart) * 0.25} ${spikeBottom} L ${spikeStart + (spikeEnd - spikeStart) * 0.5} ${spikeTop} L ${Math.min(endX, w)} ${mid}`;
  }

  return (
    <Svg width={w} height={h}>
      <Path d={d} stroke={color} strokeWidth={2} fill="none" opacity={0.8} />
    </Svg>
  );
}

function RainFall({ progress, color }: { progress: number; color: string }) {
  const w = SCREEN_WIDTH;
  const h = 80;
  const drops = 20;
  const alpha = ss(progress) * 0.55;

  const lines = Array.from({ length: drops }).map((_, i) => {
    const x = (i / drops) * w + (i % 3) * 12;
    const y = ((i * 37) % h) * progress;
    const len = 8 + (i % 5) * 3;
    return { x, y, len };
  });

  return (
    <Svg width={w} height={h}>
      {lines.map(({ x, y, len }, i) => (
        <Line
          key={i}
          x1={x}
          y1={y}
          x2={x - 3}
          y2={y + len}
          stroke={color}
          strokeWidth={1}
          opacity={alpha}
        />
      ))}
    </Svg>
  );
}

function Shatter({ progress, color }: { progress: number; color: string }) {
  const cx = SCREEN_WIDTH / 2;
  const cy = 50;
  const p = ss(progress);
  const cracks = 6;

  return (
    <Svg width={SCREEN_WIDTH} height={100} style={{ overflow: 'visible' }}>
      {Array.from({ length: cracks }).map((_, i) => {
        const angle = (i / cracks) * Math.PI * 2 + 0.3;
        const len = (40 + (i % 3) * 20) * p;
        const x2 = cx + Math.cos(angle) * len;
        const y2 = cy + Math.sin(angle) * len;
        const mx = cx + Math.cos(angle + 0.15) * len * 0.5;
        const my = cy + Math.sin(angle + 0.15) * len * 0.5;
        return (
          <Path
            key={i}
            d={`M ${cx} ${cy} Q ${mx} ${my} ${x2} ${y2}`}
            stroke={color}
            strokeWidth={1.5}
            fill="none"
            opacity={0.6 * p}
          />
        );
      })}
      <Circle cx={cx} cy={cy} r={4 * p} fill={color} opacity={0.5 * p} />
    </Svg>
  );
}

// ---- Beat Effects Overlay ----

interface BeatEffectsOverlayProps {
  beat: BeatEffect;
  scrollY: MutableRefObject<number>;
  blockTopY: MutableRefObject<number>;
}

export function BeatEffectsOverlay({ beat, scrollY, blockTopY }: BeatEffectsOverlayProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const p = computeProgress(blockTopY.current, scrollY.current);
      setProgress(p);
    }, 32);
    return () => clearInterval(interval);
  }, [blockTopY, scrollY]);

  // Color: teal default, adjustable by beat type
  const beatColors: Record<string, string> = {
    'blade-swipe': '#e4e4e8',
    'impact-burst': '#ef4444',
    heartbeat: '#ec4899',
    'rain-fall': '#60a5fa',
    shatter: '#f59e0b',
  };
  const color = beatColors[beat.type] || '#aaaaaa';
  const intensityScale = beat.intensity || 0.8;

  if (progress < 0.01) return null;

  const renderBeat = () => {
    switch (beat.type) {
      case 'blade-swipe':
        return <BladeSwipe progress={progress * intensityScale} color={color} />;
      case 'impact-burst':
        return <ImpactBurst progress={progress * intensityScale} color={color} />;
      case 'heartbeat':
        return <Heartbeat progress={progress * intensityScale} color={color} />;
      case 'rain-fall':
        return <RainFall progress={progress * intensityScale} color={color} />;
      case 'shatter':
        return <Shatter progress={progress * intensityScale} color={color} />;
      default:
        return <BladeSwipe progress={progress * intensityScale} color={color} />;
    }
  };

  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        beat.duration === 'linger' ? { marginBottom: 48 } : { marginBottom: 24 },
      ]}
    >
      {renderBeat()}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    marginTop: 12,
    width: '100%',
    overflow: 'visible',
  },
});
