import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import { COLORS } from "../../utils/theme";

/**
 * Small ring chart for a percentage value. Sits inside StatCard so a
 * number like "76%" is actually visualized, not just typeset large.
 */
export default function DonutStat({ value = 0, color = COLORS.accent, size = 56 }) {
  const data = [{ value: Math.max(0, Math.min(100, value)) }];
  return (
    <div style={{ width: size, height: size }} className="shrink-0 relative">
      <RadialBarChart
        width={size}
        height={size}
        cx="50%"
        cy="50%"
        innerRadius="72%"
        outerRadius="100%"
        barSize={size * 0.16}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={99} fill={color} background={{ fill: COLORS.line }} />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold" style={{ color }}>{value}%</span>
      </div>
    </div>
  );
}