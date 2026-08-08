import { COLORS, cardStyle } from "../../utils/theme";

export default function NextClassCard({ next_class }) {
  const status = next_class?.status;

  if (!next_class || status === "no_classes") {
    return (
      <div className="flex-1 rounded-2xl p-5 flex flex-col gap-3" style={cardStyle}>
        <p className="font-heading text-[12px] font-semibold tracking-wide text-stone-500">Current / Next Class</p>
        <p className="font-heading font-bold text-[1.6rem] text-stone-300">Free today</p>
        <p className="text-[11px] text-stone-400 font-sans">No classes scheduled</p>
      </div>
    );
  }

  if (status === "day_ended") {
    return (
      <div
        className="flex-1 rounded-2xl p-5 flex flex-col gap-3"
        style={{ ...cardStyle, background: COLORS.dangerSoft, borderColor: "#FBD5D5" }}
      >
        <p className="font-heading text-[12px] font-semibold tracking-wide text-stone-500">Today's Classes</p>
        <p className="font-heading font-bold text-[1.6rem]" style={{ color: COLORS.danger }}>Day Ended</p>
        <p className="text-[11px] font-sans" style={{ color: "#F87171" }}>All sessions for today are complete</p>
      </div>
    );
  }

  const isOngoing = status === "ongoing";

  return (
    <div
      className="flex-1 rounded-2xl p-5 flex flex-col gap-2"
      style={isOngoing ? { ...cardStyle, background: COLORS.accentSoft, borderColor: "#FCD9B8" } : cardStyle}
    >
      <div className="flex items-center gap-2">
        <p className="font-heading text-[12px] font-semibold tracking-wide text-stone-500">
          {isOngoing ? "Ongoing" : "Next Class"}
        </p>
        {isOngoing && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            LIVE
          </span>
        )}
      </div>

      <p className="font-heading font-bold leading-tight tracking-tight text-[1.6rem]" style={{ color: COLORS.accent }}>
        {next_class.time}
        {isOngoing && next_class.end_time && (
          <span className="text-[1rem] text-stone-400 font-semibold ml-1">– {next_class.end_time}</span>
        )}
      </p>

      <p className="font-heading font-semibold text-[14px] text-stone-800 leading-snug">{next_class.subject}</p>

      <p className="text-[11px] text-stone-400 font-sans">
        {next_class.room} · Div {next_class.division} · {next_class.programme}
        {next_class.batch && ` · ${next_class.batch}`}
      </p>
    </div>
  );
}