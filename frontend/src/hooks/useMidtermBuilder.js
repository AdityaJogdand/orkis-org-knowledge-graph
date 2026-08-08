import { useRef, useState } from "react";
import { authHeader } from "../utils/dashboardHelpers";
import { dayFromDate, getLecturesByDay, nextOccurrenceOf } from "../utils/dateHelpers";
import { autoScheduleRows, exportMidTermHTML, getConflicts } from "../utils/midtermLogic";

export function useMidTermBuilder(programme) {
  const [selectedSem, setSelectedSem] = useState(null);
  const [semData, setSemData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState({});
  const [roomInfo, setRoomInfo] = useState({});
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");

  const roomCache = useRef(new Map());
  const debounceRef = useRef({});

  function loadSemester(sem) {
    setSelectedSem(sem);
    setSemData(null);
    setRows({});
    setRoomInfo({});
    roomCache.current.clear();
    setLoading(true);
    fetch(`/dashboard/chair/midterm-data/${sem}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        setSemData(d);
        const TYPE_ORDER = { Lecture: 0, Tutorial: 1, Practical: 2 };
        const init = {};
        d.subjects.forEach(s => {
          const dayBestSlot = {};
          for (const sl of (s.lecture_slots || [])) {
            if (!dayBestSlot[sl.day]) dayBestSlot[sl.day] = sl;
          }
          const bestSlot = Object.values(dayBestSlot)
            .sort((a, b) => (TYPE_ORDER[a.type] ?? 3) - (TYPE_ORDER[b.type] ?? 3))[0];
          const room = bestSlot?.room && bestSlot.room !== "—" ? bestSlot.room : "";
          init[s.id] = {
            date: bestSlot ? nextOccurrenceOf(bestSlot.day) : "",
            startTime: bestSlot?.start || "",
            endTime: bestSlot?.end || "",
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
    const cacheKey = `${id}|${day}|${start}|${end}`;
    if (roomCache.current.has(cacheKey)) {
      setRoomInfo(prev => ({ ...prev, [id]: { ...roomCache.current.get(cacheKey), fetching: false } }));
      return;
    }
    setRoomInfo(prev => ({ ...prev, [id]: { available: [], occupied: [], own_rooms: [], fetching: true } }));
    fetch(`/dashboard/chair/available-rooms?day=${day}&start=${start}&end=${end}&exclude_subject_id=${id}`, { headers: authHeader() })
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

  /** Called when the user clicks a lecture-day chip — fills date/time then fetches rooms immediately. */
  function handleSlotClick(id, day, slot) {
    const date = nextOccurrenceOf(day);
    const startTime = slot.start;
    const endTime = slot.end;

    setRows(prev => ({ ...prev, [id]: { ...prev[id], date, startTime, endTime, room: "" } }));

    const cacheKey = `${day}|${startTime}|${endTime}`;
    if (roomCache.current.has(cacheKey)) {
      setRoomInfo(prev => ({ ...prev, [id]: { ...roomCache.current.get(cacheKey), fetching: false } }));
      return;
    }
    setRoomInfo(prev => ({ ...prev, [id]: { available: [], occupied: [], own_rooms: [], fetching: true } }));
    fetch(`/dashboard/chair/available-rooms?day=${day}&start=${startTime}&end=${endTime}&exclude_subject_id=${id}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        const result = { available: d.available, occupied: d.occupied, own_rooms: d.own_rooms ?? [], fetching: false };
        roomCache.current.set(cacheKey, result);
        setRoomInfo(prev => ({ ...prev, [id]: result }));
        if (d.own_rooms?.length) {
          setRows(prev => ({ ...prev, [id]: { ...prev[id], room: d.own_rooms[0] } }));
        } else if (d.available.length === 1) {
          setRows(prev => ({ ...prev, [id]: { ...prev[id], room: d.available[0] } }));
        }
      })
      .catch(() => setRoomInfo(prev => ({ ...prev, [id]: { available: [], occupied: [], own_rooms: [], fetching: false } })));
  }

  function updateRow(id, field, val, subject) {
    setRows(prev => {
      const next = { ...prev, [id]: { ...prev[id], [field]: val } };
      const r = next[id];

      if (field === "date") {
        const day = dayFromDate(val);
        next[id].room = "";
        if (day && subject) {
          const byDay = getLecturesByDay(subject.lecture_slots || []);
          const daySlot = byDay[day]?.[0];
          if (daySlot) {
            next[id].startTime = daySlot.start;
            next[id].endTime = daySlot.end;
          }
        }
        scheduleRoomFetch(id, day, next[id].startTime, next[id].endTime);
      }

      if (field === "startTime" || field === "endTime") {
        next[id].room = "";
        scheduleRoomFetch(id, dayFromDate(r.date), next[id].startTime, next[id].endTime);
      }

      return next;
    });
  }

  function autoSchedule() {
    setRows(prev => autoScheduleRows({ windowStart, windowEnd, semData, rows: prev }));
    setRoomInfo({});
    roomCache.current.clear();
  }

  function handleExport() {
    exportMidTermHTML({ programme, selectedSem, semData, rows, windowStart, windowEnd });
  }

  const filledCount = Object.values(rows).filter(r => r.date && r.room).length;
  const total = semData?.subjects?.length ?? 0;
  const pct = total ? Math.round((filledCount / total) * 100) : 0;
  const conflicts = semData ? getConflicts(rows, semData.subjects) : new Set();

  return {
    selectedSem, semData, loading, rows, roomInfo,
    windowStart, setWindowStart, windowEnd, setWindowEnd,
    loadSemester, handleSlotClick, updateRow, autoSchedule, handleExport,
    filledCount, total, pct, conflicts,
  };
}