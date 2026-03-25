/**
 * AnimatedShoutBubble — React Native SVG port of the HTML Shout Page bubble.
 * Renders an animated spiky bubble using react-native-svg with chaotic oscillators.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Rect,
  Polygon,
  G,
  Defs,
  Filter,
  FeGaussianBlur,
  FeColorMatrix,
  FeComposite,
} from 'react-native-svg';

// ── constants ─────────────────────────────────────────────────────────────────
const PAD = 60;
const CR = 14;
const FILL = '#f5f5f0';
const BASELINE_P = 560;
const SCALE_MIN = 0.85;
const SCALE_MAX = 2.2;
const BIG_SPACING = 52;
const QUANT_STEP = 2.0;
const REBUILD_THR = 4;
const BASE_INSET = 18;
const FRAME_MS = 1000 / 18; // 18fps

const FREQ_POOL = [0.31,0.47,0.58,0.71,0.83,0.97,1.13,1.29,1.44,1.67,1.83,2.07,2.31,2.59,2.83,3.11,3.47,3.79,4.13,4.61];

const BIG   = { bw: [22,32], tipMin: 3, tipRange: [34,54], ampRange: [0.8,1.0] };
const SLIM_BIG = { bw: [14,20], tipMin: 3, tipRange: [30,50], ampRange: [0.8,1.0] };
const MEDIUM = { bw: [16,22], tipMin: 2, tipRange: [22,38], ampRange: [0.7,1.0], spacing: 28 };
const THIN  = { bw: [5,8],  tipMin: 2, tipRange: [28,50], ampRange: [0.6,1.0] };

const SHORT_SIDE = 80;

// ── helpers ───────────────────────────────────────────────────────────────────
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const rndS = (a: number, b: number, s: number) => rnd(a * s, b * s);

function makeOsc() {
  const pool = [...FREQ_POOL].sort(() => Math.random() - 0.5);
  return { f1: pool[0], f2: pool[1], f3: pool[2], p1: Math.random() * Math.PI * 2, p2: Math.random() * Math.PI * 2, p3: Math.random() * Math.PI * 2 };
}

function chaoticVal(t: number, f1: number, f2: number, f3: number, p1: number, p2: number, p3: number) {
  const a = Math.sin(t * f1 * Math.PI * 2 + p1);
  const b = Math.sin(t * f2 * Math.PI * 2 + p2) * 0.55;
  const c = Math.sin(t * f3 * Math.PI * 2 + p3) * 0.30;
  return Math.pow(Math.max(0, Math.min(1, (a + b + c + 1.85) / 3.7)), 0.65);
}

// Compute a point on the perimeter of the rounded rect (t = 0..1)
function perimPt(rw: number, rh: number, t: number) {
  const rx = PAD, ry = PAD;
  const cr = CR, sw = rw - 2 * cr, sh = rh - 2 * cr;
  const arcL = (Math.PI / 2) * cr;
  const cx = rx + rw / 2, cy = ry + rh / 2;
  const segs = [
    { len: sw,   type: 'L', x0: rx + cr,      y0: ry,          dx: 1,  dy: 0  },
    { len: arcL, type: 'A', cx: rx + rw - cr,  cy: ry + cr,     r: cr,  a0: -Math.PI/2, a1: 0 },
    { len: sh,   type: 'L', x0: rx + rw,       y0: ry + cr,     dx: 0,  dy: 1  },
    { len: arcL, type: 'A', cx: rx + rw - cr,  cy: ry + rh - cr,r: cr,  a0: 0,          a1: Math.PI/2 },
    { len: sw,   type: 'L', x0: rx + rw - cr,  y0: ry + rh,     dx: -1, dy: 0  },
    { len: arcL, type: 'A', cx: rx + cr,        cy: ry + rh - cr,r: cr,  a0: Math.PI/2,  a1: Math.PI },
    { len: sh,   type: 'L', x0: rx,             y0: ry + rh - cr,dx: 0,  dy: -1 },
    { len: arcL, type: 'A', cx: rx + cr,        cy: ry + cr,     r: cr,  a0: Math.PI,    a1: 3*Math.PI/2 },
  ] as any[];
  const total = segs.reduce((s: number, g: any) => s + g.len, 0);
  let target = t * total, acc = 0;
  for (const sg of segs) {
    if (acc + sg.len >= target - 1e-9) {
      const u = Math.max(0, Math.min(1, (target - acc) / sg.len));
      let px, py, tx, ty;
      if (sg.type === 'L') {
        px = sg.x0 + u * sg.len * sg.dx; py = sg.y0 + u * sg.len * sg.dy;
        tx = sg.dx; ty = sg.dy;
      } else {
        const a = sg.a0 + u * (sg.a1 - sg.a0);
        px = sg.cx + sg.r * Math.cos(a); py = sg.cy + sg.r * Math.sin(a);
        const ex = (px - sg.cx) / sg.r, ey = (py - sg.cy) / sg.r;
        tx = -ey; ty = ex;
      }
      const ndx = px - cx, ndy = py - cy, nl = Math.hypot(ndx, ndy) || 1, tl = Math.hypot(tx, ty) || 1;
      return { px, py, nx: ndx / nl, ny: ndy / nl, tx: tx / tl, ty: ty / tl };
    }
    acc += sg.len;
  }
  return { px: PAD + CR, py: PAD, nx: 0, ny: -1, tx: 1, ty: 0 };
}

interface Spike {
  px: number; py: number;
  nx: number; ny: number;
  tx: number; ty: number;
  bw: number;
  tipMin: number; tipRange: number; amp: number;
  bx0: number; by0: number; bx1: number; by1: number;
  lastQ: number;
  spasm: { nextAt: number; dur: number; intensity: number };
  f1: number; f2: number; f3: number; p1: number; p2: number; p3: number;
}

function buildSpikes(rw: number, rh: number): Spike[] {
  const spikes: Spike[] = [];
  const arcL = (Math.PI / 2) * CR, sw = rw - 2 * CR, sh = rh - 2 * CR;
  const segs = [
    { len: sw, straight: true }, { len: arcL, straight: false },
    { len: sh, straight: true }, { len: arcL, straight: false },
    { len: sw, straight: true }, { len: arcL, straight: false },
    { len: sh, straight: true }, { len: arcL, straight: false },
  ];
  const tp = segs.reduce((a, s) => a + s.len, 0);
  const scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, tp / BASELINE_P));
  let acc = 0;
  for (const s of segs) { (s as any).tStart = acc / tp; (s as any).tEnd = (acc + s.len) / tp; acc += s.len; }

  function spawnSpike(px: number, py: number, nx: number, ny: number, tx: number, ty: number, bw: number, tipMin: number, tipRange: number, amp: number) {
    const inset = BASE_INSET * Math.max(0.8, scale);
    const baseCx = px - nx * inset, baseCy = py - ny * inset;
    const rL = PAD, rR = PAD + rw, rT = PAD, rB = PAD + rh;
    let m = bw;
    if (Math.abs(tx) > 0.01) { const a = (rR - baseCx) / tx, b = (rL - baseCx) / tx; m = Math.min(m, Math.max(a, b), -Math.min(a, b)); }
    if (Math.abs(ty) > 0.01) { const a = (rB - baseCy) / ty, b = (rT - baseCy) / ty; m = Math.min(m, Math.max(a, b), -Math.min(a, b)); }
    const bwClamped = Math.max(2, Math.min(bw, m - 1));
    spikes.push({
      px, py, nx, ny, tx, ty, bw, tipMin, tipRange, amp,
      bx0: baseCx - tx * bwClamped, by0: baseCy - ty * bwClamped,
      bx1: baseCx + tx * bwClamped, by1: baseCy + ty * bwClamped,
      lastQ: -999,
      spasm: { nextAt: Math.random() * 3, dur: 0, intensity: 0 },
      ...makeOsc(),
    });
  }

  // BIG spikes
  const bigTotal = Math.max(4, Math.round(tp / BIG_SPACING));
  const bigTs: number[] = [];
  for (let i = 0; i < bigTotal; i++) { const j = (Math.random() - 0.5) * 0.4 / bigTotal; bigTs.push(((i / bigTotal + j) % 1 + 1) % 1); }
  bigTs.sort((a, b) => a - b);
  for (const t of bigTs) {
    const seg: any = segs.find(s => t >= (s as any).tStart && t < (s as any).tEnd) || segs[0];
    const cls = (seg.straight && seg.len < SHORT_SIDE) ? SLIM_BIG : BIG;
    const { px, py, nx, ny, tx, ty } = perimPt(rw, rh, t);
    const ti = (t - seg.tStart) / (seg.tEnd - seg.tStart);
    const bw = Math.max(2, Math.min(ti * seg.len, (1 - ti) * seg.len, rndS(cls.bw[0], cls.bw[1], scale)));
    spawnSpike(px, py, nx, ny, tx, ty, bw, cls.tipMin, rnd(cls.tipRange[0], cls.tipRange[1]), rnd(cls.ampRange[0], cls.ampRange[1]));
  }

  // MEDIUM spikes per segment
  for (const seg of segs) {
    const count = Math.round(seg.len / (MEDIUM.spacing * Math.max(1, scale * 0.7)));
    if (count < 1) continue;
    for (let i = 0; i < count; i++) {
      const t = (seg as any).tStart + ((i + 0.2 + Math.random() * 0.6) / count) * ((seg as any).tEnd - (seg as any).tStart);
      const { px, py, nx, ny, tx, ty } = perimPt(rw, rh, t);
      spawnSpike(px, py, nx, ny, tx, ty, rndS(MEDIUM.bw[0], MEDIUM.bw[1], scale), MEDIUM.tipMin, rnd(MEDIUM.tipRange[0], MEDIUM.tipRange[1]), rnd(MEDIUM.ampRange[0], MEDIUM.ampRange[1]));
    }
  }

  // THIN satellite spikes
  for (const bt of bigTs) {
    const sign = Math.random() < 0.5 ? 1 : -1;
    const t1 = ((bt + sign * (6 + Math.random() * 10) / tp) % 1 + 1) % 1;
    const p1 = perimPt(rw, rh, t1);
    spawnSpike(p1.px, p1.py, p1.nx, p1.ny, p1.tx, p1.ty, rndS(THIN.bw[0], THIN.bw[1], scale), THIN.tipMin, rnd(THIN.tipRange[0], THIN.tipRange[1]), rnd(THIN.ampRange[0], THIN.ampRange[1]));
    if (Math.random() < 0.20) {
      const t2 = ((bt - sign * (6 + Math.random() * 10) / tp) % 1 + 1) % 1;
      const p2 = perimPt(rw, rh, t2);
      spawnSpike(p2.px, p2.py, p2.nx, p2.ny, p2.tx, p2.ty, rndS(THIN.bw[0], THIN.bw[1], scale), THIN.tipMin, rnd(THIN.tipRange[0], THIN.tipRange[1]), rnd(THIN.ampRange[0], THIN.ampRange[1]));
    }
  }

  return spikes;
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  children: string;
  fillColor?: string;
  textColor?: string;
}

const H_PAD = 36, V_PAD = 14;
const MIN_W = 140, MIN_H = 52, MAX_W = 320;

export default function AnimatedShoutBubble({ children, fillColor = '#f5f5f0', textColor = '#0a0a0c' }: Props) {
  const [size, setSize] = useState({ w: MIN_W, h: MIN_H });
  const spikesRef = useRef<Spike[]>([]);
  const [spikePoints, setSpikePoints] = useState<string[]>([]);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRebuildSize = useRef({ w: -1, h: -1 });
  const idRef = useRef(Math.random().toString(36).slice(2));

  const rebuildSpikes = useCallback((w: number, h: number) => {
    if (Math.abs(w - lastRebuildSize.current.w) > REBUILD_THR || Math.abs(h - lastRebuildSize.current.h) > REBUILD_THR) {
      spikesRef.current = buildSpikes(w, h);
      lastRebuildSize.current = { w, h };
      // Initialize points
      const pts = spikesRef.current.map(sp => `${sp.bx0.toFixed(1)},${sp.by0.toFixed(1)} ${sp.px.toFixed(1)},${sp.py.toFixed(1)} ${sp.bx1.toFixed(1)},${sp.by1.toFixed(1)}`);
      setSpikePoints(pts);
    }
  }, []);

  // Start animation loop
  useEffect(() => {
    animRef.current = setInterval(() => {
      const tSec = Date.now() / 1000;
      const spikes = spikesRef.current;
      if (!spikes.length) return;
      let changed = false;
      const newPts = spikes.map((sp, i) => {
        let val = chaoticVal(tSec, sp.f1, sp.f2, sp.f3, sp.p1, sp.p2, sp.p3);
        const sm = sp.spasm;
        if (tSec >= sm.nextAt && sm.dur <= 0) {
          sm.dur = 0.06 + Math.random() * 0.10; sm.intensity = 0.7 + Math.random() * 0.3;
          sm.nextAt = tSec + sm.dur + 0.8 + Math.random() * 5.0;
        }
        if (sm.dur > 0) { sm.dur -= 1 / 18; if (val < sm.intensity) val = sm.intensity; }
        const tipExt = sp.tipMin + val * sp.tipRange * sp.amp;
        const q = Math.round(tipExt / QUANT_STEP) * QUANT_STEP;
        if (q === sp.lastQ) return null;
        sp.lastQ = q; changed = true;
        const tipX = sp.px + sp.nx * q, tipY = sp.py + sp.ny * q;
        return `${sp.bx0.toFixed(1)},${sp.by0.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} ${sp.bx1.toFixed(1)},${sp.by1.toFixed(1)}`;
      });
      if (changed) {
        setSpikePoints(prev => newPts.map((p, i) => p !== null ? p : prev[i]));
      }
    }, FRAME_MS);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, []);

  const handleLayout = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout;
    // width is the text width; we compute bubble size from it
    const clampedW = Math.min(Math.max(width, MIN_W - H_PAD * 2), MAX_W - H_PAD * 2);
    // This is called after text layout, so we know text height
  }, []);

  const handleTextLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    const bw = Math.max(MIN_W, Math.min(MAX_W, Math.ceil(width) + H_PAD * 2));
    const bh = Math.max(MIN_H, Math.ceil(height) + V_PAD * 2);
    setSize({ w: bw, h: bh });
    rebuildSpikes(bw, bh);
  }, [rebuildSpikes]);

  const svgW = size.w + PAD * 2;
  const svgH = size.h + PAD * 2;
  const uid = idRef.current;

  return (
    <View style={[styles.container, { width: size.w + PAD * 2, height: size.h + PAD * 2 }]}>
      {/* Hidden text to measure size */}
      <Text
        onLayout={handleTextLayout}
        style={[styles.hiddenText, { color: 'transparent' }]}
      >
        {children}
      </Text>

      <Svg
        width={svgW}
        height={svgH}
        style={styles.svg}
      >
        <Defs>
          <Filter id={`goo${uid}`} x="-55%" y="-55%" width="210%" height="210%">
            <FeGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <FeColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 58 -22"
              result="goo"
            />
            <FeComposite in="SourceGraphic" in2="goo" operator="atop" />
          </Filter>
        </Defs>

        <G filter={`url(#goo${uid})`}>
          {/* Main body */}
          <Rect
            x={PAD} y={PAD}
            width={size.w} height={size.h}
            rx={CR} ry={CR}
            fill={fillColor}
          />
          {/* Spikes */}
          {spikePoints.map((pts, i) => (
            <Polygon key={i} points={pts} fill={fillColor} />
          ))}
        </G>
      </Svg>

      {/* Text overlay — positioned inside the bubble */}
      <View style={[styles.textOverlay, { left: PAD + H_PAD, top: PAD + V_PAD, width: size.w - H_PAD * 2, height: size.h - V_PAD * 2 }]}>
        <Text style={[styles.bubbleText, { color: textColor }]}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0, left: 0,
  },
  hiddenText: {
    position: 'absolute',
    top: PAD + V_PAD,
    left: PAD + H_PAD,
    maxWidth: MAX_W - H_PAD * 2,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 23,
    letterSpacing: 0.6,
  },
  textOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleText: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 23,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
});
