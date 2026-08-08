export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DAY_SHORT = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat" };

export function dayFromDate(dateStr) {
  if (!dateStr) return null;
  return DAY_NAMES[new Date(dateStr + "T00:00").getDay()];
}

/** Returns YYYY-MM-DD of the next (or this) occurrence of dayName from today */
export function nextOccurrenceOf(dayName) {
  const target = DAY_NAMES.indexOf(dayName);
  if (target === -1) return "";
  const today = new Date();
  const todayIdx = today.getDay();
  let ahead = target - todayIdx;
  if (ahead <= 0) ahead += 7;
  const d = new Date(today);
  d.setDate(today.getDate() + ahead);
  return d.toISOString().split("T")[0];
}

/** { Monday: [{start,end,room}], ... } */
export function getLecturesByDay(lectureSlots) {
  const map = {};
  for (const sl of lectureSlots) {
    if (!map[sl.day]) map[sl.day] = [];
    map[sl.day].push(sl);
  }
  return map;
}

/** "valid" | "no-lecture" | "unknown" */
export function validateExamDay(subject, date) {
  if (!date) return "unknown";
  const day = dayFromDate(date);
  if (!day || day === "Sunday") return "no-lecture";
  if (!subject.lecture_slots?.length) return "unknown";
  const hasLecture = subject.lecture_slots.some(s => s.day === day);
  return hasLecture ? "valid" : "no-lecture";
}

export function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00");
  return dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}