import { COLORS, cardStyle } from "../../utils/theme";
import DonutStat from "../dashboard/DonutStat";

export default function MidTermHeader({
  programme, selectedSem, filledCount, total, pct,
  windowStart, setWindowStart, windowEnd, setWindowEnd,
  onAutoSchedule, onExport,
}) {
  const windowReady = Boolean(windowStart && windowEnd);

  return (
    <div className="rounded-2xl overflow-hidden" style={cardStyle}>
      <div className="px-6 py-4 flex items-center justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <p className="font-sans text-[10px] font-semibold tracking-widest uppercase mb-0.5" style={{ color: COLORS.accent }}>
            Mid Term Examination Builder · {programme}
          </p>
          <p className="font-heading font-bold text-[1.3rem] text-stone-900">
            {selectedSem ? `Semester ${selectedSem} — ${filledCount}/${total} scheduled` : "Choose a semester to begin"}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-semibold text-stone-400 tracking-widest uppercase">Midterm From</span>
            <div className="px-3 py-1.5 rounded-lg text-[12px]" style={{ background: "#F2EEE4" }}>
              <input
                type="text" value={windowStart} onChange={e => setWindowStart(e.target.value)}
                onFocus={e => { e.target.type = "date"; }} onBlur={e => { if (!e.target.value) e.target.type = "text"; }}
                placeholder="Start date"
                className="bg-transparent text-[12px] text-stone-700 focus:outline-none w-28 placeholder:text-stone-300"
              />
            </div>
          </div>
          <span className="text-stone-300 text-[12px] mt-4">–</span>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-semibold text-stone-400 tracking-widest uppercase">Midterm To</span>
            <div className="px-3 py-1.5 rounded-lg text-[12px]" style={{ background: "#F2EEE4" }}>
              <input
                type="text" value={windowEnd} onChange={e => setWindowEnd(e.target.value)}
                onFocus={e => { e.target.type = "date"; }} onBlur={e => { if (!e.target.value) e.target.type = "text"; }}
                placeholder="End date"
                className="bg-transparent text-[12px] text-stone-700 focus:outline-none w-28 placeholder:text-stone-300"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedSem && total > 0 && (
            <>
              <DonutStat value={pct} size={48} />
              <button
                onClick={onAutoSchedule}
                disabled={!windowReady}
                title={!windowReady ? "Set midterm window first" : "Auto-fill all exam slots within the window"}
                className="px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{
                  background: "#F2EEE4",
                  color: windowReady ? "#374151" : "#C4C0BB",
                  cursor: windowReady ? "pointer" : "not-allowed",
                }}
              >
                Auto-Schedule
              </button>
              <button
                onClick={onExport}
                disabled={filledCount === 0}
                className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white"
                style={{ background: filledCount > 0 ? COLORS.accent : "#D1D5DB", cursor: filledCount > 0 ? "pointer" : "not-allowed" }}
              >
                Export PDF
              </button>
            </>
          )}
        </div>
      </div>
      {selectedSem && (
        <div className="h-0.5 bg-stone-200">
          <div className="h-0.5 transition-all duration-500" style={{ width: `${pct}%`, background: COLORS.accent }} />
        </div>
      )}
    </div>
  );
}