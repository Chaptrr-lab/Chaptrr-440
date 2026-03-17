/**
 * MachineBubble — sharp octagonal bubble with monospace font and rectangular spikes.
 * Port of MachineVoiceBubble from the HTML Shout Page.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Polygon, G, Defs, Filter, FeGaussianBlur, FeColorMatrix, FeComposite } from 'react-native-svg';

const FILL = '#f5f5f0';
const PAD_X = 24, PAD_Y = 14;
const MIN_W = 100, MIN_H = 44, MAX_W = 320;
const OV = 50;
const FRAME_MS = 1000 / 18;
const QUANT = 0.8;
const FONT_SZ = 14;

const C_FREQ_POOL = [0.31,0.47,0.58,0.71,0.83,0.97,1.13,1.29,1.44,1.67,1.83,2.07,2.31,2.59,2.83,3.11,3.47,3.79,4.13,4.61];

function cMakeOsc() {
  const pool = [...C_FREQ_POOL].sort(() => Math.random() - 0.5);
  return { f1: pool[0], f2: pool[1], f3: pool[2], p1: Math.random()*Math.PI*2, p2: Math.random()*Math.PI*2, p3: Math.random()*Math.PI*2 };
}
function cChaoticVal(t: number, f1: number, f2: number, f3: number, p1: number, p2: number, p3: number) {
  const a = Math.sin(t*f1*Math.PI*2+p1), b = Math.sin(t*f2*Math.PI*2+p2)*0.55, c = Math.sin(t*f3*Math.PI*2+p3)*0.30;
  return Math.pow(Math.max(0, Math.min(1, (a+b+c+1.85)/3.7)), 0.65);
}

// Sharp octagon path
function makeOctPath(W: number, H: number): string {
  const c = Math.min(W, H) * 0.06 + 7;
  return [`M ${c},0`,`L ${W-c},0`,`L ${W},${c}`,`L ${W},${H-c}`,`L ${W-c},${H}`,`L ${c},${H}`,`L 0,${H-c}`,`L 0,${c}`,`Z`].join(' ');
}

interface MSpike {
  bx: number; by: number; nx: number; ny: number; stX: number; stY: number;
  bw: number; tipMin: number; tipMax: number; lastQ: number;
  spasm: { nextAt: number; dur: number; intensity: number };
  f1: number; f2: number; f3: number; p1: number; p2: number; p3: number;
}

function buildMachineSpikes(BW: number, BH: number): MSpike[] {
  const spikes: MSpike[] = [];
  const c = Math.min(BW, BH) * 0.06 + 7;
  const hIsLong = BW >= BH;
  const shortDim = Math.min(BW, BH), longDim = Math.max(BW, BH);
  const longTipMin = Math.max(21, longDim*0.067), longTipMax = Math.min(54, Math.max(22, longDim*0.12));
  const shortTipMin = Math.max(14, shortDim*0.053), shortTipMax = Math.min(54, Math.max(15, shortDim*0.093));
  const rawHTipMin = hIsLong ? shortTipMin : longTipMin, rawHTipMax = hIsLong ? shortTipMax : longTipMax;
  const rawVTipMin = hIsLong ? longTipMin : shortTipMin, rawVTipMax = hIsLong ? longTipMax : shortTipMax;
  const avgMin = (rawHTipMin+rawVTipMin)/2, avgMax = (rawHTipMax+rawVTipMax)/2;
  const BLEND = 0.6;
  const hTipMin = rawHTipMin*(1-BLEND)+avgMin*BLEND, hTipMax = rawHTipMax*(1-BLEND)+avgMax*BLEND;
  const vTipMin = rawVTipMin*(1-BLEND)+avgMin*BLEND, vTipMax = rawVTipMax*(1-BLEND)+avgMax*BLEND;
  const verts = [
    {px:c,    py:0,    nx:0,  ny:-1, tx:1, ty:0,  side:'h'},
    {px:BW-c, py:0,    nx:0,  ny:-1, tx:1, ty:0,  side:'h'},
    {px:BW,   py:c,    nx:1,  ny:0,  tx:0, ty:1,  side:'v'},
    {px:BW,   py:BH-c, nx:1,  ny:0,  tx:0, ty:1,  side:'v'},
    {px:BW-c, py:BH,   nx:0,  ny:1,  tx:-1,ty:0,  side:'h'},
    {px:c,    py:BH,   nx:0,  ny:1,  tx:-1,ty:0,  side:'h'},
    {px:0,    py:BH-c, nx:-1, ny:0,  tx:0, ty:-1, side:'v'},
    {px:0,    py:c,    nx:-1, ny:0,  tx:0, ty:-1, side:'v'},
  ];
  for (const {px, py, nx, ny, tx, ty, side} of verts) {
    const bx = px - nx*14, by = py - ny*14;
    const tipMin = side === 'h' ? hTipMin : vTipMin;
    const tipMax = side === 'h' ? hTipMax : vTipMax;
    spikes.push({ bx, by, nx, ny, stX: tx, stY: ty, bw: 2, tipMin, tipMax, lastQ: -999, spasm: { nextAt: Math.random()*3, dur: 0, intensity: 0 }, ...cMakeOsc() });
  }
  return spikes;
}

interface Props { children: string; fillColor?: string; textColor?: string; }

export default function MachineBubble({ children, fillColor = FILL, textColor = '#0a0a0c' }: Props) {
  const [size, setSize] = useState({ w: MIN_W, h: MIN_H });
  const spikesRef = useRef<MSpike[]>([]);
  const [spikePoints, setSpikePoints] = useState<string[]>([]);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRebuildRef = useRef({ w: -1, h: -1 });
  const idRef = useRef(Math.random().toString(36).slice(2));

  const rebuildSpikes = useCallback((w: number, h: number) => {
    if (Math.abs(w - lastRebuildRef.current.w) > 2 || Math.abs(h - lastRebuildRef.current.h) > 2) {
      spikesRef.current = buildMachineSpikes(w, h);
      lastRebuildRef.current = { w, h };
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
        if (tSec >= sm.nextAt && sm.dur <= 0) { sm.dur = 0.06+Math.random()*0.10; sm.intensity = 0.7+Math.random()*0.3; sm.nextAt = tSec+sm.dur+1+Math.random()*6; }
        if (sm.dur > 0) { sm.dur -= 1/18; if (val < sm.intensity) val = sm.intensity; }
        const tipExt = sp.tipMin + val * (sp.tipMax - sp.tipMin);
        const q = Math.round(tipExt / QUANT) * QUANT;
        if (q === sp.lastQ) return null;
        sp.lastQ = q; changed = true;
        // Rectangular spike (4 points)
        const hw = sp.bw;
        const bx0 = sp.bx - sp.stX*hw, by0 = sp.by - sp.stY*hw;
        const bx1 = sp.bx + sp.stX*hw, by1 = sp.by + sp.stY*hw;
        const tx0 = bx0 + sp.nx*q, ty0 = by0 + sp.ny*q;
        const tx1 = bx1 + sp.nx*q, ty1 = by1 + sp.ny*q;
        return `${bx0.toFixed(1)},${by0.toFixed(1)} ${tx0.toFixed(1)},${ty0.toFixed(1)} ${tx1.toFixed(1)},${ty1.toFixed(1)} ${bx1.toFixed(1)},${by1.toFixed(1)}`;
      });
      if (changed) setSpikePoints(prev => newPts.map((p, i) => p !== null ? p : prev[i]));
    }, FRAME_MS);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, []);

  const handleTextLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    const bw = Math.max(MIN_W, Math.min(MAX_W, Math.ceil(width) + PAD_X * 2));
    const bh = Math.max(MIN_H, Math.ceil(height) + PAD_Y * 2);
    setSize({ w: bw, h: bh });
    rebuildSpikes(bw, bh);
  }, [rebuildSpikes]);

  const uid = idRef.current;
  const svgW = size.w + OV * 2, svgH = size.h + OV * 2;

  return (
    <View style={[styles.container, { width: svgW, height: svgH }]}>
      <Text onLayout={handleTextLayout} style={[styles.hidden, { color: 'transparent' }]}>{children}</Text>
      <Svg width={svgW} height={svgH} style={styles.svg}>
        <Defs>
          <Filter id={`mgoo${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <FeGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur" />
            <FeColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 58 -28" result="goo" />
            <FeComposite in="SourceGraphic" in2="goo" operator="atop" />
          </Filter>
        </Defs>
        <G filter={`url(#mgoo${uid})`} transform={`translate(${OV},${OV})`}>
          <Path d={makeOctPath(size.w, size.h)} fill={fillColor} />
          {spikePoints.map((pts, i) => pts ? <Polygon key={i} points={pts} fill={fillColor} /> : null)}
        </G>
      </Svg>
      <View style={[styles.textOverlay, { left: OV + PAD_X, top: OV + PAD_Y, width: size.w - PAD_X*2, height: size.h - PAD_Y*2 }]}>
        <Text style={[styles.text, { color: textColor }]}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  svg: { position: 'absolute', top: 0, left: 0 },
  hidden: { position: 'absolute', top: OV + PAD_Y, left: OV + PAD_X, maxWidth: MAX_W - PAD_X*2, fontSize: FONT_SZ, fontFamily: 'monospace', lineHeight: 21 },
  textOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: FONT_SZ, fontFamily: 'monospace', lineHeight: 21, textAlign: 'center', letterSpacing: 0.5 },
});
