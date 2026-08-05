import { useEffect, useRef } from "react";

function buildDots(N) {
  return Array.from({ length: N }, (_, i) => {
    const phi = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return {
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.sin(phi) * Math.sin(theta),
      z: Math.cos(phi),
    };
  });
}

function rot3(x, y, z, rx, ry) {
  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
  const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
  return { x: x2, y: y1, z: z2 };
}

const DOTS = buildDots(1300);
const R = 140;

export default function DotSphere() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    rotX: 0.3, rotY: 0,
    velX: 0, velY: 0.003,
    dragging: false, lx: 0, ly: 0,
    raf: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;

    const resize = () => {
      canvas.width = canvas.offsetWidth || 640;
      canvas.height = 430;
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

    const frame = () => {
      s.raf = requestAnimationFrame(frame);
      const W = canvas.width, H = canvas.height;
      const FOV = 420;

      if (!s.dragging) { s.velY += (0.005 - s.velY) * 0.02; s.velX *= 0.96; }
      else { s.velX *= 0.88; s.velY *= 0.88; }
      s.rotX += s.velX;
      s.rotY += s.velY;

      const projected = DOTS.map((d) => {
        const r = rot3(d.x * R, d.y * R, d.z * R, s.rotX, s.rotY);
        const zd = r.z + 320;
        const sc = FOV / zd;
        return { sx: r.x * sc + W / 2, sy: r.y * sc + H / 2, z: r.z, sc };
      });

      projected.sort((a, b) => a.z - b.z);
      ctx.clearRect(0, 0, W, H);

      for (const p of projected) {
        const br = Math.max(0, Math.min(1, (p.z + 160) / 320));
        const rad = Math.max(0.4, p.sc * 2.2);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, rad, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${16 + br * 20},90%,${40 + br * 30}%,${0.38 + br * 0.62})`;
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
    <div style={{ userSelect: "none" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: 430, cursor: "grab" }}
      />
    </div>
  );
}
