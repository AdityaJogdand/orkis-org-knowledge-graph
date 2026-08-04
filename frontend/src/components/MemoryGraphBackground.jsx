const nodes = [
  { x: 40, y: 60, r: 4, delay: "0s" },
  { x: 120, y: 30, r: 3, delay: "0.4s" },
  { x: 90, y: 140, r: 5, delay: "0.8s" },
  { x: 200, y: 90, r: 3, delay: "1.2s" },
  { x: 260, y: 170, r: 4, delay: "0.2s" },
  { x: 30, y: 220, r: 3, delay: "1.6s" },
  { x: 180, y: 220, r: 4, delay: "1s" },
];

const edges = [
  [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [2, 5], [4, 6], [2, 6],
];

export default function MemoryGraphBackground({ className = "" }) {
  return (
    <svg
      viewBox="0 0 300 260"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="#D97757"
          strokeOpacity="0.18"
          strokeWidth="1"
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={n.r}
          fill="#D97757"
          className="animate-pulseDot"
          style={{ animationDelay: n.delay, transformOrigin: `${n.x}px ${n.y}px` }}
        />
      ))}
    </svg>
  );
}