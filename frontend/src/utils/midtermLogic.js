import { dayFromDate, fmtDate } from "./dateHelpers";

// Includes all standard exam times + every actual timetable slot start/end time
export const EXAM_TIMES = [
  "08:00", "08:30",
  "09:00", "09:30",
  "10:00", "10:05", "10:30",
  "11:00", "11:05", "11:15", "11:30",
  "12:00", "12:15", "12:20",
  "13:00", "13:20",
  "14:00", "14:30",
  "15:00", "15:05", "15:30",
  "16:00", "16:05", "16:10", "16:30",
  "17:00", "17:05", "17:15",
];

const ELECTIVE_CATEGORIES = new Set([
  "Department Elective", "Open Elective", "Programme Elective", "Specialisation Elective",
]);
export function isElective(category) {
  return ELECTIVE_CATEGORIES.has(category);
}

/** Two subjects conflict when they overlap in time UNLESS both are electives. */
export function getConflicts(rows, subjects) {
  const filled = subjects
    .map(s => ({ id: s.id, elec: isElective(s.category), r: rows[s.id] }))
    .filter(e => e.r?.date && e.r?.startTime && e.r?.endTime);

  const conflicts = new Set();
  for (let i = 0; i < filled.length; i++) {
    for (let j = i + 1; j < filled.length; j++) {
      const a = filled[i], b = filled[j];
      if (a.elec && b.elec) continue; // both electives → OK, students choose one
      if (a.r.date === b.r.date && a.r.startTime < b.r.endTime && a.r.endTime > b.r.startTime) {
        conflicts.add(a.id);
        conflicts.add(b.id);
      }
    }
  }
  return conflicts;
}

/**
 * Greedy auto-scheduler. Pure function: takes current rows + constraints,
 * returns the next rows object. No side effects, no fetch calls.
 */
export function autoScheduleRows({ windowStart, windowEnd, semData, rows }) {
  if (!windowStart || !windowEnd || !semData) return rows;

  const allDates = [];
  const cur = new Date(windowStart + "T00:00");
  const endD = new Date(windowEnd + "T00:00");
  while (cur <= endD) {
    allDates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }

  const dateCount = Object.fromEntries(allDates.map(d => [d, 0]));
  const coreSlotUsed = {}; // "date|startTime" → true, blocks electives too
  const MAX_PER_DAY = 2;

  const countLectureDaysInWindow = (s) => {
    const TYPE_PREF = { Lecture: true, Tutorial: true };
    const daysInWindow = new Set(
      (s.lecture_slots || [])
        .filter(sl => TYPE_PREF[sl.type])
        .map(sl => sl.day)
        .filter(day => allDates.some(d => dayFromDate(d) === day))
    );
    return daysInWindow.size;
  };

  const prioritised = [...semData.subjects].sort((a, b) => {
    const ca = countLectureDaysInWindow(a);
    const cb = countLectureDaysInWindow(b);
    if (ca !== cb) return ca - cb; // most constrained first
    return isElective(a.category) ? 1 : isElective(b.category) ? -1 : 0; // Core before Elective
  });

  const newRows = { ...rows };

  for (const s of prioritised) {
    const slots = s.lecture_slots || [];
    if (!slots.length) continue;
    const elec = isElective(s.category);

    const TYPE_ORDER = { Lecture: 0, Tutorial: 1, Practical: 2 };
    const dayBestSlot = {};
    for (const slot of slots) {
      if (!dayBestSlot[slot.day]) dayBestSlot[slot.day] = slot; // pre-sorted, first = best
    }

    const orderedDays = Object.entries(dayBestSlot)
      .sort((a, b) => (TYPE_ORDER[a[1].type] ?? 3) - (TYPE_ORDER[b[1].type] ?? 3))
      .map(([, slot]) => slot);

    const lectureOrTutDays = orderedDays.filter(sl => sl.type !== "Practical");
    const practicalOnlyDays = orderedDays.filter(sl => sl.type === "Practical");

    function findBest(slotList, enforceCapAndClash) {
      for (const slot of slotList) {
        const candidates = allDates
          .filter(d => dayFromDate(d) === slot.day)
          .sort((a, b) => dateCount[a] - dateCount[b]);
        for (const date of candidates) {
          if (enforceCapAndClash && dateCount[date] >= MAX_PER_DAY) continue;
          if (enforceCapAndClash && coreSlotUsed[`${date}|${slot.start}`]) continue;
          return { date, slot };
        }
      }
      return null;
    }

    const found =
      findBest(lectureOrTutDays, true) ??
      findBest(practicalOnlyDays, true) ??
      findBest(lectureOrTutDays, false) ??
      findBest(practicalOnlyDays, false);

    if (!found?.date || !found?.slot) continue;
    const { date: bestDate, slot: bestSlot } = found;

    dateCount[bestDate]++;
    if (!elec) coreSlotUsed[`${bestDate}|${bestSlot.start}`] = true;

    newRows[s.id] = {
      ...newRows[s.id],
      date: bestDate,
      startTime: bestSlot.start,
      endTime: bestSlot.end,
      room: bestSlot.room !== "—" ? bestSlot.room : (newRows[s.id]?.room || ""),
      invigilator: s.faculty?.[0] || newRows[s.id]?.invigilator || "",
    };
  }

  return newRows;
}

/** Builds the printable HTML timetable and opens it in a new tab. */
export function exportMidTermHTML({ programme, selectedSem, semData, rows, windowStart, windowEnd }) {
  if (!semData) return;

  const scheduled = semData.subjects
    .map(s => ({ s, r: rows[s.id] || {} }))
    .filter(({ r }) => r.date)
    .sort((a, b) => {
      if (a.r.date !== b.r.date) return a.r.date.localeCompare(b.r.date);
      return (a.r.startTime || "").localeCompare(b.r.startTime || "");
    });

  const byDate = [];
  let current = null;
  for (const entry of scheduled) {
    if (!current || current.date !== entry.r.date) {
      current = { date: entry.r.date, entries: [] };
      byDate.push(current);
    }
    current.entries.push(entry);
  }

  let tableRows = "";
  let rowNum = 0;
  for (const group of byDate) {
    group.entries.forEach(({ s, r }, i) => {
      rowNum++;
      const dateCell = i === 0
        ? `<td rowspan="${group.entries.length}" style="vertical-align:middle;background:#FFF8F3;font-weight:700;color:#c2410c;white-space:nowrap;padding:10px 14px;border:1px solid #E8E3DA;">${fmtDate(r.date)}</td>`
        : "";
      tableRows += `
        <tr style="border-bottom:1px solid #E8E3DA;">
          ${dateCell}
          <td style="padding:8px 12px;border:1px solid #E8E3DA;">${rowNum}</td>
          <td style="padding:8px 12px;border:1px solid #E8E3DA;font-weight:600;">${s.name}</td>
          <td style="padding:8px 12px;border:1px solid #E8E3DA;font-family:monospace;color:#6B7280;">${s.code || "—"}</td>
          <td style="padding:8px 12px;border:1px solid #E8E3DA;color:#6B7280;">${[...new Set(s.faculty)].join(", ") || "—"}</td>
          <td style="padding:8px 12px;border:1px solid #E8E3DA;text-align:center;">${r.startTime || "—"}</td>
          <td style="padding:8px 12px;border:1px solid #E8E3DA;text-align:center;">${r.endTime || "—"}</td>
          <td style="padding:8px 12px;border:1px solid #E8E3DA;text-align:center;font-weight:600;">${r.room || "—"}</td>
          <td style="padding:8px 12px;border:1px solid #E8E3DA;color:#6B7280;">${r.invigilator || "—"}</td>
        </tr>`;
    });
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Mid Term Timetable — ${programme} Sem ${selectedSem}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; color: #1C1917; background: #fff; padding: 32px; }
    .header { margin-bottom: 24px; border-bottom: 3px solid #f97316; padding-bottom: 16px; }
    .header h1 { font-size: 20px; font-weight: 800; color: #1C1917; margin-bottom: 4px; }
    .header p { font-size: 12px; color: #6B7280; }
    .badge { display:inline-block; background:#FFF7ED; color:#c2410c; font-size:11px; font-weight:700;
             padding:2px 8px; border-radius:20px; margin-left:8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #1C1917; color: #fff; }
    thead th { padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px;
               text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    tbody tr:nth-child(even) { background: #FAFAF9; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
      @page { margin: 1.5cm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Mid Term Examination Timetable
      <span class="badge">${programme}</span>
      <span class="badge">Semester ${selectedSem}</span>
      <span class="badge">AY 2026–27</span>
    </h1>
    <p>Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
       &nbsp;·&nbsp; ${scheduled.length} subjects scheduled
       ${windowStart && windowEnd ? ` &nbsp;·&nbsp; Exam window: ${fmtDate(windowStart)} – ${fmtDate(windowEnd)}` : ""}
    </p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Exam Date</th><th>#</th><th>Subject</th><th>Code</th><th>Faculty</th>
        <th>Start</th><th>End</th><th>Room</th><th>Invigilator</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}