/**
 * MemoryMap.jsx — Institutional Memory Map
 *
 * Redesigned to match the reference "company-brain" style:
 *   • Irregular dept angles (not evenly 60° apart)
 *   • Per-child angle jitter so spokes look organic, not symmetric fans
 *   • Dept hubs: filled circle + 2 concentric ring halos
 *   • Chair/Faculty: hollow ring circles with a tiny center dot
 *   • Course/Committee: small hollow circles
 *   • Central core: 250 soft particles in 3 density rings (additive blend)
 *   • White/light lines (constellation style, not colour-coded)
 *   • Medium indigo background matching the reference palette
 */

import { useRef, useEffect, useState } from 'react';
import { buildDeanMap } from '../data/deanMap';

// ─── Visual config ──────────────────────────────────────────────────────────
// Node base-radii at reference min-dim 900 px
const NODE_R = {
  root:       0,    // drawn as core, no circle
  department: 13,
  chair:      6.5,
  faculty:    5.5,
  course:     3.5,
  committee:  4.0,
};

// Uppercase hub labels placed outside the ring
const HUB_LABEL = {
  'dept-cse':  'COMPUTER SCIENCE',
  'dept-ai':   'AI & DATA SCIENCE',
  'dept-extc': 'ELECTRONICS',
  'dept-mech': 'MECHANICAL ENG.',
  'dept-exam': 'EXAMINATIONS',
  'dept-res':  'RESEARCH',
};

// Irregular dept angles — NOT evenly 60° apart (degrees → radians below)
// Chosen so the visual weight is organic, matching the reference asymmetry.
const DEPT_ANGLES = [
  -108, // CSE    ≈ 10-11 o'clock
  -22,  // AI     ≈ 1  o'clock
   52,  // EXTC   ≈ 2  o'clock
  115,  // Mech   ≈ 4-5 o'clock
  172,  // Exams  ≈ 6  o'clock
  228,  // Res    ≈ 8  o'clock
].map(d => d * Math.PI / 180);

// Core particle counts per density ring
const CORE_DENSE_COUNT  = 120; // inner 0-18 px
const CORE_MID_COUNT    =  90; // middle 18-45 px
const CORE_OUTER_COUNT  =  50; // outer 45-75 px

const LEGEND = [
  { color: '#6C8CFF', label: 'CS & Engineering'         },
  { color: '#4FD8C4', label: 'AI & Data Science'        },
  { color: '#A78BFA', label: 'Electronics & Telecom'    },
  { color: '#F2B45A', label: 'Mechanical Engineering'   },
  { color: '#F08FC0', label: 'Examinations & Affairs'   },
  { color: '#34C7A8', label: 'Research & Accreditation' },
];

const OMEGA = (Math.PI * 2) / 90; // 1 revolution per 90 s

// ─── Utils ─────────────────────────────────────────────────────────────────
function rgba(hex, a) {
  const v = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

// Deterministic pseudo-random [0,1) — Knuth multiplicative hash
function drand(i, salt = 0) {
  return (((i * 2654435761 + salt * 2246822519) & 0xFFFFFFFF) >>> 0) / 4294967295;
}

// ─── Stable generators ─────────────────────────────────────────────────────
function genCoreParticles() {
  const p = [];

  // ── Dense inner cluster (120 particles, 0–18 px) ───────────────────────
  for (let i = 0; i < CORE_DENSE_COUNT; i++) {
    p.push({
      angle:      drand(i, 1) * Math.PI * 2,
      dist:       Math.sqrt(drand(i, 2)) * 18, // sqrt → uniform disk density
      size:       0.4 + drand(i, 3) * 0.9,
      pulseFreq:  0.6 + drand(i, 4) * 2.4,
      pulsePhase: drand(i, 5) * Math.PI * 2,
      orbitSpd:   (drand(i, 6) > 0.5 ? 1 : -1) * (0.01 + drand(i, 7) * 0.04),
      layer: 0,
    });
  }

  // ── Mid ring (90 particles, 18–45 px) ─────────────────────────────────
  for (let i = 0; i < CORE_MID_COUNT; i++) {
    p.push({
      angle:      drand(i, 8) * Math.PI * 2,
      dist:       18 + drand(i, 9) * 27,
      size:       0.3 + drand(i, 10) * 0.7,
      pulseFreq:  0.3 + drand(i, 11) * 1.6,
      pulsePhase: drand(i, 12) * Math.PI * 2,
      orbitSpd:   (drand(i, 13) > 0.5 ? 1 : -1) * (0.008 + drand(i, 14) * 0.03),
      layer: 1,
    });
  }

  // ── Sparse outer spokes (50 particles, 45–75 px) ──────────────────────
  for (let i = 0; i < CORE_OUTER_COUNT; i++) {
    p.push({
      angle:      drand(i, 15) * Math.PI * 2,
      dist:       45 + drand(i, 16) * 30,
      size:       0.2 + drand(i, 17) * 0.5,
      pulseFreq:  0.2 + drand(i, 18) * 1.0,
      pulsePhase: drand(i, 19) * Math.PI * 2,
      orbitSpd:   (drand(i, 20) > 0.5 ? 1 : -1) * (0.005 + drand(i, 21) * 0.02),
      layer: 2,
    });
  }

  return p;
}

function genNodeMeta(nodes) {
  const m = new Map();
  nodes.forEach((n, i) => {
    m.set(n.id, {
      twinkleFreq:  0.10 + drand(i, 30) * 0.35,
      twinklePhase: drand(i, 31) * Math.PI * 2,
      driftFreq:    0.05 + drand(i, 32) * 0.12,
      driftPhase:   drand(i, 33) * Math.PI * 2,
      driftAmp:     0.6  + drand(i, 34) * 2.0,
    });
  });
  return m;
}

// ─── Animation helpers ──────────────────────────────────────────────────────
function twinkleAlpha(meta, t, type) {
  const s = Math.sin(t * meta.twinkleFreq * Math.PI * 2 + meta.twinklePhase);
  if (type === 'department') return 0.90 + 0.10 * s;
  if (type === 'chair')      return 0.78 + 0.22 * s;
  if (type === 'faculty')    return 0.68 + 0.32 * s;
  return 0.52 + 0.48 * s;
}

function radialDrift(meta, t) {
  return meta.driftAmp * Math.sin(t * meta.driftFreq * Math.PI * 2 + meta.driftPhase);
}

// ─── Organic radial layout ─────────────────────────────────────────────────
/**
 * Uses DEPT_ANGLES (uneven) and deterministic per-child jitter so subtree
 * spokes radiate at irregular angles, matching the reference image.
 */
function computeLayout(data, minDim) {
  const { nodes, links } = data;
  const R1 = minDim * 0.200; // dept hub ring
  const R2 = minDim * 0.340; // chair / faculty ring
  const R3 = minDim * 0.475; // course / committee ring

  const children = new Map();
  for (const { source, target, cross } of links) {
    if (cross) continue;
    const list = children.get(source) ?? [];
    list.push(target);
    children.set(source, list);
  }

  const pos = new Map(
    nodes.map(n => [n.id, { ...n, x: 0, y: 0, angle: 0, labelX: 0, labelY: 0 }])
  );

  const depts = children.get('root') ?? [];

  depts.forEach((deptId, di) => {
    const angle = DEPT_ANGLES[di % DEPT_ANGLES.length];
    const dept  = pos.get(deptId);
    if (!dept) return;

    dept.x      = R1 * Math.cos(angle);
    dept.y      = R1 * Math.sin(angle);
    dept.angle  = angle;
    // Label sits further out along the same radial ray
    const LR    = R1 * 1.40;
    dept.labelX = LR * Math.cos(angle);
    dept.labelY = LR * Math.sin(angle);

    const kids = children.get(deptId) ?? [];
    const NK   = kids.length;
    if (!NK) return;

    // Each dept has a fixed angular sector; children are spread within it
    // with per-child deterministic jitter (the "uneven spokes" effect)
    const sector  = 1.00; // ≈ 57° — constant across depts
    const evenStp = sector / NK;

    kids.forEach((kidId, ki) => {
      // Jitter: ±40 % of the even step, seeded by (dept, child) pair
      const jitter = (drand(di * 200 + ki, 40) - 0.5) * evenStp * 0.8;
      const kAngle = angle - sector / 2 + (ki + 0.5) * evenStp + jitter;
      // Distance variation: 83–117 % of R2
      const kDist  = R2 * (0.83 + drand(di * 200 + ki, 41) * 0.34);

      const kid = pos.get(kidId);
      if (!kid) return;
      kid.x     = kDist * Math.cos(kAngle);
      kid.y     = kDist * Math.sin(kAngle);
      kid.angle = kAngle;

      const gcs = children.get(kidId) ?? [];
      const NG  = gcs.length;
      if (!NG) return;

      const subSector = 0.42; // ≈ 24°
      const subStp    = subSector / NG;

      gcs.forEach((gcId, gi) => {
        const gcJitter = (drand(di * 500 + ki * 50 + gi, 50) - 0.5) * subStp * 0.7;
        const gcAngle  = kAngle - subSector / 2 + (gi + 0.5) * subStp + gcJitter;
        const gcDist   = R3 * (0.86 + drand(ki * 100 + gi, 51) * 0.28);

        const gc = pos.get(gcId);
        if (!gc) return;
        gc.x     = gcDist * Math.cos(gcAngle);
        gc.y     = gcDist * Math.sin(gcAngle);
        gc.angle = gcAngle;
      });
    });
  });

  return { pos, R1, R2, R3 };
}

// ─── Memory core — dense particle starburst ────────────────────────────────
function drawMemoryCore(ctx, particles, t, scale, animated) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // 4-second breathing envelope for the whole cluster
  const breathe = animated ? 0.70 + 0.30 * Math.sin((t / 4) * Math.PI * 2) : 0.85;

  for (const p of particles) {
    const angle = p.angle + (animated ? p.orbitSpd * t : 0);
    const dist  = p.dist * scale;
    const px    = Math.cos(angle) * dist;
    const py    = Math.sin(angle) * dist;

    const pulse  = animated
      ? 0.30 + 0.70 * Math.sin(p.pulseFreq * t * Math.PI * 2 + p.pulsePhase)
      : 0.68;
    const alpha  = breathe * pulse;

    // Inner layer: tiny solid dots (fast, no gradient)
    if (p.layer === 0) {
      const r = (p.size * 0.6 + 0.3) * scale;
      ctx.globalAlpha = Math.min(alpha * 0.9, 1);
      ctx.fillStyle   = pulse > 0.6
        ? `rgba(255,250,230,1)` // warm white for brighter pulses
        : `rgba(200,230,255,1)`; // cool blue for dimmer ones
      ctx.beginPath();
      ctx.arc(px, py, Math.max(r, 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    // Mid + outer: soft radial-gradient glow dot
    else {
      ctx.globalAlpha = 1;
      const dotR  = (p.size * scale + 0.4) * (0.7 + 0.3 * pulse);
      const glowR = dotR * 5;
      const g     = ctx.createRadialGradient(px, py, 0, px, py, glowR);
      const a0    = Math.min(alpha * 0.75, 1).toFixed(3);
      const a1    = (alpha * 0.35).toFixed(3);
      g.addColorStop(0,   `rgba(240,250,255,${a0})`);
      g.addColorStop(0.3, `rgba(180,220,255,${a1})`);
      g.addColorStop(1,   'rgba(80,140,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore(); // restores compositeOperation → 'source-over'
}

// ─── Main per-frame renderer ────────────────────────────────────────────────
function renderGraph(ctx, width, height, data, coreParticles, nodeMetaMap, t, globalAngle, animated) {
  const minDim = Math.min(width, height);
  const scale  = minDim / 900;
  const { pos, R1 } = computeLayout(data, minDim);

  // ── Background: medium indigo (lighter than v1, matching the reference) ──
  const bg = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.hypot(width, height) * 0.62,
  );
  bg.addColorStop(0,    '#262354');
  bg.addColorStop(0.50, '#1a1840');
  bg.addColorStop(1,    '#0e0c24');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // ── Enter graph-space ────────────────────────────────────────────────────
  ctx.save();
  ctx.translate(width / 2, height / 2);
  if (animated) ctx.rotate(globalAngle);

  // ── Links — constellation style: thin white lines ─────────────────────
  for (const { source, target, cross } of data.links) {
    const s   = pos.get(source);
    const tgt = pos.get(target);
    if (!s || !tgt) continue;

    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(tgt.x, tgt.y);

    if (cross) {
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth   = 0.5;
      ctx.setLineDash([2, 6]);
    } else {
      const isRoot = source === 'root';
      ctx.strokeStyle = isRoot
        ? 'rgba(255,255,255,0.32)'
        : 'rgba(255,255,255,0.20)';
      ctx.lineWidth = isRoot ? 1.0 : 0.65;
      ctx.setLineDash([]);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // ── Nodes — sorted so dept hubs paint on top of child nodes ───────────
  // Paint order (ascending): course/committee first, dept hubs last
  const PAINT_Z = { course: 1, committee: 1, faculty: 2, chair: 2, root: 3, department: 4 };
  const sorted   = [...pos.values()].sort(
    (a, b) => (PAINT_Z[a.type] ?? 0) - (PAINT_Z[b.type] ?? 0)
  );

  for (const node of sorted) {
    if (node.type === 'root') continue; // root = core drawn separately

    const meta  = nodeMetaMap.get(node.id);
    const alpha = (animated && meta) ? twinkleAlpha(meta, t, node.type) : 1.0;
    const drift = (animated && meta && node.type !== 'department')
      ? radialDrift(meta, t) : 0;

    const nx    = node.x + drift * Math.cos(node.angle);
    const ny    = node.y + drift * Math.sin(node.angle);
    const baseR = NODE_R[node.type] ?? 3;
    const r     = baseR * Math.max(scale, 0.65);
    const color = node.color ?? '#6C8CFF';

    ctx.globalAlpha = alpha;
    ctx.shadowBlur  = 0;

    // ── Department hub: filled circle + 2 concentric ring halos ─────────
    if (node.type === 'department') {
      // Outer halo rings (drawn first so inner circle paints on top)
      ctx.strokeStyle = rgba(color, 0.18);
      ctx.lineWidth   = 0.7;
      ctx.beginPath();
      ctx.arc(nx, ny, r * 2.6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = rgba(color, 0.32);
      ctx.lineWidth   = 0.9;
      ctx.beginPath();
      ctx.arc(nx, ny, r * 1.75, 0, Math.PI * 2);
      ctx.stroke();

      // Glow halo
      ctx.shadowColor = color;
      ctx.shadowBlur  = 22 * scale;

      // Filled core circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.arc(nx - r * 0.28, ny - r * 0.30, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Chair / Faculty: hollow ring + tiny center dot ───────────────────
    else if (node.type === 'chair' || node.type === 'faculty') {
      // Outer ring
      ctx.strokeStyle = 'rgba(255,255,255,0.72)';
      ctx.lineWidth   = 0.9 * Math.max(scale, 0.7);
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.stroke();

      // Tiny inner dot
      const dotR = 1.3 * Math.max(scale, 0.65);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(nx, ny, dotR, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Course / Committee: small hollow circle ──────────────────────────
    else {
      ctx.strokeStyle = 'rgba(255,255,255,0.50)';
      ctx.lineWidth   = 0.7 * Math.max(scale, 0.65);
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;

  // ── Central memory core (additive starburst at origin) ──────────────────
  drawMemoryCore(ctx, coreParticles, t, scale, animated);

  // ── Dept hub labels — translate to position, counter-rotate for legibility
  const mainFz = Math.max(9,   10.5 * scale);
  const subFz  = Math.max(6.5,  8.0 * scale);

  for (const node of pos.values()) {
    if (node.type !== 'department') continue;

    ctx.save();
    ctx.translate(node.labelX, node.labelY);
    if (animated) ctx.rotate(-globalAngle); // keep text upright while hub orbits
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.font      = `600 ${mainFz}px "Inter","SF Pro Text",system-ui,sans-serif`;
    ctx.fillStyle = '#E8ECF6';
    ctx.fillText(HUB_LABEL[node.id] ?? node.label.toUpperCase(), 0, 0);

    if (node.sublabel) {
      ctx.font      = `${subFz}px "Inter",system-ui,sans-serif`;
      ctx.fillStyle = '#7A80A0';
      ctx.fillText(node.sublabel, 0, mainFz + 4);
    }
    ctx.restore();
  }

  // ── Exit graph-space ─────────────────────────────────────────────────────
  ctx.restore();

  // ── Root label — screen-space (never rotates) ────────────────────────────
  const rootFz  = Math.max(8.5, 9.5 * scale);
  const rootSFz = Math.max(7,   8.0 * scale);

  // Estimate core visual radius to place label below it
  const coreVisR = 26 * scale;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `700 ${rootFz}px "Inter","SF Pro Text",system-ui,sans-serif`;
  ctx.fillStyle    = 'rgba(232,236,246,0.88)';
  ctx.fillText('ASSOCIATE DEAN', 0, coreVisR + 10 * scale);
  ctx.font         = `${rootSFz}px "Inter",system-ui,sans-serif`;
  ctx.fillStyle    = 'rgba(138,144,176,0.75)';
  ctx.fillText('School of Technology', 0, coreVisR + rootFz + 14 * scale);
  ctx.restore();
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function MemoryMap({ onBack }) {
  const canvasRef = useRef(null);
  const dataRef   = useRef(null);
  const coreRef   = useRef(null);
  const metaRef   = useRef(null);
  const rafRef    = useRef(null);
  const animRef   = useRef({ t: 0, globalAngle: 0, lastTs: null });
  const rotateRef = useRef(true);
  const [rotating, setRotating] = useState(true);

  const reduced = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  if (!dataRef.current) dataRef.current = buildDeanMap();
  if (!coreRef.current) coreRef.current = genCoreParticles();
  if (!metaRef.current) metaRef.current = genNodeMeta(dataRef.current.nodes);

  const toggleRotate = () => {
    const next = !rotateRef.current;
    rotateRef.current = next;
    setRotating(next);
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const drawFrame = (animated, t, angle) => {
      const dpr = window.devicePixelRatio || 1;
      const w   = el.offsetWidth;
      const h   = el.offsetHeight;
      if (!w || !h) return;
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (el.width !== bw || el.height !== bh) { el.width = bw; el.height = bh; }
      const ctx = el.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderGraph(ctx, w, h, dataRef.current, coreRef.current, metaRef.current, t, angle, animated);
    };

    if (reduced) {
      drawFrame(false, 0, 0);
      const ro = new ResizeObserver(() => drawFrame(false, 0, 0));
      ro.observe(el);
      return () => ro.disconnect();
    }

    let cancelled = false;
    const frame = (ts) => {
      if (cancelled) return;
      const anim = animRef.current;
      if (anim.lastTs !== null) {
        const dt = Math.min((ts - anim.lastTs) / 1000, 0.1);
        anim.t += dt;
        if (rotateRef.current) anim.globalAngle += OMEGA * dt;
      }
      anim.lastTs = ts;
      drawFrame(true, anim.t, anim.globalAngle);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => { cancelled = true; cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div style={S.page}>

      {/* Top bar */}
      <div style={S.topBar}>
        {onBack && (
          <HoverBtn onClick={onBack} base={S.backBtn}>← Institute Overview</HoverBtn>
        )}

        <span style={S.title}>Institutional Memory Map</span>

        {!reduced && (
          <button onClick={toggleRotate} style={{
            ...S.rotateBtn,
            color:       rotating ? '#A5B4FC' : '#8A90B0',
            borderColor: rotating ? 'rgba(108,140,255,0.45)' : 'rgba(232,236,246,0.14)',
          }}>
            <span style={{
              display:'inline-block', width:6, height:6, borderRadius:'50%',
              background: rotating ? '#6C8CFF' : '#555870',
              boxShadow:  rotating ? '0 0 7px #6C8CFF' : 'none',
              marginRight:7, verticalAlign:'middle',
              transition: 'background 0.3s, box-shadow 0.3s',
            }}/>
            Rotate: {rotating ? 'on' : 'off'}
          </button>
        )}

        <span style={S.subtitle}>Associate Dean · School of Technology · NMIMS</span>
      </div>

      {/* Canvas */}
      <div style={S.canvasWrap}>
        <canvas ref={canvasRef} style={S.canvas} />

        {/* Legend */}
        <div style={S.legend}>
          {LEGEND.map(({ color, label }) => (
            <div key={label} style={S.legendRow}>
              <span style={{ ...S.legendDot, background: color, boxShadow: `0 0 5px ${color}` }}/>
              <span style={S.legendLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* Node type key */}
        <div style={S.typeKey}>
          {[
            { shape: 'filled', label: 'Dept. Hub'  },
            { shape: 'hollow', label: 'Faculty'    },
            { shape: 'tiny',   label: 'Course'     },
          ].map(({ shape, label }) => (
            <div key={label} style={S.legendRow}>
              <NodeKeyIcon shape={shape} />
              <span style={S.legendLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const S = {
  page: {
    position:'fixed', inset:0, zIndex:50,
    background:'#0e0c24',
    display:'flex', flexDirection:'column',
    fontFamily:'"Inter","SF Pro Text",system-ui,sans-serif',
    overflow:'hidden',
  },
  topBar: {
    display:'flex', alignItems:'center', gap:12,
    padding:'9px 20px',
    borderBottom:'1px solid rgba(108,140,255,0.12)',
    background:'rgba(14,12,36,0.85)',
    backdropFilter:'blur(14px)',
    flexShrink:0,
  },
  title:    { color:'#E8ECF6', fontWeight:600, fontSize:14, letterSpacing:'0.04em' },
  subtitle: { marginLeft:'auto', color:'#8A90B0', fontSize:11, letterSpacing:'0.05em' },
  backBtn: {
    background:'none', border:'1px solid rgba(232,236,246,0.16)',
    color:'#8A90B0', padding:'5px 13px', borderRadius:7,
    cursor:'pointer', fontSize:12, letterSpacing:'0.02em',
    transition:'color 0.18s, border-color 0.18s', flexShrink:0,
  },
  rotateBtn: {
    background:'none', border:'1px solid',
    padding:'4px 11px', borderRadius:20,
    cursor:'pointer', fontSize:11, letterSpacing:'0.04em',
    transition:'color 0.22s, border-color 0.22s',
    display:'flex', alignItems:'center', flexShrink:0,
  },
  canvasWrap: { flex:1, position:'relative', minHeight:0, overflow:'hidden' },
  canvas:     { position:'absolute', inset:0, width:'100%', height:'100%', display:'block' },
  legend: {
    position:'absolute', bottom:20, left:20,
    display:'flex', flexDirection:'column', gap:5,
    padding:'9px 13px',
    background:'rgba(14,12,36,0.70)',
    border:'1px solid rgba(232,236,246,0.07)',
    borderRadius:10, backdropFilter:'blur(10px)',
  },
  typeKey: {
    position:'absolute', bottom:20, right:20,
    display:'flex', flexDirection:'column', gap:5,
    padding:'9px 13px',
    background:'rgba(14,12,36,0.70)',
    border:'1px solid rgba(232,236,246,0.07)',
    borderRadius:10, backdropFilter:'blur(10px)',
  },
  legendRow:   { display:'flex', alignItems:'center', gap:8 },
  legendDot:   { width:7, height:7, borderRadius:'50%', flexShrink:0 },
  legendLabel: { color:'#8A90B0', fontSize:10.5 },
};

// ─── Sub-components ─────────────────────────────────────────────────────────
function HoverBtn({ onClick, base, children }) {
  const r = useRef(null);
  return (
    <button ref={r} onClick={onClick} style={base}
      onMouseEnter={() => r.current && (
        (r.current.style.color = '#E8ECF6'),
        (r.current.style.borderColor = 'rgba(232,236,246,0.32)')
      )}
      onMouseLeave={() => r.current && (
        (r.current.style.color = base.color ?? '#8A90B0'),
        (r.current.style.borderColor = base.borderColor ?? 'rgba(232,236,246,0.16)')
      )}
    >{children}</button>
  );
}

function NodeKeyIcon({ shape }) {
  const size = 14;
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
      {shape === 'filled' && (
        <>
          <circle cx="7" cy="7" r="3.5" fill="#A78BFA"/>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="#A78BFA" strokeWidth="0.6" opacity="0.4"/>
        </>
      )}
      {shape === 'hollow' && (
        <>
          <circle cx="7" cy="7" r="4" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
          <circle cx="7" cy="7" r="1" fill="rgba(255,255,255,0.5)"/>
        </>
      )}
      {shape === 'tiny' && (
        <circle cx="7" cy="7" r="2.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
      )}
    </svg>
  );
}
