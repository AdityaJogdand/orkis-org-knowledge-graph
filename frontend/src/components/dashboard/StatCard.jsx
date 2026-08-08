import { COLORS, cardStyle } from "../../utils/theme";
import DonutStat from "./DonutStat";

export default function StatCard({
  label,
  value,
  percent,
  caption,
  accent = false,
  compact = false,
  dark = false,
}) {
  const valueColor = accent
    ? COLORS.accent
    : dark
    ? "#FFFFFF"
    : COLORS.ink;

  /* =======================================================
     COMPACT HEADER CARD
  ======================================================= */

  if (compact) {
    return (
      <div
        className={`
          min-w-[70px]
          px-2.5
          py-2
          rounded-lg
          border
          ${
            dark
              ? "bg-white/[0.045] border-white/[0.08]"
              : "bg-white border-stone-200"
          }
        `}
      >
        <p
          className={`
            font-sans
            text-[7px]
            uppercase
            tracking-[0.13em]
            font-semibold
            ${
              dark
                ? "text-white/30"
                : "text-stone-400"
            }
          `}
        >
          {label}
        </p>

        <p
          className="font-heading font-semibold text-[16px] leading-none mt-1"
          style={{
            color: valueColor,
          }}
        >
          {value}
        </p>
      </div>
    );
  }

  /* =======================================================
     STANDARD STAT CARD
  ======================================================= */

  return (
    <div
      className="rounded-2xl p-5"
      style={cardStyle}
    >
      <p className="font-sans text-[10px] font-semibold tracking-[0.16em] uppercase text-stone-400 mb-4">
        {label}
      </p>

      {percent !== undefined ? (
        <div className="flex items-center gap-4">
          <DonutStat
            value={percent}
            color={
              accent
                ? COLORS.accent
                : COLORS.teal
            }
            size={48}
          />

          <p
            className="font-heading font-bold text-[1.9rem] leading-none tracking-tight"
            style={{
              color: valueColor,
            }}
          >
            {value}
          </p>
        </div>
      ) : (
        <p
          className="font-heading font-bold text-[2.4rem] leading-none tracking-tight"
          style={{
            color: valueColor,
          }}
        >
          {value}
        </p>
      )}

      {caption && (
        <p className="font-sans text-[11px] text-stone-400 mt-3 leading-relaxed">
          {caption}
        </p>
      )}
    </div>
  );
}