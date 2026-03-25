/**
 * BloomBubble — organic blob-shaped bubble with animated petal spikes.
 * Port of BloomingBubble from the HTML Shout Page.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse, G, Defs, Filter, FeGaussianBlur, FeColorMatrix, FeComposite } from 'react-native-svg';

const FILL = '#f5f5f0';
const PAD_X = 26, PAD_Y = 16;
const MIN_W = 100, MIN_H = 44, MAX_W = 320;
const OV = 52;
const FRAME_MS = 1000 / 18;
const QUANT = 0.7;
const FONT_SZ = 15;

const C_FREQ_POOL = [0.29,0.43,0.57,0.71,0.89,1.03,1.19,1.37,1.53,1.71,1.91,2.13,2.37,2.63,2.89,3.17,3.53,3.91,4.23,4.67];

function cMakeOsc() {
  const pool = [...C_FREQ_POOL].sort(() => Math.random() - 0.5);
  return { f1: pool[0], f2: pool[1], f3: pool[2], p1: Math.random()*Math.PI*2, p2: Math.random()*Math.PI*2, p3: Math.random()*Math.PI*2 };
}
function cChaoticVal(t: number, f1: number, f2: number, f3: number, p1: number, p2: number, p3: number) {
  const a = Math.sin(t*f1*Math.PI*2+p1), b = Math.sin(t*f2*Math.PI*2+p2)*0.55, c = Math.sin(t*f3*Math.PI*2+p3)*0.30;
  return Math.pow(Math.max(0, Math.min(1, (a+b+c+1.85)/3.7)), 0.65);
}

// Organic blob path using sinusoidal radial distortion
function makeBloomPath(W: number, H: number): string {
  const cx = W / 2, cy = H / 2;
  const rx = W / 2 - 2, ry = H / 2 - 2;
  const N = 32;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const angle = (i / N) * Math.PI * 2;
    // Slight petal-like distortion
    const ripple = 1 + 0.04 * Math.cos(angle * 5) + 0.025 * Math.cos(angle * 8);
    const x = cx + rx * ripple * Math.cos(angle);
    const y = cy + ry * ripple * Math.sin(angle);
    d += i === 0 ? `M ${x.toFixed(2)},${y.toFixed(2)}` : ` L ${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return d + ' Z';
}

interface BPetal {
  cx: number; cy: number;   // center of petal base on ellipse perimeter
  nx: number; ny: number;   // outward normal
  rMin: number; rMax: number; // petal radius range
  lastQ: number;
  spasm: { nextAt: number; dur: number; intensity: number };
  f1: number; f2: number; f3: number; p1: number; p2: number; p3: number;
}

function buildPetals(BW: number, BH: number): BPetal[] {
  const petals: BPetal[] = [];
  const cx = BW / 2, cy = BH / 2;
  const rx = BW / 2, ry = BH / 2;
  const N = 10; // number of petals around the perimeter
  const minDim = Math.min(BW, BH);
  const rMin = Math.max(10, minDim * 0.07);
  const rMax = Math.min(44, Math.max(16, minDim * 0.16));

  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2 + (Math.random() * 0.15);
    const nx = Math.cos(angle), ny = Math.sin(angle);
    const pcx = cx + rx * nx;
    const pcy = cy + ry * ny;
    petals.push({
      cx: pcx, cy: pcy,
      nx, ny,
      rMin, rMax,
      lastQ: -999,
      spasm: { nextAt: Math.random() * 3, dur: 0, intensity: 0 },
      ...cMakeOsc(),
    });
  }
  return petals;
}

interface Props { children: string; fillColor?: string; textColor?: string; }

export default function BloomBubble({ children, fillColor = FILL, textColor = '#0a0a0c' }: Props) {
  const [size, setSize] = useState({ w: MIN_W, h: MIN_H });
  const petalsRef = useRef<BPetal[]>([]);
  const [petalData, setPetalData] = useState<{ cx: number; cy: number; r: number }[]>([]);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRebuildRef = useRef({ w: -1, h: -1 });
  const idRef = useRef(Math.random().toString(36).slice(2));

  const rebuildPetals = useCallback((w: number, h: number) => {
    if (Math.abs(w - lastRebuildRef.current.w) > 2 || Math.abs(h - lastRebuildRef.current.h) > 2) {
      petalsRef.current = buildPetals(w, h);
      lastRebuildRef.current = { w, h };
    }
  }, []);

  useEffect(() => {
    animRef.current = setInterval(() => {
      const tSec = Date.now() / 1000;
      const petals = petalsRef.current;
      if (!petals.length) return;
      let changed = false;
      const newData = petals.map(p => {
        let val = cChaoticVal(tSec, p.f1, p.f2, p.f3, p.p1, p.p2, p.p3);
        const sm = p.spasm;
        if (tSec >= sm.nextAt && sm.dur <= 0) { sm.dur = 0.08 + Math.random() * 0.12; sm.intensity = 0.65 + Math.random() * 0.35; sm.nextAt = tSec + sm.dur + 1.5 + Math.random() * 7; }
        if (sm.dur > 0) { sm.dur -= 1 / 18; if (val < sm.intensity) val = sm.intensity; }
        const r = p.rMin + val * (p.rMax - p.rMin);
        const q = Math.round(r / QUANT) * QUANT;
        if (q === p.lastQ) return null;
        p.lastQ = q; changed = true;
        return { cx: p.cx, cy: p.cy, r: q };
      });
      if (changed) setPetalData(prev => newData.map((d, i) => d !== null ? d : prev[i]));
    }, FRAME_MS);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, []);

  const handleTextLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    const bw = Math.max(MIN_W, Math.min(MAX_W, Math.ceil(width) + PAD_X * 2));
    const bh = Math.max(MIN_H, Math.ceil(height) + PAD_Y * 2);
    setSize({ w: bw, h: bh });
    rebuildPetals(bw, bh);
  }, [rebuildPetals]);

  const uid = idRef.current;
  const svgW = size.w + OV * 2, svgH = size.h + OV * 2;

  return (
    <View style={[styles.container, { width: svgW, height: svgH }]}>
      <Text onLayout={handleTextLayout} style={[styles.hidden, { color: 'transparent' }]}>{children}</Text>
      <Svg width={svgW} height={svgH} style={styles.svg}>
        <Defs>
          <Filter id={`bgoo${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <FeGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <FeColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 58 -24" result="goo" />
            <FeComposite in="SourceGraphic" in2="goo" operator="atop" />
          </Filter>
        </Defs>
        <G filter={`url(#bgoo${uid})`} transform={`translate(${OV},${OV})`}>
          <Path d={makeBloomPath(size.w, size.h)} fill={fillColor} />
          {petalData.map((p, i) =>
            p ? <Ellipse key={i} cx={p.cx} cy={p.cy} rx={p.r * 0.55} ry={p.r} fill={fillColor}
              transform={`rotate(${Math.atan2(petalsRef.current[i]?.ny ?? 0, petalsRef.current[i]?.nx ?? 1) * 180 / Math.PI + 90}, ${p.cx}, ${p.cy})`}
            /> : null
          )}
        </G>
      </Svg>
      <View style={[styles.textOverlay, { left: OV + PAD_X, top: OV + PAD_Y, width: size.w - PAD_X * 2, height: size.h - PAD_Y * 2 }]}>
        <Text style={[styles.text, { color: textColor }]}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  svg: { position: 'absolute', top: 0, left: 0 },
  hidden: { position: 'absolute', top: OV + PAD_Y, left: OV + PAD_X, maxWidth: MAX_W - PAD_X * 2, fontSize: FONT_SZ, lineHeight: 22 },
  textOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: FONT_SZ, lineHeight: 22, textAlign: 'center' },
});
