/**
 * LoudBubble — concave/convex shaped bubble with animated corner spikes.
 * Port of the HTML LoudBubble.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Polygon, G, Defs, Filter, FeGaussianBlur, FeColorMatrix, FeComposite } from 'react-native-svg';

const FILL = '#f5f5f0';
const PAD_X = 28, PAD_Y = 18;
const MIN_W = 100, MIN_H = 44;
const MAX_W = 320;
const FONT_SZ = 15;
const OV = 56;
const FRAME_MS = 1000 / 18;
const QUANT = 0.8;

const C_FREQ_POOL = [0.31,0.47,0.58,0.71,0.83,0.97,1.13,1.29,1.44,1.67,1.83,2.07,2.31,2.59,2.83,3.11,3.47,3.79,4.13,4.61];

function cMakeOsc() {
  const pool = [...C_FREQ_POOL].sort(() => Math.random() - 0.5);
  return { f1: pool[0], f2: pool[1], f3: pool[2], p1: Math.random()*Math.PI*2, p2: Math.random()*Math.PI*2, p3: Math.random()*Math.PI*2 };
}

function cChaoticVal(t: number, f1: number, f2: number, f3: number, p1: number, p2: number, p3: number) {
  const a = Math.sin(t*f1*Math.PI*2+p1), b = Math.sin(t*f2*Math.PI*2+p2)*0.55, c = Math.sin(t*f3*Math.PI*2+p3)*0.30;
  return Math.pow(Math.max(0, Math.min(1, (a+b+c+1.85)/3.7)), 0.65);
}

function makeConcavePath(W: number, H: number): string {
  const c = Math.min(W, H) * 0.06 + 7;
  const sb = Math.min(W, H) * 0.03;
  const cb = c * 0.6;
  return [
    `M ${c},0`,
    `Q ${W/2},${sb} ${W-c},0`,
    `Q ${W-cb},${cb} ${W},${c}`,
    `Q ${W-sb},${H/2} ${W},${H-c}`,
    `Q ${W-cb},${H-cb} ${W-c},${H}`,
    `Q ${W/2},${H-sb} ${c},${H}`,
    `Q ${cb},${H-cb} 0,${H-c}`,
    `Q ${sb},${H/2} 0,${c}`,
    `Q ${cb},${cb} ${c},0 Z`
  ].join(' ');
}

function makeConvexPath(W: number, H: number): string {
  const c = Math.min(W, H) * 0.06 + 7;
  const cb = c * 0.6;
  const sb = Math.min(W, H) * 0.06;
  return [
    `M ${c},0`,
    `Q ${W/2},${-sb} ${W-c},0`,
    `Q ${W-cb},${cb} ${W},${c}`,
    `Q ${W+sb},${H/2} ${W},${H-c}`,
    `Q ${W-cb},${H-cb} ${W-c},${H}`,
    `Q ${W/2},${H+sb} ${c},${H}`,
    `Q ${cb},${H-cb} 0,${H-c}`,
    `Q ${-sb},${H/2} 0,${c}`,
    `Q ${cb},${cb} ${c},0 Z`
  ].join(' ');
}

interface CSpike {
  bx: number; by: number;
  nx: number; ny: number;
  stX: number; stY: number;
  bw: number; tipMin: number; tipMax: number;
  lastQ: number;
  spasm: { nextAt: number; dur: number; intensity: number };
  f1: number; f2: number; f3: number; p1: number; p2: number; p3: number;
}

function buildCornerSpikes(BW: number, BH: number): CSpike[] {
  const spikes: CSpike[] = [];
  const c = Math.min(BW, BH) * 0.06 + 7;
  const ratio = BW / BH, hIsLong = BW >= BH;
  const shortDim = Math.min(BW, BH), longDim = Math.max(BW, BH);
  const longTipMin = Math.max(28, longDim*0.10), longTipMax = Math.min(54, Math.max(32, longDim*0.18));
  const shortTipMin = Math.max(16, shortDim*0.08), shortTipMax = Math.min(54, Math.max(20, shortDim*0.14));
  const rawHTipMin = hIsLong ? shortTipMin : longTipMin, rawHTipMax = hIsLong ? shortTipMax : longTipMax;
  const rawVTipMin = hIsLong ? longTipMin : shortTipMin, rawVTipMax = hIsLong ? longTipMax : shortTipMax;
  const avgMin = (rawHTipMin+rawVTipMin)/2, avgMax = (rawHTipMax+rawVTipMax)/2;
  const BLEND = 0.6;
  const hTipMin = (rawHTipMin*(1-BLEND)+avgMin*BLEND)*3/4, hTipMax = rawHTipMax*(1-BLEND)+avgMax*BLEND;
  const vTipMin = (rawVTipMin*(1-BLEND)+avgMin*BLEND)*3/4, vTipMax = rawVTipMax*(1-BLEND)+avgMax*BLEND;
  const shortSideLean = Math.min(38, Math.abs(Math.log(ratio))*22) * Math.PI / 180;
  const longSideLean  = Math.min(15, Math.abs(Math.log(ratio))*8)  * Math.PI / 180;
  const cornerBlend = Math.max(0, 1 - Math.abs(Math.log(ratio)) / Math.log(3)) * 0.9;
  const bw = Math.min(28, 8 + Math.max(0, (Math.min(BW,BH)-120)/25));
  const cx = BW/2, cy = BH/2;
  const verts = [
    {px:c,    py:0,    side:'h', sign:-1, ca:Math.atan2(-cy,-cx)},
    {px:BW-c, py:0,    side:'h', sign:-1, ca:Math.atan2(-cy, cx)},
    {px:BW,   py:c,    side:'v', sign: 1, ca:Math.atan2(-cy, cx)},
    {px:BW,   py:BH-c, side:'v', sign: 1, ca:Math.atan2( cy, cx)},
    {px:BW-c, py:BH,   side:'h', sign: 1, ca:Math.atan2( cy, cx)},
    {px:c,    py:BH,   side:'h', sign: 1, ca:Math.atan2( cy,-cx)},
    {px:0,    py:BH-c, side:'v', sign:-1, ca:Math.atan2( cy,-cx)},
    {px:0,    py:c,    side:'v', sign:-1, ca:Math.atan2(-cy,-cx)},
  ];
  for (const {px, py, side, sign, ca} of verts) {
    let nx = side === 'h' ? 0 : sign;
    let ny = side === 'h' ? sign : 0;
    const isShortSide = (hIsLong && side==='h') || (!hIsLong && side==='v');
    const leanAngle = isShortSide ? shortSideLean : longSideLean;
    const cnX = Math.cos(ca), cnY = Math.sin(ca);
    const cross = nx*cnY - ny*cnX;
    const leanDir = cross >= 0 ? 1 : -1;
    const cosL = Math.cos(leanAngle*leanDir), sinL = Math.sin(leanAngle*leanDir);
    const lx = nx*cosL - ny*sinL, ly = nx*sinL + ny*cosL;
    nx = lx; ny = ly;
    const mx = nx*(1-cornerBlend)+cnX*cornerBlend, my = ny*(1-cornerBlend)+cnY*cornerBlend;
    const ml = Math.hypot(mx,my)||1;
    nx = mx/ml; ny = my/ml;
    const tx = -ny, ty = nx;
    const bx = px - nx*14, by = py - ny*14;
    const tipMin = side === 'h' ? hTipMin : vTipMin;
    const tipMax = side === 'h' ? hTipMax : vTipMax;
    spikes.push({ bx, by, nx, ny, stX: tx, stY: ty, bw, tipMin, tipMax, lastQ: -999, spasm: { nextAt: Math.random()*3, dur: 0, intensity: 0 }, ...cMakeOsc() });
  }
  return spikes;
}

interface Props {
  children: string;
  variant?: 'concave' | 'convex';
  fillColor?: string;
  textColor?: string;
}

export default function LoudBubble({ children, variant = 'concave', fillColor = FILL, textColor = '#0a0a0c' }: Props) {
  const [size, setSize] = useState({ w: MIN_W, h: MIN_H });
  const spikesRef = useRef<CSpike[]>([]);
  const [spikePoints, setSpikePoints] = useState<string[]>([]);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRebuildRef = useRef({ w: -1, h: -1 });
  const idRef = useRef(Math.random().toString(36).slice(2));

  const rebuildSpikes = useCallback((w: number, h: number) => {
    if (Math.abs(w - lastRebuildRef.current.w) > 2 || Math.abs(h - lastRebuildRef.current.h) > 2) {
      spikesRef.current = buildCornerSpikes(w, h);
      lastRebuildRef.current = { w, h };
      setSpikePoints(spikesRef.current.map(sp => `${sp.bx.toFixed(1)},${sp.by.toFixed(1)} ${(sp.bx+sp.nx*sp.tipMin).toFixed(1)},${(sp.by+sp.ny*sp.tipMin).toFixed(1)} ${sp.bx.toFixed(1)},${sp.by.toFixed(1)}`));
    }
  }, []);

  useEffect(() => {
    animRef.current = setInterval(() => {
      const tSec = Date.now() / 1000;
      const spikes = spikesRef.current;
      if (!spikes.length) return;
      let changed = false;
      const newPts = spikes.map(sp => {
        let val = cChaoticVal(tSec, sp.f1, sp.f2, sp.f3, sp.p1, sp.p2, sp.p3);
        const sm = sp.spasm;
        if (tSec >= sm.nextAt && sm.dur <= 0) { sm.dur = 0.06 + Math.random()*0.10; sm.intensity = 0.7 + Math.random()*0.3; sm.nextAt = tSec + sm.dur + 1 + Math.random()*6; }
        if (sm.dur > 0) { sm.dur -= 1/18; if (val < sm.intensity) val = sm.intensity; }
        const tipExt = sp.tipMin + val * (sp.tipMax - sp.tipMin);
        const q = Math.round(tipExt / QUANT) * QUANT;
        if (q === sp.lastQ) return null;
        sp.lastQ = q; changed = true;
        const tipX = sp.bx + sp.nx * q, tipY = sp.by + sp.ny * q;
        const bx0 = sp.bx - sp.stX * sp.bw, by0 = sp.by - sp.stY * sp.bw;
        const bx1 = sp.bx + sp.stX * sp.bw, by1 = sp.by + sp.stY * sp.bw;
        return `${bx0.toFixed(1)},${by0.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} ${bx1.toFixed(1)},${by1.toFixed(1)}`;
      });
      if (changed) setSpikePoints(prev => newPts.map((p, i) => p !== null ? p : prev[i]));
    }, FRAME_MS);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, []);

  const handleTextLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    const bw = Math.max(MIN_W, Math.min(MAX_W, Math.ceil(width) + PAD_X * 2));
    const bh = Math.max(MIN_H, Math.ceil(height) + PAD_Y * 2);
    setSize({ w: bw, h: bh });
    rebuildSpikes(bw, bh);
  }, [rebuildSpikes]);

  const uid = idRef.current;
  const svgW = size.w + OV * 2, svgH = size.h + OV * 2;
  const pathD = variant === 'convex' ? makeConvexPath(size.w, size.h) : makeConcavePath(size.w, size.h);

  // Translate spikes so they're in SVG space (spike coords are 0..BW/BH, but SVG offset by OV)
  const translatedSpikes = spikePoints.map(pts => {
    if (!pts) return pts;
    return pts.split(' ').map(pair => {
      const [x, y] = pair.split(',').map(Number);
      return `${(x + OV).toFixed(1)},${(y + OV).toFixed(1)}`;
    }).join(' ');
  });

  return (
    <View style={[styles.container, { width: size.w + OV * 2, height: size.h + OV * 2 }]}>
      {/* Hidden text to measure */}
      <Text onLayout={handleTextLayout} style={[styles.hidden, { color: 'transparent' }]}>{children}</Text>

      <Svg width={svgW} height={svgH} style={styles.svg}>
        <Defs>
          <Filter id={`lgoo${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <FeGaussianBlur in="SourceGraphic" stdDeviation="2.0" result="blur" />
            <FeColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 58 -22" result="goo" />
            <FeComposite in="SourceGraphic" in2="goo" operator="atop" />
          </Filter>
        </Defs>
        <G filter={`url(#lgoo${uid})`} transform={`translate(${OV},${OV})`}>
          <Path d={pathD} fill={fillColor} />
          {translatedSpikes.map((pts, i) => pts ? <Polygon key={i} points={pts.split(' ').map(p => { const [x,y] = p.split(',').map(Number); return `${(x-OV).toFixed(1)},${(y-OV).toFixed(1)}`; }).join(' ')} fill={fillColor} /> : null)}
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
  hidden: { position: 'absolute', top: OV + PAD_Y, left: OV + PAD_X, maxWidth: MAX_W - PAD_X * 2, fontSize: FONT_SZ, fontWeight: '700', lineHeight: 23 },
  textOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: FONT_SZ, fontWeight: '700', lineHeight: 23, textAlign: 'center' },
});
