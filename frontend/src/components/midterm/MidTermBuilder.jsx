import Loader from "../Loader";
import { cardStyle, COLORS } from "../../utils/theme";
import { useMidTermBuilder } from "../../hooks/useMidTermBuilder";
import MidTermHeader from "./MidTermHeader";
import SubjectExamCard from "./SubjectExamCard";

export default function MidTermBuilder({ programme, availableSemesters = [] }) {
  const {
    selectedSem, semData, loading, rows, roomInfo,
    windowStart, setWindowStart, windowEnd, setWindowEnd,
    loadSemester, handleSlotClick, updateRow, autoSchedule, handleExport,
    filledCount, total, pct, conflicts,
  } = useMidTermBuilder(programme);

  return (
    <div className="flex flex-col gap-6">
      <MidTermHeader
        programme={programme}
        selectedSem={selectedSem}
        filledCount={filledCount}
        total={total}
        pct={pct}
        windowStart={windowStart}
        setWindowStart={setWindowStart}
        windowEnd={windowEnd}
        setWindowEnd={setWindowEnd}
        onAutoSchedule={autoSchedule}
        onExport={handleExport}
      />

      {/* Semester selector */}
      <div className="flex gap-3">
        {availableSemesters.map(sem => {
          const active = selectedSem === sem;
          return (
            <button
              key={sem}
              onClick={() => loadSemester(sem)}
              className="flex-1 rounded-2xl py-4 flex flex-col items-center gap-1 transition-all duration-200"
              style={active ? { background: COLORS.ink, color: "#fff" } : { ...cardStyle, color: "#374151" }}
            >
              <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: active ? "rgba(255,255,255,0.7)" : "#9CA3AF" }}>
                Sem
              </span>
              <span className="font-heading font-bold text-[1.6rem] leading-none">{sem}</span>
              {active && semData && <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.8)" }}>{total} subjects</span>}
            </button>
          );
        })}
      </div>

      {loading && <div className="flex justify-center py-12"><Loader /></div>}

      {!selectedSem && !loading && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 rounded-2xl border border-dashed border-stone-300">
          <p className="font-heading font-semibold text-stone-400 text-[15px]">Select a semester above</p>
          <p className="font-sans text-[12px] text-stone-300 text-center max-w-xs">
            Exam slots will auto-fill from the regular lecture timetable. You can tweak any field.
          </p>
        </div>
      )}

      {semData && !loading && (
        <>
          {conflicts.size > 0 && (
            <div className="rounded-xl px-4 py-3" style={cardStyle}>
              <p className="text-[12px] font-semibold" style={{ color: COLORS.accent }}>
                {conflicts.size} Core subject{conflicts.size !== 1 ? "s" : ""} have overlapping exam times — review cards marked "Time clash"
              </p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            {semData.subjects.map((s, i) => (
              <SubjectExamCard
                key={s.id}
                s={s}
                idx={i}
                row={rows[s.id]}
                roomInfo={roomInfo[s.id]}
                hasConflict={conflicts.has(s.id)}
                windowStart={windowStart}
                windowEnd={windowEnd}
                faculty={semData.faculty}
                onSlotClick={handleSlotClick}
                onUpdateRow={updateRow}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={filledCount === 0}
              className="px-6 py-2.5 rounded-2xl text-[13px] font-semibold text-white"
              style={{ background: filledCount > 0 ? COLORS.accent : "#D1D5DB", cursor: filledCount > 0 ? "pointer" : "not-allowed" }}
            >
              Export PDF ({filledCount}/{total})
            </button>
          </div>
        </>
      )}
    </div>
  );
}