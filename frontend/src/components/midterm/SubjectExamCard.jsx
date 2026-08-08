import { COLORS, cardStyle } from "../../utils/theme";
import { DAY_ORDER, DAY_SHORT, dayFromDate, getLecturesByDay, validateExamDay } from "../../utils/dateHelpers";
import { EXAM_TIMES } from "../../utils/midtermLogic";
import CategoryBadge from "../dashboard/CategoryBadge";
import { FieldRow, InlineDateInput, InlineSelect } from "./FormFields";

export default function SubjectExamCard({
  s, idx, row, roomInfo, hasConflict, windowStart, windowEnd, faculty,
  onSlotClick, onUpdateRow,
}) {
  const r = row || {};
  const dayStatus = validateExamDay(s, r.date);
  const roomBad = r.room && roomInfo?.occupied?.includes(r.room);
  const invalidDay = r.date && dayStatus === "no-lecture";
  const examDay = dayFromDate(r.date);
  const outOfWindow = r.date && windowStart && windowEnd && (r.date < windowStart || r.date > windowEnd);

  const lectureDayMap = getLecturesByDay(s.lecture_slots || []);
  const lectureDays = Object.keys(lectureDayMap).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={cardStyle}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-stone-300 font-bold">#{idx + 1}</span>
            {s.code && <span className="text-[10px] font-mono text-stone-400 font-semibold">{s.code}</span>}
            <CategoryBadge category={s.category} />
          </div>
          <p className="font-heading font-bold text-[14px] text-stone-900 leading-snug">{s.name}</p>
          <p className="text-[11px] text-stone-400 mt-0.5 truncate">
            {[...new Set(s.faculty)].join(", ") || "No faculty assigned"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {hasConflict && <p className="text-[10px] font-semibold" style={{ color: COLORS.accent }}>Time clash</p>}
          {invalidDay && <p className="text-[10px] font-semibold" style={{ color: COLORS.accent }}>No lecture {examDay}</p>}
          {roomBad && <p className="text-[10px] font-semibold" style={{ color: COLORS.accent }}>Room occupied</p>}
        </div>
      </div>

      {/* Lecture-day chips */}
      {lectureDays.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {lectureDays.map(day => {
            const slot = lectureDayMap[day][0];
            const active = examDay === day;
            return (
              <button
                key={day}
                onClick={() => onSlotClick(s.id, day, slot)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={active ? { background: COLORS.ink, color: "#fff" } : { background: "#F2EEE4", color: COLORS.muted }}
              >
                <span className="font-bold">{DAY_SHORT[day] || day}</span>
                <span className="opacity-70 ml-0.5">{slot.start}–{slot.end}</span>
                {slot.type === "Practical" && <span className="text-[8px] opacity-50 ml-1">lab</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-stone-400 font-sans">No timetable slots found.</p>
      )}

      <div className="h-px bg-stone-200" />

      <div className="flex flex-col gap-1.5">
        <FieldRow label="Date" warn={invalidDay || outOfWindow}>
          <InlineDateInput value={r.date || ""} onChange={v => onUpdateRow(s.id, "date", v, s)} />
          {invalidDay && (
            <p className="text-[9px] mt-0.5" style={{ color: COLORS.accent }}>
              No lecture on {examDay} — try {lectureDays.map(d => DAY_SHORT[d] || d).join(", ")}
            </p>
          )}
          {outOfWindow && (
            <p className="text-[9px] mt-0.5" style={{ color: COLORS.accent }}>
              Outside midterm window ({windowStart} – {windowEnd})
            </p>
          )}
        </FieldRow>

        <div className="flex gap-1.5">
          <div className="flex-1">
            <FieldRow label="Start">
              <InlineSelect value={r.startTime || ""} options={EXAM_TIMES} onChange={v => onUpdateRow(s.id, "startTime", v, s)} />
            </FieldRow>
          </div>
          <div className="flex-1">
            <FieldRow label="End">
              <InlineSelect value={r.endTime || ""} options={EXAM_TIMES} onChange={v => onUpdateRow(s.id, "endTime", v, s)} />
            </FieldRow>
          </div>
        </div>

        <FieldRow label="Room" warn={roomBad}>
          {!r.date || !r.startTime ? (
            <span className="text-[10px] text-stone-300">Set date & time first</span>
          ) : roomInfo?.fetching ? (
            <span className="text-[10px] text-stone-400 animate-pulse">Checking…</span>
          ) : (
            <div className="flex flex-col gap-1">
              {roomInfo?.own_rooms?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {roomInfo.own_rooms.map(rm => (
                    <button
                      key={rm}
                      onClick={() => onUpdateRow(s.id, "room", rm, s)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all"
                      style={r.room === rm ? { background: COLORS.accent, color: "#fff" } : { background: "#F2EEE4", color: "#374151" }}
                    >
                      {rm} <span className="opacity-50 text-[8px]">lecture room</span>
                    </button>
                  ))}
                </div>
              )}
              <InlineSelect
                value={roomInfo?.own_rooms?.includes(r.room) ? "" : r.room || ""}
                options={roomInfo?.available?.filter(v => !roomInfo?.own_rooms?.includes(v)) ?? []}
                placeholder={roomInfo?.available ? `${roomInfo.available.length} free rooms` : "— pick room —"}
                onChange={v => onUpdateRow(s.id, "room", v, s)}
              />
              {roomBad && <p className="text-[9px]" style={{ color: COLORS.accent }}>{r.room} is occupied at this time</p>}
              {roomInfo?.available && (
                <p className="text-[9px] text-stone-400">
                  {roomInfo.available.length + (roomInfo.own_rooms?.length ?? 0)} free · {roomInfo.occupied.length} in use
                </p>
              )}
            </div>
          )}
        </FieldRow>

        <FieldRow label="Invigilator">
          <InlineSelect value={r.invigilator || ""} options={faculty ?? []} onChange={v => onUpdateRow(s.id, "invigilator", v, s)} />
        </FieldRow>
      </div>
    </div>
  );
}