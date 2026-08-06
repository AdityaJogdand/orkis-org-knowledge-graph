import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";

/* ── utils ──────────────────────────────────────────────────────── */

function nameFromEmail(email = "") {
  return email.split("@")[0].split(".")
    .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function greet() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function authHeader() {
  const t = localStorage.getItem("orkis_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Dean check takes priority — a person can be both professor AND dean
function isDean(role = "")        { return role.toLowerCase().includes("dean"); }
function isFaculty(role = "")     { return !isDean(role) && (role.toLowerCase().includes("professor") || role.toLowerCase().includes("faculty")); }
function isChairperson(role = "") { return role.toLowerCase().includes("program chairperson") || role.toLowerCase().includes("programme chairperson"); }

function endpointForRole(role) {
  if (!role) return null;
  if (isDean(role))        return "/dashboard/dean";
  if (isChairperson(role)) return "/dashboard/chair";
  if (isFaculty(role))     return "/dashboard/faculty";
  return null;
}

function subtitleForRole(role, chairedProgramme) {
  if (isDean(role))          return "Here's your institute today.";
  if (isChairperson(role))   return chairedProgramme ? `Programme Chairperson — ${chairedProgramme}` : "Programme Chairperson";
  if (isFaculty(role))       return "Here's your teaching load today.";
  return "Welcome to Orkis.";
}

/* ── neumorphic token ───────────────────────────────────────────── */

const neuRaised = "8px 8px 20px #D4CFC7, -8px -8px 20px #FFFFFF";

/* ── shared KPI card ────────────────────────────────────────────── */

function KPI({ label, value, caption, accent }) {
  return (
    <div
      className="flex-1 rounded-[22px] p-6 flex flex-col gap-3"
      style={{ background: "#F6F2EA", boxShadow: neuRaised }}
    >
      <div className="w-8 h-[3px] rounded-full" style={{ background: accent ? "#f97316" : "#C8C3BB" }} />
      <p className="font-heading text-[13px] font-semibold text-gray-600 leading-tight">{label}</p>
      <p className="font-heading font-bold leading-none tracking-tight"
        style={{ fontSize: "2.6rem", color: accent ? "#f97316" : "#1C1917" }}>
        {value}
      </p>
      {caption && <p className="text-[11px] text-gray-400 font-sans leading-snug">{caption}</p>}
    </div>
  );
}

/* ── Dean KPI row ───────────────────────────────────────────────── */

function DeanKPIs({ data, kpisRef }) {
  return (
    <div ref={kpisRef} className="flex gap-4">
      <KPI label="Total Faculty"       value={data.total_faculty}              caption="Distinct across all programmes" />
      <KPI label="Subjects Covered"    value={`${data.subjects_covered_pct}%`} caption={`${data.unassigned_subjects} still unassigned`} accent />
      <KPI label="Active Programmes"   value={data.active_programmes}          caption="MBA Tech · B.Tech CE · AI&DS" />
      <KPI label="Pending Approvals"   value={data.pending_approvals}          caption="Leave requests awaiting sign-off" accent />
      <KPI label="Unassigned Subjects" value={data.unassigned_subjects}        caption="Subjects with no faculty matched" />
    </div>
  );
}

/* ── Next Class KPI card ────────────────────────────────────────── */

function NextClassKPI({ next_class }) {
  const status = next_class?.status;

  // ── No data / no classes on this day ──
  if (!next_class || status === "no_classes") {
    return (
      <div className="flex-1 rounded-[22px] p-6 flex flex-col gap-3"
        style={{ background: "#F6F2EA", boxShadow: neuRaised }}>
        <div className="w-8 h-[3px] rounded-full bg-[#C8C3BB]" />
        <p className="font-heading text-[13px] font-semibold text-gray-600">Current / Next Class</p>
        <p className="font-heading font-bold text-[1.6rem] text-gray-400">Free today</p>
        <p className="text-[11px] text-gray-400 font-sans">No classes scheduled</p>
      </div>
    );
  }

  // ── Day ended — all classes done ──
  if (status === "day_ended") {
    return (
      <div className="flex-1 rounded-[22px] p-6 flex flex-col gap-3"
        style={{ background: "#FFF5F5", boxShadow: neuRaised }}>
        <div className="w-8 h-[3px] rounded-full bg-red-400" />
        <p className="font-heading text-[13px] font-semibold text-gray-600">Today's Classes</p>
        <p className="font-heading font-bold text-[1.6rem] text-red-500">Day Ended</p>
        <p className="text-[11px] text-red-400 font-sans">All sessions for today are complete</p>
      </div>
    );
  }

  const isOngoing = status === "ongoing";

  // ── Ongoing or upcoming ──
  return (
    <div
      className="flex-1 rounded-[22px] p-6 flex flex-col gap-2"
      style={{
        background: isOngoing ? "#FFF7ED" : "#F6F2EA",
        boxShadow: isOngoing
          ? "8px 8px 20px #f9b98a, -8px -8px 20px #FFFFFF"
          : neuRaised,
      }}
    >
      <div className="w-8 h-[3px] rounded-full" style={{ background: "#f97316" }} />

      <div className="flex items-center gap-2">
        <p className="font-heading text-[13px] font-semibold text-gray-600">
          {isOngoing ? "Ongoing" : "Next Class"}
        </p>
        {isOngoing && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            LIVE
          </span>
        )}
      </div>

      <p className="font-heading font-bold leading-tight tracking-tight"
        style={{ fontSize: "1.6rem", color: "#f97316" }}>
        {next_class.time}
        {isOngoing && next_class.end_time && (
          <span className="text-[1rem] text-gray-400 font-semibold ml-1">
            – {next_class.end_time}
          </span>
        )}
      </p>

      <p className="font-heading font-semibold text-[14px] text-gray-800 leading-snug">
        {next_class.subject}
      </p>

      <p className="text-[11px] text-gray-400 font-sans">
        {next_class.room} · Div {next_class.division} · {next_class.programme}
        {next_class.batch && ` · ${next_class.batch}`}
      </p>
    </div>
  );
}

/* ── Faculty KPI row ────────────────────────────────────────────── */

function FacultyKPIs({ data, kpisRef }) {
  const internalRef = useRef(null);
  const ref = kpisRef ?? internalRef;
  return (
    <div ref={ref} className="flex gap-4">
      <NextClassKPI next_class={data.next_class} />
      <KPI label="My Subjects"      value={data.total_subjects}           caption={`${data.core_subjects} core · ${data.elective_subjects} elective`} />
      <KPI label="Weekly Hours"     value={`${data.weekly_hours}h`}       caption="Actual teaching load this week" accent />
      <KPI label="Semesters Active" value={data.semesters?.length ?? "—"} caption={data.semesters?.map(s => `Sem ${s}`).join(" · ") || "—"} />
    </div>
  );
}

/* ── Subject list table ─────────────────────────────────────────── */

const CATEGORY_COLOR = {
  "Core":                  { bg: "bg-blue-50",   text: "text-blue-700"   },
  "Department Elective":   { bg: "bg-purple-50", text: "text-purple-700" },
  "Open Elective":         { bg: "bg-green-50",  text: "text-green-700"  },
  "Programme Elective":    { bg: "bg-amber-50",  text: "text-amber-700"  },
  "Programme Activity":    { bg: "bg-gray-50",   text: "text-gray-500"   },
  "Specialisation Elective": { bg: "bg-pink-50", text: "text-pink-700"   },
};

const CATEGORY_SHORT = {
  "Programme Elective":      "Prog. Elective",
  "Department Elective":     "Dept. Elective",
  "Specialisation Elective": "Spec. Elective",
  "Programme Activity":      "Activity",
  "Open Elective":           "Open Elective",
  "Core":                    "Core",
};

function CategoryBadge({ category }) {
  const c = CATEGORY_COLOR[category] ?? { bg: "bg-gray-50", text: "text-gray-500" };
  const label = CATEGORY_SHORT[category] ?? category;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap inline-block ${c.bg} ${c.text}`}>
      {label}
    </span>
  );
}

function SubjectList({ subjects }) {
  if (!subjects?.length) return null;
  return (
    <div
      className="rounded-[22px] p-6"
      style={{ background: "#F6F2EA", boxShadow: neuRaised }}
    >
      <p className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-400 mb-4">
        My Subjects — {subjects.length} assignment{subjects.length !== 1 ? "s" : ""}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#E8E3DA]">
              <th className="text-left pb-2 font-semibold text-gray-500 pr-4">Subject</th>
              <th className="text-left pb-2 font-semibold text-gray-500 pr-4">Programme</th>
              <th className="text-left pb-2 font-semibold text-gray-500 pr-4">Sem</th>
              <th className="text-left pb-2 font-semibold text-gray-500 pr-4">Div</th>
              <th className="text-left pb-2 font-semibold text-gray-500">Category</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => (
              <tr
                key={i}
                className="border-b border-[#F0EBE1] last:border-0 hover:bg-[#F0EBE1]/60 transition-colors"
              >
                <td className="py-2.5 pr-4 font-medium text-gray-800">
                  {s.name}
                  {s.code && (
                    <span className="ml-1.5 text-[10px] text-gray-400 font-mono">({s.code})</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-gray-500">{s.programme}</td>
                <td className="py-2.5 pr-4 text-gray-500">Sem {s.semester}</td>
                <td className="py-2.5 pr-4 text-gray-500">{s.division ?? "—"}</td>
                <td className="py-2.5"><CategoryBadge category={s.category} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Programme overview (chairperson dashboard) ─────────────────── */

function ProgrammeOverview({ data }) {
  if (!data) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Summary KPIs */}
      <div ref={undefined} className="flex gap-4">
        <KPI label="Total Subjects"      value={data.total_subjects}        caption={`${data.assigned_subjects} assigned · ${data.unassigned_subjects} unassigned`} />
        <KPI label="Faculty Engaged"     value={data.total_faculty}         caption={`Across all semesters`} accent />
        <KPI label="Semesters Running"   value={data.semesters?.length}     caption={data.semesters?.map(s => `Sem ${s.semester}`).join(" · ")} />
        <KPI label="Coverage"
          value={`${data.total_subjects ? Math.round(data.assigned_subjects / data.total_subjects * 100) : 0}%`}
          caption="Subjects with faculty assigned" accent />
      </div>

      {/* Semester-wise subject tables */}
      {data.semesters?.map(({ semester, subjects }) => (
        <div key={semester}
          className="rounded-[22px] p-6"
          style={{ background: "#F6F2EA", boxShadow: neuRaised }}
        >
          <p className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-400 mb-4">
            Semester {semester} — {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
          </p>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#E8E3DA]">
                <th className="text-left pb-2 font-semibold text-gray-500 pr-4 w-8">#</th>
                <th className="text-left pb-2 font-semibold text-gray-500 pr-4">Subject</th>
                <th className="text-left pb-2 font-semibold text-gray-500 pr-4">Category</th>
                <th className="text-left pb-2 font-semibold text-gray-500">Faculty</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, i) => (
                <tr key={i} className="border-b border-[#F0EBE1] last:border-0 hover:bg-[#F0EBE1]/60 transition-colors">
                  <td className="py-2.5 pr-4 text-gray-400 text-[11px]">{i + 1}</td>
                  <td className="py-2.5 pr-4 font-medium text-gray-800">
                    {s.name}
                    {s.code && <span className="ml-1.5 text-[10px] text-gray-400 font-mono">({s.code})</span>}
                  </td>
                  <td className="py-2.5 pr-4"><CategoryBadge category={s.category} /></td>
                  <td className="py-2.5">
                    {s.faculty.length === 0 ? (
                      <span className="text-[11px] text-red-400 font-semibold">Unassigned</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {/* De-duplicate by name */}
                        {[...new Map(s.faculty.map(f => [f.name, f])).values()].map((f, fi) => (
                          <span key={fi}
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              f.type === "Visiting"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

/* ── Tab switcher ───────────────────────────────────────────────── */

function TabSwitcher({ active, onChange, tabs }) {
  return (
    <div
      className="inline-flex rounded-[16px] p-1 gap-1"
      style={{ background: "#EDE9E0", boxShadow: "inset 4px 4px 10px #D4CFC7, inset -4px -4px 10px #FFFFFF" }}
    >
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="px-5 py-2 rounded-[12px] text-[13px] font-semibold font-heading transition-all duration-200"
          style={
            active === t.id
              ? { background: "#f97316", color: "#fff", boxShadow: "4px 4px 10px #d4600a, -2px -2px 6px #ffb380" }
              : { background: "transparent", color: "#9CA3AF" }
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── Mid Term Timetable builder ─────────────────────────────────── */

// Includes all standard exam times + every actual timetable slot start/end time
const EXAM_TIMES = [
  "08:00","08:30",
  "09:00","09:30",
  "10:00","10:05","10:30",
  "11:00","11:05","11:15","11:30",
  "12:00","12:15","12:20",
  "13:00","13:20",
  "14:00","14:30",
  "15:00","15:05","15:30",
  "16:00","16:05","16:10","16:30",
  "17:00","17:05","17:15",
];

/* Inline field editors */
function InlineSelect({ value, onChange, options, placeholder = "— pick —" }) {
  // If current value isn't in the options list, inject it so it shows correctly
  const allOptions = value && !options.includes(value)
    ? [value, ...options]
    : options;
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-transparent text-[12px] text-gray-700 focus:outline-none cursor-pointer border-0">
      <option value="">{placeholder}</option>
      {allOptions.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function InlineDateInput({ value, onChange }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)}
      onFocus={e => { e.target.type = "date"; }}
      onBlur={e => { if (!e.target.value) e.target.type = "text"; }}
      placeholder="Pick date"
      className="w-full bg-transparent text-[12px] text-gray-700 focus:outline-none border-0 placeholder:text-gray-300" />
  );
}

/* Field row inside a card */
function FieldRow({ label, children, warn }) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2 rounded-[10px]"
      style={{ background: warn ? "#FFF8F0" : "#EDE9E0" }}>
      <span className="text-[10px] font-semibold text-gray-400 w-16 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* Conflict detection across all subjects */
const ELECTIVE_CATEGORIES = new Set([
  "Department Elective", "Open Elective", "Programme Elective", "Specialisation Elective",
]);
function isElective(category) { return ELECTIVE_CATEGORIES.has(category); }

function getConflicts(rows, subjects) {
  // Two subjects conflict when they overlap in time UNLESS both are electives.
  // Elective vs Elective → OK (students choose one).
  // Core vs Core, Core vs Elective → conflict (Core students can't be in two exams).
  const filled = subjects
    .map(s => ({ id: s.id, elec: isElective(s.category), r: rows[s.id] }))
    .filter(e => e.r?.date && e.r?.startTime && e.r?.endTime);

  const conflicts = new Set();
  for (let i = 0; i < filled.length; i++) {
    for (let j = i + 1; j < filled.length; j++) {
      const a = filled[i], b = filled[j];
      if (a.elec && b.elec) continue;   // both electives → no conflict
      if (a.r.date === b.r.date &&
          a.r.startTime < b.r.endTime &&
          a.r.endTime   > b.r.startTime) {
        conflicts.add(a.id);
        conflicts.add(b.id);
      }
    }
  }
  return conflicts;
}

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DAY_SHORT  = { Monday:"Mon", Tuesday:"Tue", Wednesday:"Wed", Thursday:"Thu", Friday:"Fri", Saturday:"Sat" };

function dayFromDate(dateStr) {
  if (!dateStr) return null;
  return DAY_NAMES[new Date(dateStr + "T00:00").getDay()];
}

/** Returns YYYY-MM-DD of the next (or this) occurrence of dayName from today */
function nextOccurrenceOf(dayName) {
  const target   = DAY_NAMES.indexOf(dayName);
  if (target === -1) return "";
  const today    = new Date();
  const todayIdx = today.getDay();
  let   ahead    = target - todayIdx;
  if (ahead <= 0) ahead += 7;
  const d = new Date(today);
  d.setDate(today.getDate() + ahead);
  return d.toISOString().split("T")[0];
}

// Client-side helpers — no extra API calls ─────────────────────────────────

function getLecturesByDay(lectureSlots) {
  // Returns { Monday: [{start,end,room}], ... }
  const map = {};
  for (const sl of lectureSlots) {
    if (!map[sl.day]) map[sl.day] = [];
    map[sl.day].push(sl);
  }
  return map;
}

function validateExamDay(subject, date) {
  // Returns: "valid" | "no-lecture" | "unknown"
  if (!date) return "unknown";
  const day = dayFromDate(date);
  if (!day || day === "Sunday") return "no-lecture";
  if (!subject.lecture_slots?.length) return "unknown";
  const hasLecture = subject.lecture_slots.some(s => s.day === day);
  return hasLecture ? "valid" : "no-lecture";
}

function MidTermBuilder({ programme, availableSemesters = [] }) {
  const [selectedSem, setSelectedSem]   = useState(null);
  const [semData, setSemData]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [rows, setRows]                 = useState({});
  const [roomInfo, setRoomInfo]         = useState({});
  const [expandedRoom, setExpandedRoom] = useState(null);
  // University-wide midterm window
  const [windowStart, setWindowStart]   = useState("");
  const [windowEnd, setWindowEnd]       = useState("");

  const roomCache  = useRef(new Map());
  const debounceRef = useRef({});

  function autoSchedule() {
    if (!windowStart || !windowEnd || !semData) return;

    // All calendar dates in the exam window
    const allDates = [];
    const cur = new Date(windowStart + "T00:00");
    const endD = new Date(windowEnd  + "T00:00");
    while (cur <= endD) {
      allDates.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }

    // Tracking state
    const dateCount      = Object.fromEntries(allDates.map(d => [d, 0]));
    // Tracks slots used by Core (non-elective) subjects.
    // Electives must avoid these slots too — a Core exam means all students are busy.
    const coreSlotUsed  = {}; // "date|startTime" → true

    const MAX_PER_DAY = 2;

    // Sort by: fewest lecture/tutorial days in window first (most constrained picks first),
    // then Core before Elective as tiebreaker.
    // Subjects with only 1 lecture day (e.g. CF → only Thursday) must be placed before
    // subjects that have multiple options (e.g. BT → Thursday OR Monday).
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
      // Most constrained (fewest options) first; ties broken by Core > Elective
      if (ca !== cb) return ca - cb;
      return isElective(a.category) ? 1 : isElective(b.category) ? -1 : 0;
    });

    const newRows = { ...rows };

    for (const s of prioritised) {
      const slots = s.lecture_slots || [];
      if (!slots.length) continue;

      const elec = isElective(s.category);

      // Deduplicate by day: keep only the BEST slot per day (Lecture > Tutorial > Practical).
      // Slots arrive pre-sorted by type from the backend, so the first entry per day wins.
      const TYPE_ORDER = { Lecture: 0, Tutorial: 1, Practical: 2 };
      const dayBestSlot = {};
      for (const slot of slots) {
        if (!dayBestSlot[slot.day]) {
          dayBestSlot[slot.day] = slot; // first = best because backend sorts Lecture first
        }
      }

      // Sort days: classroom-lecture days first, then tutorial, then lab-only days
      const orderedDays = Object.entries(dayBestSlot)
        .sort((a, b) => (TYPE_ORDER[a[1].type] ?? 3) - (TYPE_ORDER[b[1].type] ?? 3))
        .map(([, slot]) => slot);

      // Separate Lecture/Tutorial days from Practical-only days
      const lectureOrTutDays  = orderedDays.filter(sl => sl.type !== "Practical");
      const practicalOnlyDays = orderedDays.filter(sl => sl.type === "Practical");

      // Helper: find best date for a slot list, returns { date, slot } or null
      function findBest(slotList, enforceCapAndClash) {
        for (const slot of slotList) {
          const candidates = allDates
            .filter(d => dayFromDate(d) === slot.day)
            .sort((a, b) => dateCount[a] - dateCount[b]);
          for (const date of candidates) {
            if (enforceCapAndClash && dateCount[date] >= MAX_PER_DAY) continue;
            // Both Core AND Electives must avoid slots already used by a Core subject
            if (enforceCapAndClash && coreSlotUsed[`${date}|${slot.start}`]) continue;
            return { date, slot };
          }
        }
        return null;
      }

      // Pass 1: Lecture/Tutorial day, within 2/day cap + no Core clash
      // Pass 2: Practical day, within cap
      // Pass 3: Lecture/Tutorial day, cap exceeded (still better than lab)
      // Pass 4: Practical day, no cap (last resort)
      const found =
        findBest(lectureOrTutDays,  true)  ??
        findBest(practicalOnlyDays, true)  ??
        findBest(lectureOrTutDays,  false) ??
        findBest(practicalOnlyDays, false);

      const bestDate = found?.date ?? null;
      const bestSlot = found?.slot ?? null;

      if (!bestDate || !bestSlot) continue;

      // Commit assignment
      dateCount[bestDate]++;
      // Core subjects block their slot for everyone (including electives)
      if (!elec) coreSlotUsed[`${bestDate}|${bestSlot.start}`] = true;

      newRows[s.id] = {
        ...newRows[s.id],
        date:        bestDate,
        startTime:   bestSlot.start,
        endTime:     bestSlot.end,
        room:        bestSlot.room !== "—" ? bestSlot.room : (newRows[s.id]?.room || ""),
        invigilator: s.faculty?.[0] || newRows[s.id]?.invigilator || "",
      };
    }

    setRows(newRows);
    setRoomInfo({});
    roomCache.current.clear();
  }

  function loadSemester(sem) {
    setSelectedSem(sem);
    setSemData(null);
    setRows({});
    setRoomInfo({});
    setExpandedRoom(null);
    roomCache.current.clear();
    setLoading(true);
    fetch(`/dashboard/chair/midterm-data/${sem}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        setSemData(d);
        const TYPE_ORDER = { Lecture: 0, Tutorial: 1, Practical: 2 };
        const init = {};
        d.subjects.forEach(s => {
          // Pick the best slot per day, then prefer a Lecture day over Tutorial/Practical
          const dayBestSlot = {};
          for (const sl of (s.lecture_slots || [])) {
            if (!dayBestSlot[sl.day]) dayBestSlot[sl.day] = sl;
          }
          const bestSlot = Object.values(dayBestSlot)
            .sort((a, b) => (TYPE_ORDER[a.type] ?? 3) - (TYPE_ORDER[b.type] ?? 3))[0];

          const room = bestSlot?.room && bestSlot.room !== "—" ? bestSlot.room : "";
          init[s.id] = {
            date:        bestSlot ? nextOccurrenceOf(bestSlot.day) : "",
            startTime:   bestSlot?.start || "",
            endTime:     bestSlot?.end   || "",
            room,
            invigilator: s.faculty?.[0] || "",
          };
        });
        setRows(init);
      })
      .finally(() => setLoading(false));
  }

  function fetchRooms(id, day, start, end) {
    if (!day || !start || !end || start >= end) return;
    // Cache key includes subject id so each subject gets its own room list
    const cacheKey = `${id}|${day}|${start}|${end}`;
    if (roomCache.current.has(cacheKey)) {
      setRoomInfo(prev => ({ ...prev, [id]: { ...roomCache.current.get(cacheKey), fetching: false } }));
      return;
    }
    setRoomInfo(prev => ({ ...prev, [id]: { available: [], occupied: [], own_rooms: [], fetching: true } }));
    fetch(
      `/dashboard/chair/available-rooms?day=${day}&start=${start}&end=${end}&exclude_subject_id=${id}`,
      { headers: authHeader() }
    )
      .then(r => r.json())
      .then(d => {
        const result = { available: d.available, occupied: d.occupied, own_rooms: d.own_rooms ?? [], fetching: false };
        roomCache.current.set(cacheKey, result);
        setRoomInfo(prev => ({ ...prev, [id]: result }));
      })
      .catch(() => setRoomInfo(prev => ({ ...prev, [id]: { available: [], occupied: [], own_rooms: [], fetching: false } })));
  }

  function scheduleRoomFetch(id, day, start, end) {
    clearTimeout(debounceRef.current[id]);
    debounceRef.current[id] = setTimeout(() => fetchRooms(id, day, start, end), 350);
  }

  /** Called when user clicks a lecture-day chip — fills date, time, then fetches rooms */
  function handleSlotClick(id, day, slot) {
    const date      = nextOccurrenceOf(day);
    const startTime = slot.start;
    const endTime   = slot.end;

    setRows(prev => ({
      ...prev,
      [id]: { ...prev[id], date, startTime, endTime, room: "" },
    }));

    // Immediately fetch available rooms (skip debounce — user explicitly clicked)
    const cacheKey = `${day}|${startTime}|${endTime}`;
    if (roomCache.current.has(cacheKey)) {
      setRoomInfo(prev => ({ ...prev, [id]: { ...roomCache.current.get(cacheKey), fetching: false } }));
    } else {
      setRoomInfo(prev => ({ ...prev, [id]: { available: [], occupied: [], own_rooms: [], fetching: true } }));
      fetch(`/dashboard/chair/available-rooms?day=${day}&start=${startTime}&end=${endTime}&exclude_subject_id=${id}`, { headers: authHeader() })
        .then(r => r.json())
        .then(d => {
          const result = { available: d.available, occupied: d.occupied, own_rooms: d.own_rooms ?? [], fetching: false };
          roomCache.current.set(cacheKey, result);
          setRoomInfo(prev => ({ ...prev, [id]: result }));
          // Auto-pick: prefer own lecture room, else pick if only one available
          if (d.own_rooms?.length) {
            setRows(prev => ({ ...prev, [id]: { ...prev[id], room: d.own_rooms[0] } }));
          } else if (d.available.length === 1) {
            setRows(prev => ({ ...prev, [id]: { ...prev[id], room: d.available[0] } }));
          }
        })
        .catch(() => setRoomInfo(prev => ({ ...prev, [id]: { available: [], occupied: [], own_rooms: [], fetching: false } })));
    }
  }

  function updateRow(id, field, val, subject) {
    setRows(prev => {
      const next = { ...prev, [id]: { ...prev[id], [field]: val } };
      const r    = next[id];

      // When date changes: validate day + auto-fill time from lecture slot
      if (field === "date") {
        const day = dayFromDate(val);
        next[id].room = ""; // clear room on date change
        if (day && subject) {
          const byDay   = getLecturesByDay(subject.lecture_slots || []);
          const daySlot = byDay[day]?.[0];
          if (daySlot) {
            next[id].startTime = daySlot.start;
            next[id].endTime   = daySlot.end;
          }
        }
        scheduleRoomFetch(id, day, next[id].startTime, next[id].endTime);
      }

      // Time change: clear room, re-fetch
      if (field === "startTime" || field === "endTime") {
        next[id].room = "";
        const day = dayFromDate(r.date);
        scheduleRoomFetch(id, day, next[id].startTime, next[id].endTime);
      }

      return next;
    });
  }

  function handleExport() {
    if (!semData) return;

    // Group scheduled subjects by date, sorted chronologically
    const scheduled = semData.subjects
      .map(s => ({ s, r: rows[s.id] || {} }))
      .filter(({ r }) => r.date)
      .sort((a, b) => {
        if (a.r.date !== b.r.date) return a.r.date.localeCompare(b.r.date);
        return (a.r.startTime || "").localeCompare(b.r.startTime || "");
      });

    // Group by date for rowspan calculation
    const byDate = [];
    let current = null;
    for (const entry of scheduled) {
      if (!current || current.date !== entry.r.date) {
        current = { date: entry.r.date, entries: [] };
        byDate.push(current);
      }
      current.entries.push(entry);
    }

    // Format date nicely
    function fmtDate(d) {
      if (!d) return "—";
      const dt = new Date(d + "T00:00");
      return dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    }

    // Build table rows with merged date cells
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
    .header p  { font-size: 12px; color: #6B7280; }
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
    <p>Generated on ${new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
       &nbsp;·&nbsp; ${scheduled.length} subjects scheduled
       ${windowStart && windowEnd ? ` &nbsp;·&nbsp; Exam window: ${fmtDate(windowStart)} – ${fmtDate(windowEnd)}` : ""}
    </p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Exam Date</th>
        <th>#</th>
        <th>Subject</th>
        <th>Code</th>
        <th>Faculty</th>
        <th>Start</th>
        <th>End</th>
        <th>Room</th>
        <th>Invigilator</th>
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

  const filledCount = Object.values(rows).filter(r => r.date && r.room).length;
  const total       = semData?.subjects?.length ?? 0;
  const pct         = total ? Math.round((filledCount / total) * 100) : 0;
  const conflicts   = semData ? getConflicts(rows, semData.subjects) : new Set();

  /* ── Subject card ─────────────────────────────────────────────── */
  function SubjectCard({ s, idx }) {
    const r           = rows[s.id] || {};
    const ri          = roomInfo[s.id];
    const dayStatus   = validateExamDay(s, r.date);
    const hasConflict = conflicts.has(s.id);   // only Core subjects trigger this
    const roomBad     = r.room && ri?.occupied?.includes(r.room);
    const invalidDay  = r.date && dayStatus === "no-lecture";
    const examDay     = dayFromDate(r.date);

    const DAY_ORDER_LOCAL = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    const lectureDayMap   = getLecturesByDay(s.lecture_slots || []);
    const lectureDays     = Object.keys(lectureDayMap).sort(
      (a, b) => DAY_ORDER_LOCAL.indexOf(a) - DAY_ORDER_LOCAL.indexOf(b)
    );

    return (
      <div className="rounded-[20px] p-5 flex flex-col gap-3"
        style={{ background: "#F6F2EA", boxShadow: neuRaised }}>

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-gray-300 font-bold">#{idx + 1}</span>
              {s.code && <span className="text-[10px] font-mono text-gray-400 font-semibold">{s.code}</span>}
              <CategoryBadge category={s.category} />
            </div>
            <p className="font-heading font-bold text-[14px] text-gray-900 leading-snug">{s.name}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">
              {[...new Set(s.faculty)].join(", ") || "No faculty assigned"}
            </p>
          </div>
          {/* Status — text only, no color badges */}
          <div className="shrink-0 text-right">
            {hasConflict && (
              <p className="text-[10px] font-semibold text-[#f97316]">Time clash</p>
            )}
            {invalidDay && (
              <p className="text-[10px] font-semibold text-[#f97316]">No lecture {examDay}</p>
            )}
            {roomBad && (
              <p className="text-[10px] font-semibold text-[#f97316]">Room occupied</p>
            )}
          </div>
        </div>

        {/* Lecture day chips — or hint if pure practical */}
        {lectureDays.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {lectureDays.map(day => {
              const slot   = lectureDayMap[day][0];
              const active = examDay === day;
              return (
                <button key={day} onClick={() => handleSlotClick(s.id, day, slot)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[10px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: active ? "#f97316" : "#EDE9E0",
                    color:      active ? "#fff"     : "#6B7280",
                    boxShadow:  active ? "2px 2px 6px #d4600a" : "2px 2px 4px #D4CFC7,-1px -1px 4px #fff",
                  }}>
                  <span className="font-bold">{DAY_SHORT[day] || day}</span>
                  <span className="opacity-70 ml-0.5">{slot.start}–{slot.end}</span>
                  {slot.type === "Practical" && (
                    <span className="text-[8px] opacity-50 ml-1">lab</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[10px] text-gray-400 font-sans">No timetable slots found.</p>
        )}

        <div className="h-px bg-[#E8E3DA]" />

        <div className="flex flex-col gap-1.5">

          {/* Date */}
          {(() => {
            const outOfWindow = r.date && windowStart && windowEnd && (r.date < windowStart || r.date > windowEnd);
            return (
              <FieldRow label="Date" warn={invalidDay || outOfWindow}>
                <InlineDateInput value={r.date || ""} onChange={v => updateRow(s.id, "date", v, s)} />
                {invalidDay && (
                  <p className="text-[9px] text-[#f97316] mt-0.5">
                    No lecture on {examDay} — try {lectureDays.map(d => DAY_SHORT[d] || d).join(", ")}
                  </p>
                )}
                {outOfWindow && (
                  <p className="text-[9px] text-[#f97316] mt-0.5">
                    Outside midterm window ({windowStart} – {windowEnd})
                  </p>
                )}
              </FieldRow>
            );
          })()}

          {/* Time — side by side */}
          <div className="flex gap-1.5">
            <div className="flex-1">
              <FieldRow label="Start">
                <InlineSelect value={r.startTime || ""} options={EXAM_TIMES}
                  onChange={v => updateRow(s.id, "startTime", v, s)} />
              </FieldRow>
            </div>
            <div className="flex-1">
              <FieldRow label="End">
                <InlineSelect value={r.endTime || ""} options={EXAM_TIMES}
                  onChange={v => updateRow(s.id, "endTime", v, s)} />
              </FieldRow>
            </div>
          </div>

          {/* Room */}
          <FieldRow label="Room" warn={roomBad}>
            {!r.date || !r.startTime ? (
              <span className="text-[10px] text-gray-300">Set date & time first</span>
            ) : ri?.fetching ? (
              <span className="text-[10px] text-gray-400 animate-pulse">Checking…</span>
            ) : (
              <div className="flex flex-col gap-1">
                {ri?.own_rooms?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ri.own_rooms.map(rm => (
                      <button key={rm} onClick={() => updateRow(s.id, "room", rm, s)}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-[6px] transition-all"
                        style={{
                          background: r.room === rm ? "#f97316" : "#EDE9E0",
                          color:      r.room === rm ? "#fff"     : "#374151",
                          boxShadow:  r.room === rm ? "none" : "1px 1px 3px #D4CFC7,-1px -1px 3px #fff",
                        }}>
                        {rm} <span className="opacity-50 text-[8px]">lecture room</span>
                      </button>
                    ))}
                  </div>
                )}
                <InlineSelect
                  value={ri?.own_rooms?.includes(r.room) ? "" : r.room || ""}
                  options={ri?.available?.filter(v => !ri?.own_rooms?.includes(v)) ?? semData?.venues ?? []}
                  placeholder={ri?.available ? `${ri.available.length} free rooms` : "— pick room —"}
                  onChange={v => updateRow(s.id, "room", v, s)}
                />
                {roomBad && <p className="text-[9px] text-[#f97316]">{r.room} is occupied at this time</p>}
                {ri?.available && <p className="text-[9px] text-gray-400">{ri.available.length + (ri.own_rooms?.length ?? 0)} free · {ri.occupied.length} in use</p>}
              </div>
            )}
          </FieldRow>

          {/* Invigilator */}
          <FieldRow label="Invigilator">
            <InlineSelect value={r.invigilator || ""} options={semData?.faculty ?? []}
              onChange={v => updateRow(s.id, "invigilator", v, s)} />
          </FieldRow>

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header bar ── */}
      <div className="rounded-[20px] overflow-hidden" style={{ boxShadow: neuRaised }}>
        <div className="h-1" style={{ background: "linear-gradient(90deg,#f97316,#fb923c)" }} />
        <div className="px-6 py-4 flex items-center justify-between gap-6" style={{ background: "#F6F2EA" }}>
          <div className="flex-1">
            <p className="font-sans text-[10px] font-semibold tracking-widest uppercase text-[#f97316] mb-0.5">
              Mid Term Examination Builder · {programme}
            </p>
            <p className="font-heading font-bold text-[1.3rem] text-gray-900">
              {selectedSem
                ? `Semester ${selectedSem} — ${filledCount}/${total} scheduled`
                : "Choose a semester to begin"}
            </p>
          </div>

          {/* Midterm window — university-wide dates */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-semibold text-gray-400 tracking-widest uppercase">Midterm From</span>
              <div className="px-3 py-1.5 rounded-[10px] text-[12px]"
                style={{ background: "#EDE9E0", boxShadow: "inset 2px 2px 5px #D4CFC7,inset -2px -2px 5px #fff" }}>
                <input type="text" value={windowStart}
                  onChange={e => setWindowStart(e.target.value)}
                  onFocus={e => { e.target.type = "date"; }}
                  onBlur={e => { if (!e.target.value) e.target.type = "text"; }}
                  placeholder="Start date"
                  className="bg-transparent text-[12px] text-gray-700 focus:outline-none w-28 placeholder:text-gray-300" />
              </div>
            </div>
            <span className="text-gray-300 text-[12px] mt-4">–</span>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-semibold text-gray-400 tracking-widest uppercase">Midterm To</span>
              <div className="px-3 py-1.5 rounded-[10px] text-[12px]"
                style={{ background: "#EDE9E0", boxShadow: "inset 2px 2px 5px #D4CFC7,inset -2px -2px 5px #fff" }}>
                <input type="text" value={windowEnd}
                  onChange={e => setWindowEnd(e.target.value)}
                  onFocus={e => { e.target.type = "date"; }}
                  onBlur={e => { if (!e.target.value) e.target.type = "text"; }}
                  placeholder="End date"
                  className="bg-transparent text-[12px] text-gray-700 focus:outline-none w-28 placeholder:text-gray-300" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedSem && total > 0 && (
              <>
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="19" fill="none" stroke="#E8E3DA" strokeWidth="5" />
                    <circle cx="24" cy="24" r="19" fill="none" stroke="#f97316" strokeWidth="5"
                      strokeDasharray={`${2*Math.PI*19}`}
                      strokeDashoffset={`${2*Math.PI*19*(1-pct/100)}`}
                      strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.4s" }} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-bold text-[11px] text-gray-800">{pct}%</span>
                </div>
                <button onClick={autoSchedule}
                  disabled={!windowStart || !windowEnd}
                  title={!windowStart || !windowEnd ? "Set midterm window first" : "Auto-fill all exam slots within the window"}
                  className="px-4 py-2 rounded-[12px] text-[12px] font-semibold transition-all"
                  style={{
                    background: windowStart && windowEnd ? "#EDE9E0" : "#EDE9E0",
                    color:      windowStart && windowEnd ? "#374151"  : "#C4C0BB",
                    boxShadow:  windowStart && windowEnd ? neuRaised  : "none",
                    cursor:     windowStart && windowEnd ? "pointer"  : "not-allowed",
                  }}>
                  Auto-Schedule
                </button>
                <button onClick={handleExport} disabled={filledCount === 0}
                  className="px-4 py-2 rounded-[12px] text-[12px] font-semibold text-white"
                  style={{ background: filledCount > 0 ? "#f97316" : "#D1D5DB", cursor: filledCount > 0 ? "pointer" : "not-allowed" }}>
                  Export PDF
                </button>
              </>
            )}
          </div>
        </div>
        {selectedSem && <div className="h-0.5 bg-[#E8E3DA]"><div className="h-0.5 bg-[#f97316] transition-all duration-500" style={{ width:`${pct}%` }} /></div>}
      </div>

      {/* ── Semester selector ── */}
      <div className="flex gap-3">
        {availableSemesters.map(sem => {
          const active = selectedSem === sem;
          return (
            <button key={sem} onClick={() => loadSemester(sem)}
              className="flex-1 rounded-[16px] py-4 flex flex-col items-center gap-1 transition-all duration-200"
              style={active
                ? { background:"#f97316", boxShadow:"4px 4px 12px #d4600a,-2px -2px 8px #ffb380", color:"#fff" }
                : { background:"#F6F2EA", boxShadow: neuRaised, color:"#374151" }}>
              <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: active ? "rgba(255,255,255,0.7)" : "#9CA3AF" }}>Sem</span>
              <span className="font-heading font-bold text-[1.6rem] leading-none">{sem}</span>
              {active && semData && <span className="text-[9px]" style={{ color:"rgba(255,255,255,0.8)" }}>{total} subjects</span>}
            </button>
          );
        })}
      </div>

      {/* ── Loading ── */}
      {loading && <div className="flex justify-center py-12"><Loader /></div>}

      {/* ── Empty state ── */}
      {!selectedSem && !loading && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 rounded-[20px]"
          style={{ background:"#F6F2EA", boxShadow:"inset 4px 4px 12px #D4CFC7,inset -4px -4px 12px #fff" }}>
          <p className="font-heading font-semibold text-gray-400 text-[15px]">Select a semester above</p>
          <p className="font-sans text-[12px] text-gray-300 text-center max-w-xs">
            Exam slots will auto-fill from the regular lecture timetable. You can tweak any field.
          </p>
        </div>
      )}

      {/* ── Card grid ── */}
      {semData && !loading && (
        <>
          {conflicts.size > 0 && (
            <div className="rounded-[14px] px-4 py-3" style={{ background:"#F6F2EA", boxShadow: neuRaised }}>
              <p className="text-[12px] font-semibold text-[#f97316]">
                {conflicts.size} Core subject{conflicts.size !== 1 ? "s" : ""} have overlapping exam times — review cards marked "Time clash"
              </p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            {semData.subjects.map((s, i) => <SubjectCard key={s.id} s={s} idx={i} />)}
          </div>
          <div className="flex justify-end">
            <button onClick={handleExport} disabled={filledCount === 0}
              className="px-6 py-2.5 rounded-[14px] text-[13px] font-semibold text-white"
              style={{ background: filledCount > 0 ? "#f97316" : "#D1D5DB", cursor: filledCount > 0 ? "pointer" : "not-allowed" }}>
              Export PDF ({filledCount}/{total})
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── home ───────────────────────────────────────────────────────── */

export default function Home({ user, onLogout }) {
  const [data, setData]   = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab]     = useState("dashboard");

  const navRef      = useRef(null);
  const dateRef     = useRef(null);
  const greetRef    = useRef(null);
  const subtitleRef = useRef(null);
  const kpisRef     = useRef(null);
  const animatedRef = useRef(false);

  /* fetch from Supabase via backend */
  useEffect(() => {
    if (!user) return;
    const endpoint = endpointForRole(user.role);
    if (!endpoint) {
      setError("No dashboard available for your role.");
      setReady(true);
      return;
    }

    fetch(endpoint, { headers: authHeader() })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(live => { setData(live); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setReady(true));
  }, [user]);

  /* GSAP entrance — fires once after data is ready */
  useEffect(() => {
    if (!ready || !data || animatedRef.current) return;
    animatedRef.current = true;
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .fromTo(navRef.current,      { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
      .fromTo(dateRef.current,     { y: 20,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2")
      .fromTo(greetRef.current,    { y: 30,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.3")
      .fromTo(subtitleRef.current, { y: 15,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.3")
      .fromTo(kpisRef.current?.children ?? [],
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0,  opacity: 1, scale: 1, duration: 0.5, stagger: 0.08 }, "-=0.2");
  }, [ready, data]);

  if (!user || !ready) {
    return (
      <div className="min-h-screen bg-[#F6F2EA] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F6F2EA] flex flex-col">
        <div ref={navRef}><Navbar user={user} onLogout={onLogout} roleLabel={user.role} /></div>
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-gray-500 font-sans text-sm">Could not load dashboard</p>
          <p className="text-red-400 font-mono text-xs">{error}</p>
          <button
            onClick={() => { setReady(false); setError(null); }}
            className="mt-2 px-4 py-2 bg-[#f97316] text-white rounded-xl text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const name               = nameFromEmail(user.email);
  const roleIsDean         = isDean(user.role);
  const roleIsChair        = isChairperson(user.role);
  const showMidTermTab     = roleIsChair;

  // For dean: teaching payload lives in data.my_teaching
  // For chair: personal teaching is in data.my_teaching too
  const teachingData = (roleIsDean || roleIsChair) ? data.my_teaching : data;

  return (
    <div className="min-h-screen bg-[#F6F2EA] flex flex-col">

      <div ref={navRef} className="relative z-50">
        <Navbar user={user} onLogout={onLogout} roleLabel={user.role} />
      </div>

      <div className="px-10 mt-14 pb-16 flex flex-col gap-6">

        {/* Greeting */}
        <div>
          <p ref={dateRef} className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-3">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p ref={greetRef} className="font-heading text-[2.8rem] font-bold text-gray-900 leading-none mb-1">
            {greet()}, {user.title ? `${user.title} ${name.split(" ")[0]}` : name.split(" ")[0]}
          </p>
          <p ref={subtitleRef} className="font-sans text-[15px] font-medium text-gray-400">
            {subtitleForRole(user.role, user.chaired_programme)}
          </p>
        </div>

        {/* Tab switcher — Programme Chairpersons only */}
        {showMidTermTab && (
          <TabSwitcher
            active={tab}
            onChange={setTab}
            tabs={[
              { id: "dashboard",   label: "My Teaching" },
              { id: "programme",   label: `${user.chaired_programme || "Programme"} Overview` },
              { id: "midterm",     label: "Build Mid Term Timetable" },
            ]}
          />
        )}

        {/* ── My Teaching tab (all roles) ── */}
        {tab === "dashboard" && (
          <>
            {roleIsDean && <DeanKPIs data={data} kpisRef={kpisRef} />}

            {(() => {
              const td = (roleIsDean || roleIsChair) ? data.my_teaching : data;
              if (!td) return null;
              return (
                <>
                  {(roleIsDean || roleIsChair) && td.total_subjects > 0 && (
                    <p className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-400 -mb-2">
                      My Teaching Load
                    </p>
                  )}
                  <FacultyKPIs data={td} kpisRef={(!roleIsDean && !roleIsChair) ? kpisRef : undefined} />
                  <SubjectList subjects={td.subject_details} />
                </>
              );
            })()}
          </>
        )}

        {/* ── Programme Overview tab (chairperson only) ── */}
        {tab === "programme" && roleIsChair && <ProgrammeOverview data={data} />}

        {/* ── Mid Term Timetable tab ── */}
        {tab === "midterm" && (
          <MidTermBuilder
            programme={user.chaired_programme}
            availableSemesters={data?.available_semesters ?? []}
          />
        )}

      </div>
    </div>
  );
}
