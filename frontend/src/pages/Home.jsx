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

function endpointForRole(role) {
  if (!role) return null;
  const r = role.toLowerCase();
  if (r.includes("dean"))      return "/dashboard/dean";
  if (r.includes("professor") || r.includes("faculty")) return "/dashboard/faculty";
  return null;
}

/* ── mock fallbacks ─────────────────────────────────────────────── */

const MOCK_DEAN = {
  total_faculty: 28,
  subjects_covered_pct: 84,
  active_programmes: 3,
  pending_approvals: 3,
  unassigned_subjects: 7,
};

const MOCK_FACULTY = {
  total_subjects: 5,
  weekly_hours: 15,
  divisions_count: 2,
  divisions: ["A", "B"],
  programmes_count: 2,
  programmes: ["B.Tech CE", "B.Tech AI&DS"],
  semesters: [3, 5],
  core_subjects: 4,
  elective_subjects: 1,
  faculty_type: "Core",
  student_count: 300,
  leave_balance: 12,
  next_class: {
    subject: "Machine Learning",
    room: "Lab 302",
    time: "2:00 PM",
    division: "B",
    programme: "B.Tech AI&DS",
  },
};

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

/* ── role KPI rows ──────────────────────────────────────────────── */

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

function NextClassKPI({ next_class }) {
  if (!next_class) {
    return (
      <div
        className="flex-1 rounded-[22px] p-6 flex flex-col gap-3"
        style={{ background: "#F6F2EA", boxShadow: neuRaised }}
      >
        <div className="w-8 h-[3px] rounded-full bg-[#C8C3BB]" />
        <p className="font-heading text-[13px] font-semibold text-gray-600">Next Class</p>
        <p className="font-heading font-bold text-[1.6rem] text-gray-400">No class today</p>
      </div>
    );
  }
  return (
    <div
      className="flex-1 rounded-[22px] p-6 flex flex-col gap-2"
      style={{ background: "#F6F2EA", boxShadow: neuRaised }}
    >
      <div className="w-8 h-[3px] rounded-full bg-[#f97316]" />
      <p className="font-heading text-[13px] font-semibold text-gray-600">Next Class</p>
      <p className="font-heading font-bold leading-tight tracking-tight text-[#f97316]"
        style={{ fontSize: "1.6rem" }}>
        {next_class.time}
      </p>
      <p className="font-heading font-semibold text-[14px] text-gray-800 leading-snug">
        {next_class.subject}
      </p>
      <p className="text-[11px] text-gray-400 font-sans">
        {next_class.room} · Div {next_class.division} · {next_class.programme}
      </p>
    </div>
  );
}

function FacultyKPIs({ data, kpisRef }) {
  const internalRef = useRef(null);
  const ref = kpisRef ?? internalRef;
  return (
    <div ref={ref} className="flex gap-4">
      <NextClassKPI next_class={data.next_class} />
      <KPI label="My Subjects"       value={data.total_subjects}              caption={`${data.core_subjects} core · ${data.elective_subjects} elective`} />
      <KPI label="Weekly Hours"      value={`${data.weekly_hours}h`}          caption="Estimated lecture load this week" accent />
      <KPI label="Semesters Active"  value={data.semesters?.length ?? "—"}    caption={data.semesters?.map(s => `Sem ${s}`).join(" · ") || "—"} />
      <KPI label="Leave Balance"     value={`${data.leave_balance}d`}         caption="Days remaining this academic year" accent />
    </div>
  );
}

/* ── subtitle text per role ─────────────────────────────────────── */

function isFaculty(role = "") { return role.toLowerCase().includes("professor") || role.toLowerCase().includes("faculty"); }
function isDean(role = "")    { return role.toLowerCase().includes("dean"); }

function subtitleForRole(role) {
  if (isDean(role))    return "Here's your institute today.";
  if (isFaculty(role)) return "Here's your teaching load today.";
  return "Welcome to Orkis.";
}

/* ── home ───────────────────────────────────────────────────────── */

export default function Home({ user, onLogout }) {
  const [data, setData]     = useState(null);
  const [ready, setReady]   = useState(false);
  const [source, setSource] = useState(null);

  const navRef      = useRef(null);
  const dateRef     = useRef(null);
  const greetRef    = useRef(null);
  const subtitleRef = useRef(null);
  const kpisRef     = useRef(null);

  /* fetch */
  useEffect(() => {
    if (!user) return;

    const endpoint = endpointForRole(user.role);
    const fallback = isFaculty(user.role) ? MOCK_FACULTY : MOCK_DEAN;

    if (!endpoint) {
      setData(fallback);
      setSource("mock");
      setReady(true);
      return;
    }

    fetch(endpoint, { headers: authHeader() })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(live => { setData(live); setSource("live"); })
      .catch(() => { setData(fallback); setSource("mock"); })
      .finally(() => setReady(true));
  }, [user]);

  /* GSAP — fires after data is ready */
  useEffect(() => {
    if (!ready) return;

    gsap.timeline({ defaults: { ease: "power3.out" } })
      .fromTo(navRef.current,      { y: -60, opacity: 0 },             { y: 0, opacity: 1, duration: 0.7 })
      .fromTo(dateRef.current,     { y: 20,  opacity: 0 },             { y: 0, opacity: 1, duration: 0.5 }, "-=0.2")
      .fromTo(greetRef.current,    { y: 30,  opacity: 0 },             { y: 0, opacity: 1, duration: 0.6 }, "-=0.3")
      .fromTo(subtitleRef.current, { y: 15,  opacity: 0 },             { y: 0, opacity: 1, duration: 0.4 }, "-=0.3")
      .fromTo(kpisRef.current.children,
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0,  opacity: 1, scale: 1, duration: 0.5, stagger: 0.08 }, "-=0.2");
  }, [ready]);

  if (!user || !ready) {
    return (
      <div className="min-h-screen bg-[#F6F2EA] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const name = nameFromEmail(user.email);

  return (
    <div className="min-h-screen bg-[#F6F2EA] flex flex-col">

      <div ref={navRef} className="relative z-50">
        <Navbar user={user} onLogout={onLogout} roleLabel={user.role} />
      </div>

      <div className="px-10 mt-14 flex flex-col gap-6">

        {/* Greeting */}
        <div>
          <p ref={dateRef} className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-3">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p ref={greetRef} className="font-heading text-[2.8rem] font-bold text-gray-900 leading-none mb-1">
            {greet()}, {name.split(" ")[0]}
          </p>
          <p ref={subtitleRef} className="font-sans text-[15px] font-medium text-gray-400 flex items-center gap-2">
            {subtitleForRole(user.role)}
            {source === "mock" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-semibold">
                demo data
              </span>
            )}
          </p>
        </div>

        {/* Role-specific KPIs */}
        {isFaculty(user.role)
          ? <FacultyKPIs data={data} kpisRef={kpisRef} />
          : <>
              <DeanKPIs data={data} kpisRef={kpisRef} />
              {data.my_teaching?.total_subjects > 0 && (
                <div>
                  <p className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-400 mb-3">
                    My Teaching Load
                  </p>
                  <FacultyKPIs data={data.my_teaching} />
                </div>
              )}
            </>
        }

      </div>
    </div>
  );
}
