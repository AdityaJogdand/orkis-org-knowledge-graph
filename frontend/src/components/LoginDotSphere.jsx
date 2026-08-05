import { useEffect, useRef } from "react";

// --- Perlin noise ---
const P = new Uint8Array(512);
(() => {
  const p = [...Array(256)].map((_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
})();

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + t * (b - a);
const grad = (h, x, y, z) => {
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
};

function noise(x, y, z) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z;
  const B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
  return lerp(
    lerp(lerp(grad(P[AA], x, y, z), grad(P[BA], x - 1, y, z), u),
         lerp(grad(P[AB], x, y - 1, z), grad(P[BB], x - 1, y - 1, z), u), v),
    lerp(lerp(grad(P[AA + 1], x, y, z - 1), grad(P[BA + 1], x - 1, y, z - 1), u),
         lerp(grad(P[AB + 1], x, y - 1, z - 1), grad(P[BB + 1], x - 1, y - 1, z - 1), u), v),
    w
  );
}

function buildDots(N) {
  return Array.from({ length: N }, (_, i) => {
    const phi = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return {
      nx: Math.sin(phi) * Math.cos(theta),
      ny: Math.sin(phi) * Math.sin(theta),
      nz: Math.cos(phi),
      ox: Math.random() * 100,
      oy: Math.random() * 100,
      oz: Math.random() * 100,
    };
  });
}

function bakeNewTerrain(dots) {
  const seed = Math.random() * 50;
  return dots.map((d) => {
    const freq = 2.2, amp = 100;
    const n1 = noise(d.nx * freq + seed, d.ny * freq, d.nz * freq);
    const n2 = noise(d.nx * freq * 2 + seed + 3, d.ny * freq * 2 + 1, d.nz * freq * 2);
    return 240 + n1 * amp + n2 * amp * 0.35;
  });
}

function rot3(x, y, z, rx, ry) {
  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
  const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
  return { x: x2, y: y1, z: z2 };
}

export default function DotSphere() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    dots: buildDots(1500),
    terrainR: [],
    rotX: 0.3, rotY: 0,
    velX: 0, velY: 0.003,
    dragging: false, lx: 0, ly: 0,
    cycleStart: null,
    lastCyc: -1,
    speed: 2,
    raf: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;
    s.terrainR = bakeNewTerrain(s.dots);

    const resize = () => {
      canvas.width = canvas.offsetWidth || 1000;
      canvas.height = 600;
    };
    resize();
    window.addEventListener("resize", resize);

    const onDown = (cx, cy) => { s.dragging = true; s.lx = cx; s.ly = cy; s.velX = s.velY = 0; };
    const onMove = (cx, cy) => { if (!s.dragging) return; s.velY += (cx - s.lx) * 0.004; s.velX += (cy - s.ly) * 0.004; s.lx = cx; s.ly = cy; };
    const onUp = () => { s.dragging = false; };

    canvas.addEventListener("mousedown", (e) => onDown(e.clientX, e.clientY));
    canvas.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); onDown(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    canvas.addEventListener("touchmove", (e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    window.addEventListener("touchend", onUp);

    const CYCLE = 9000;

    const frame = (ms) => {
      s.raf = requestAnimationFrame(frame);
      if (s.cycleStart === null) s.cycleStart = ms;

      const W = canvas.width, H = canvas.height;
      const FOV = 520;
      const elapsed = (ms - s.cycleStart) * s.speed;
      const rawPhase = elapsed / CYCLE;
      const wholeCycles = Math.floor(rawPhase);
      const cyc = rawPhase - wholeCycles;

      if (s.lastCyc !== wholeCycles) {
        s.lastCyc = wholeCycles;
        s.terrainR = bakeNewTerrain(s.dots);
      }

      const wSphere = Math.pow(Math.cos(cyc * Math.PI), 2);
      const wNoise = Math.pow(Math.sin(cyc * Math.PI * 2), 2) * 0.9;
      const terrainPhase = Math.cos((cyc - 0.5) * Math.PI * 2) * 0.5 + 0.5;
      const wTerrain = Math.pow(terrainPhase, 2.5);
      const total = wSphere + wNoise * 0.6 + wTerrain;
      const nS = wSphere / total;
      const nN = (wNoise * 0.6) / total;
      const nT = wTerrain / total;
      const nt = elapsed * 0.00015;

      if (!s.dragging) { s.velY += (0.0025 - s.velY) * 0.02; s.velX *= 0.96; }
      else { s.velX *= 0.88; s.velY *= 0.88; }
      s.rotX += s.velX; s.rotY += s.velY;

      // Base radius scaled from 140 -> 260
      const projected = s.dots.map((d, i) => {
        const sx = d.nx * 260, sy = d.ny * 260, sz = d.nz * 260;
        const R_ter = s.terrainR[i] || 240;
        const tx = d.nx * R_ter, ty = d.ny * R_ter, tz = d.nz * R_ter;

        const nfreq = 1.6;
        const n1 = noise(d.nx * nfreq + d.ox + nt, d.ny * nfreq + d.oy, d.nz * nfreq + d.oz);
        const n2 = noise(d.nx * nfreq + d.ox + 5, d.ny * nfreq + d.oy + nt * 0.9, d.nz * nfreq + d.oz + 2);
        const n3 = noise(d.nx * nfreq + d.ox + 10, d.ny * nfreq + d.oy + 4, d.nz * nfreq + d.oz + nt * 0.7);
        const R_noise = 240 + n1 * 120;
        const nx_ = d.nx * R_noise + n2 * 80;
        const ny_ = d.ny * R_noise + n3 * 80;
        const nz_ = d.nz * R_noise + n1 * 60;

        const bx = sx * nS + nx_ * nN + tx * nT;
        const by = sy * nS + ny_ * nN + ty * nT;
        const bz = sz * nS + nz_ * nN + tz * nT;

        const r = rot3(bx, by, bz, s.rotX, s.rotY);
        const zd = r.z + 450;
        const sc = FOV / zd;
        return { sx: r.x * sc + W / 2, sy: r.y * sc + H / 2 + 180, z: r.z, sc };
      });

      projected.sort((a, b) => a.z - b.z);
      ctx.clearRect(0, 0, W, H);

      for (const p of projected) {
        const br = Math.max(0, Math.min(1, (p.z + 300) / 600));
        const rad = Math.max(0.6, p.sc * 2.6);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, rad, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${16 + br * 20}, 90%, ${40 + br * 30}%, ${0.35 + br * 0.65})`;
        ctx.fill();
      }
    };

    s.raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(s.raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", userSelect: "none" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: 600, cursor: "grab" }}
      />
    </div>
  );
}