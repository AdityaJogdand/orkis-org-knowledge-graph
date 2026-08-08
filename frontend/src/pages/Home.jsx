import { useState } from "react";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";
import { useDashboardData } from "../hooks/useDashboardData";
import { isDean, isChairperson, nameFromEmail, greet, subtitleForRole } from "../utils/dashboardHelpers";
import { COLORS } from "../utils/theme";

import DeanKPIs from "../components/dashboard/DeanKPIs";
import FacultyKPIs from "../components/dashboard/FacultyKPIs";
import SubjectList from "../components/dashboard/SubjectList";
import ProgrammeOverview from "../components/dashboard/ProgrammeOverview";
import TabSwitcher from "../components/dashboard/TabSwitcher";
import MidTermBuilder from "../components/midterm/MidTermBuilder";

export default function Home({ user, onLogout }) {
  const { data, ready, error, retry, refs } = useDashboardData(user);
  const [tab, setTab] = useState("dashboard");

  if (!user || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.bg }}>
        <Loader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: COLORS.bg }}>
        <div ref={refs.navRef}><Navbar user={user} onLogout={onLogout} roleLabel={user.role} /></div>
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-stone-500 font-sans text-sm">Could not load dashboard</p>
          <p className="text-rose-400 font-mono text-xs">{error}</p>
          <button
            onClick={retry}
            className="mt-2 px-4 py-2 text-white rounded-xl text-sm font-medium"
            style={{ background: COLORS.accent }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const name = nameFromEmail(user.email);
  const roleIsDean = isDean(user.role);
  const roleIsChair = isChairperson(user.role);
  const showMidTermTab = roleIsChair;
  const teachingData = (roleIsDean || roleIsChair) ? data.my_teaching : data;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: COLORS.bg }}>
      <div ref={refs.navRef} className="relative z-50">
        <Navbar user={user} onLogout={onLogout} roleLabel={user.role} />
      </div>

      <div className="px-10 mt-14 pb-16 flex flex-col gap-6">
        {/* Greeting */}
        <div>
          <p ref={refs.dateRef} className="font-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-stone-400 mb-3">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p ref={refs.greetRef} className="font-heading text-[2.8rem] font-bold text-stone-900 leading-none mb-1">
            {greet()}, {user.title ? `${user.title} ${name.split(" ")[0]}` : name.split(" ")[0]}
          </p>
          <p ref={refs.subtitleRef} className="font-sans text-[15px] font-medium text-stone-400">
            {subtitleForRole(user.role, user.chaired_programme)}
          </p>
        </div>

        {showMidTermTab && (
          <TabSwitcher
            active={tab}
            onChange={setTab}
            tabs={[
              { id: "dashboard", label: "My Teaching" },
              { id: "programme", label: `${user.chaired_programme || "Programme"} Overview` },
              { id: "midterm", label: "Build Mid Term Timetable" },
            ]}
          />
        )}

        {tab === "dashboard" && (
          <>
            {roleIsDean && <DeanKPIs data={data} kpisRef={refs.kpisRef} />}

            {teachingData && (
              <>
                {(roleIsDean || roleIsChair) && teachingData.total_subjects > 0 && (
                  <p className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-stone-400 -mb-2">
                    My Teaching Load
                  </p>
                )}
                <FacultyKPIs data={teachingData} kpisRef={(!roleIsDean && !roleIsChair) ? refs.kpisRef : undefined} />
                <SubjectList subjects={teachingData.subject_details} />
              </>
            )}
          </>
        )}

        {tab === "programme" && roleIsChair && <ProgrammeOverview data={data} />}

        {tab === "midterm" && (
          <MidTermBuilder programme={user.chaired_programme} availableSemesters={data?.available_semesters ?? []} />
        )}
      </div>
    </div>
  );
}