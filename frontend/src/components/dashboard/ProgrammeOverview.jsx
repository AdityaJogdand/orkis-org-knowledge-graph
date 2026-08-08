import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY_SHORT,
  categoryStyle,
} from "../../utils/theme";

import CategoryBadge from "./CategoryBadge";
import StatCard from "./StatCard";

/* =========================================================
   FACULTY CELL
========================================================= */

function FacultyCell({ faculty = [] }) {
  const uniqueFaculty = [
    ...new Map(
      faculty
        .filter((item) => item?.name)
        .map((item) => [item.name, item])
    ).values(),
  ];

  if (uniqueFaculty.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 font-sans text-[13px] font-medium text-red-500">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Unassigned
      </span>
    );
  }

  const visibleFaculty = uniqueFaculty.slice(0, 2);
  const remaining = uniqueFaculty.length - 2;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleFaculty.map((person, index) => {
        const visiting = person.type === "Visiting";

        return (
          <span
            key={`${person.name}-${index}`}
            title={`${person.name}${
              person.type ? ` · ${person.type}` : ""
            }`}
            className={`
              inline-flex
              items-center
              gap-1.5
              max-w-[210px]
              px-2.5
              py-1
              rounded-md
              border
              whitespace-nowrap
              font-sans
              text-[12px]
              font-medium
              ${
                visiting
                  ? "bg-amber-50 border-amber-100 text-amber-700"
                  : "bg-blue-50 border-blue-100 text-blue-700"
              }
            `}
          >
            <span
              className={`w-1 h-1 rounded-full shrink-0 ${
                visiting
                  ? "bg-amber-400"
                  : "bg-blue-400"
              }`}
            />

            <span className="truncate">
              {person.name}
            </span>
          </span>
        );
      })}

      {remaining > 0 && (
        <span
          title={uniqueFaculty
            .slice(2)
            .map((person) => person.name)
            .join(", ")}
          className="
            inline-flex
            items-center
            px-2
            py-1
            rounded-md
            bg-stone-100
            font-sans
            text-[11px]
            font-semibold
            text-stone-500
          "
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}

/* =========================================================
   SEMESTER SIDEBAR ITEM
========================================================= */

function SemesterItem({
  semester,
  subjects = [],
  active,
  onClick,
}) {
  const assigned = subjects.filter(
    (subject) => subject.faculty?.length > 0
  ).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full
        text-left
        rounded-xl
        px-3
        py-3
        transition-all
        duration-150
        ${
          active
            ? "bg-white text-black"
            : "text-white/55 hover:bg-white/[0.055] hover:text-white"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            w-8
            h-8
            rounded-lg
            flex
            items-center
            justify-center
            shrink-0
            ${
              active
                ? "bg-black text-white"
                : "bg-white/[0.06] text-white/55"
            }
          `}
        >
          <span className="font-heading text-[13px] font-semibold">
            {semester}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`
              font-sans
              text-[13px]
              font-semibold
              ${
                active
                  ? "text-black"
                  : "text-white/75"
              }
            `}
          >
            Semester {semester}
          </p>

          <p
            className={`
              font-sans
              text-[11px]
              mt-1
              ${
                active
                  ? "text-black/40"
                  : "text-white/30"
              }
            `}
          >
            {subjects.length} subjects
            <span className="mx-1">·</span>
            {assigned} assigned
          </p>
        </div>

        {active && (
          <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
        )}
      </div>
    </button>
  );
}

/* =========================================================
   SEMESTER HEADER
========================================================= */

function SemesterHeader({
  semester,
  subjects = [],
}) {
  const assigned = subjects.filter(
    (subject) => subject.faculty?.length > 0
  ).length;

  const open = subjects.length - assigned;

  const categories = {};

  subjects.forEach((subject) => {
    const category = subject.category || "Other";

    categories[category] =
      (categories[category] || 0) + 1;
  });

  const categoryEntries = Object.entries(
    categories
  ).sort((a, b) => b[1] - a[1]);

  return (
    <header className="shrink-0 px-5 md:px-6 pt-5 pb-4 bg-white border-b border-stone-200">
      <div className="flex items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-sans text-[11px] uppercase tracking-[0.16em] font-semibold text-stone-400">
              Curriculum
            </span>

            <span className="text-stone-300 text-[12px]">
              /
            </span>

            <span className="font-sans text-[11px] text-stone-400">
              Semester {semester}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h2 className="font-heading font-semibold text-[22px] leading-none tracking-[-0.02em] text-stone-900">
              Semester {semester}
            </h2>

            <span className="font-sans text-[13px] text-stone-400">
              {subjects.length} subjects
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto scrollbar-none">
            {categoryEntries.map(
              ([category, count]) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-full bg-stone-100"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background:
                        categoryStyle(category).chart,
                    }}
                  />

                  <span className="font-sans text-[11px] text-stone-500">
                    {CATEGORY_SHORT[category] ??
                      category}
                  </span>

                  <span className="font-sans text-[11px] font-semibold text-stone-700">
                    {count}
                  </span>
                </span>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
            <p className="font-sans text-[10px] uppercase tracking-[0.12em] font-semibold text-emerald-500">
              Assigned
            </p>

            <p className="font-heading text-[20px] leading-none font-semibold text-emerald-700 mt-1">
              {assigned}
            </p>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
            <p className="font-sans text-[10px] uppercase tracking-[0.12em] font-semibold text-red-400">
              Open
            </p>

            <p className="font-heading text-[20px] leading-none font-semibold text-red-600 mt-1">
              {open}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   CURRICULUM TABLE
========================================================= */

function CurriculumTable({
  subjects = [],
  totalSubjects = 0,
  searchQuery = "",
}) {
  return (
    <div className="flex-1 min-h-0 overflow-auto px-5 md:px-6 pb-5 scrollbar-thin">
      {subjects.length > 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full border-collapse table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#F1F0ED] border-b border-stone-200">
                <th className="w-[52px] px-4 py-3 text-left">
                  <span className="font-sans text-[11px] uppercase tracking-[0.14em] font-semibold text-stone-400">
                    #
                  </span>
                </th>

                <th className="w-[42%] px-3 py-3 text-left">
                  <span className="font-sans text-[11px] uppercase tracking-[0.14em] font-semibold text-stone-400">
                    Subject
                  </span>
                </th>

                <th className="w-[17%] px-3 py-3 text-left">
                  <span className="font-sans text-[11px] uppercase tracking-[0.14em] font-semibold text-stone-400">
                    Category
                  </span>
                </th>

                <th className="px-3 py-3 text-left">
                  <span className="font-sans text-[11px] uppercase tracking-[0.14em] font-semibold text-stone-400">
                    Faculty
                  </span>
                </th>
              </tr>
            </thead>

            <tbody>
              {subjects.map((subject, index) => (
                <tr
                  key={
                    subject.code ||
                    `${subject.name}-${index}`
                  }
                  className="
                    group
                    border-b
                    border-stone-100
                    last:border-0
                    hover:bg-[#FAFAF7]
                    transition-colors
                  "
                >
                  <td className="px-4 py-3 align-middle">
                    <span className="font-mono text-[12px] text-stone-400 tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </td>

                  <td className="px-3 py-3 align-middle">
                    <div className="min-w-0 pr-4">
                      <p className="font-sans text-[14px] font-medium text-stone-800 leading-snug">
                        {subject.name}
                      </p>

                      {subject.code && (
                        <p className="font-mono text-[11px] tracking-wide text-stone-400 mt-1">
                          {subject.code}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3 align-middle">
                    <CategoryBadge
                      category={subject.category}
                    />
                  </td>

                  <td className="px-3 py-3 align-middle">
                    <FacultyCell
                      faculty={subject.faculty}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="h-8 px-4 bg-[#FAFAF9] border-t border-stone-100 flex items-center justify-between">
            <span className="font-sans text-[11px] text-stone-400">
              {searchQuery
                ? `Showing ${subjects.length} matching subjects`
                : `Showing ${subjects.length} of ${totalSubjects} subjects`}
            </span>

            {searchQuery && (
              <span className="font-sans text-[11px] text-stone-400">
                Filter: "{searchQuery}"
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="h-full min-h-[220px] rounded-2xl border border-dashed border-stone-200 bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-9 h-9 rounded-full bg-stone-100 mx-auto flex items-center justify-center mb-3">
              <svg
                className="w-4 h-4 text-stone-400"
                viewBox="0 0 20 20"
                fill="none"
              >
                <circle
                  cx="8.5"
                  cy="8.5"
                  r="5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />

                <path
                  d="M13 13L17 17"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <p className="font-sans text-[14px] font-medium text-stone-600">
              No subjects found
            </p>

            <p className="font-sans text-[12px] text-stone-400 mt-1">
              Try another subject, code or faculty name.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PROGRAMME OVERVIEW
========================================================= */

export default function ProgrammeOverview({
  data,
}) {
  const containerRef = useRef(null);

  const [visible, setVisible] = useState(false);
  const [selectedSemester, setSelectedSemester] =
    useState(null);
  const [searchQuery, setSearchQuery] =
    useState("");

  const semesters = data?.semesters ?? [];

  const totalSubjects =
    data?.total_subjects ?? 0;

  const assignedSubjects =
    data?.assigned_subjects ?? 0;

  const unassignedSubjects =
    data?.unassigned_subjects ?? 0;

  const coverage = totalSubjects
    ? Math.round(
        (assignedSubjects / totalSubjects) * 100
      )
    : 0;

  /* -------------------------------------------------------
     Scroll entrance
  ------------------------------------------------------- */

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  /* -------------------------------------------------------
     Default semester
  ------------------------------------------------------- */

  useEffect(() => {
    if (
      selectedSemester === null &&
      semesters.length > 0
    ) {
      setSelectedSemester(
        semesters[0].semester
      );
    }
  }, [
    semesters,
    selectedSemester,
  ]);

  /* -------------------------------------------------------
     Active semester
  ------------------------------------------------------- */

  const activeSemester = semesters.find(
    (item) =>
      item.semester === selectedSemester
  );

  const subjects =
    activeSemester?.subjects ?? [];

  /* -------------------------------------------------------
     Search
  ------------------------------------------------------- */

  const filteredSubjects = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) return subjects;

    return subjects.filter((subject) => {
      const subjectMatch =
        subject.name
          ?.toLowerCase()
          .includes(query) ||
        subject.code
          ?.toLowerCase()
          .includes(query) ||
        subject.category
          ?.toLowerCase()
          .includes(query);

      const facultyMatch =
        subject.faculty?.some(
          (faculty) =>
            faculty?.name
              ?.toLowerCase()
              .includes(query)
        );

      return (
        subjectMatch || facultyMatch
      );
    });
  }, [
    subjects,
    searchQuery,
  ]);

  if (!data) return null;

  return (
    <section
      ref={containerRef}
      className="w-full py-6"
    >
      {/* =================================================
          BLACK MODAL
      ================================================= */}

      <div
        className={`
          mx-auto
          w-full
          max-w-[1500px]

          h-[90vh]
          min-h-[700px]
          max-h-[1100px]

          rounded-[30px]
          overflow-hidden

          bg-[#080808]
          border
          border-white/[0.09]

          shadow-[0_40px_120px_rgba(0,0,0,0.30)]

          flex
          flex-col

          transition-all
          duration-700
          ease-[cubic-bezier(0.22,1,0.36,1)]

          ${
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-24 opacity-0"
          }
        `}
      >
        {/* =================================================
            TOP HEADER
        ================================================= */}

        <header className="shrink-0 px-6 md:px-9 py-5 border-b border-white/[0.07]">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />

                <span className="font-sans text-[11px] uppercase tracking-[0.18em] font-semibold text-white/35">
                  Programme Overview
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <h1 className="font-heading font-semibold text-[25px] md:text-[29px] leading-none tracking-[-0.025em] text-white">
                  Curriculum Structure
                </h1>

                <span className="hidden sm:block font-sans text-[13px] text-white/25">
                  B.Tech AI&DS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <StatCard
                compact
                label="Subjects"
                value={totalSubjects}
                dark
              />

              <StatCard
                compact
                label="Semesters"
                value={semesters.length}
                dark
              />

              <StatCard
                compact
                label="Coverage"
                value={`${coverage}%`}
                accent
                dark
              />
            </div>
          </div>
        </header>

        {/* =================================================
            MAIN
        ================================================= */}

        <div className="flex flex-1 min-h-0">
          {/* =================================================
              DESKTOP SIDEBAR
          ================================================= */}

          <aside className="hidden md:flex w-[230px] shrink-0 bg-[#0B0B0B] border-r border-white/[0.07] flex-col">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <span className="font-sans text-[11px] uppercase tracking-[0.16em] font-semibold text-white/30">
                Semesters
              </span>

              <span className="font-sans text-[11px] text-white/20">
                {semesters.length}
              </span>
            </div>

            <div className="px-2.5 space-y-1">
              {semesters.map(
                ({
                  semester,
                  subjects,
                }) => (
                  <SemesterItem
                    key={semester}
                    semester={semester}
                    subjects={subjects}
                    active={
                      selectedSemester ===
                      semester
                    }
                    onClick={() => {
                      setSelectedSemester(
                        semester
                      );
                      setSearchQuery("");
                    }}
                  />
                )
              )}
            </div>

            <div className="mt-auto px-5 py-4 border-t border-white/[0.06]">
              <p className="font-sans text-[11px] leading-relaxed text-white/20">
                Select a semester to inspect
                subjects and faculty assignments.
              </p>
            </div>
          </aside>

          {/* =================================================
              RIGHT DATA VIEWER
          ================================================= */}

          <main className="flex-1 min-w-0 min-h-0 bg-[#111111] p-2.5 md:p-3">
            <div className="h-full min-h-0 rounded-[22px] overflow-hidden bg-[#FAFAF8] flex flex-col">
              {/* Mobile semesters */}
              <div className="md:hidden shrink-0 bg-[#0B0B0B] p-2.5 border-b border-white/[0.07]">
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                  {semesters.map((item) => {
                    const active =
                      selectedSemester ===
                      item.semester;

                    return (
                      <button
                        key={item.semester}
                        type="button"
                        onClick={() => {
                          setSelectedSemester(
                            item.semester
                          );
                          setSearchQuery("");
                        }}
                        className={`
                          shrink-0
                          px-3.5
                          py-2
                          rounded-lg
                          font-sans
                          text-[12px]
                          font-semibold
                          ${
                            active
                              ? "bg-white text-black"
                              : "bg-white/[0.06] text-white/45"
                          }
                        `}
                      >
                        Sem {item.semester}

                        <span className="ml-1.5 opacity-50">
                          {item.subjects?.length ??
                            0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeSemester ? (
                <>
                  {/* Semester heading */}
                  <SemesterHeader
                    semester={
                      activeSemester.semester
                    }
                    subjects={subjects}
                  />

                  {/* Search */}
                  <div className="shrink-0 px-5 md:px-6 py-3.5 bg-[#FAFAF8]">
                    <div className="relative">
                      <svg
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <circle
                          cx="8.5"
                          cy="8.5"
                          r="5.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                        />

                        <path
                          d="M13 13L17 17"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>

                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) =>
                          setSearchQuery(
                            event.target.value
                          )
                        }
                        placeholder="Search subject, code or faculty..."
                        className="
                          w-full
                          h-10
                          pl-10
                          pr-10
                          rounded-xl
                          bg-white
                          border
                          border-stone-200
                          font-sans
                          text-[13px]
                          text-stone-800
                          placeholder:text-stone-400
                          outline-none
                          focus:border-stone-300
                          focus:ring-4
                          focus:ring-black/[0.025]
                          transition-all
                        "
                      />

                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() =>
                            setSearchQuery("")
                          }
                          className="
                            absolute
                            right-3
                            top-1/2
                            -translate-y-1/2
                            w-5
                            h-5
                            rounded-full
                            flex
                            items-center
                            justify-center
                            text-stone-400
                            hover:text-stone-800
                            hover:bg-stone-100
                          "
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Data */}
                  <CurriculumTable
                    subjects={filteredSubjects}
                    totalSubjects={subjects.length}
                    searchQuery={searchQuery}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="font-sans text-[14px] text-stone-400">
                    Select a semester to view its
                    curriculum.
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="shrink-0 h-9 px-6 md:px-9 bg-[#080808] border-t border-white/[0.07] flex items-center justify-between">
          <span className="font-sans text-[12px] text-white/25">
            {totalSubjects} subjects ·{" "}
            {semesters.length} semesters
          </span>

          <span
            className={`font-sans text-[12px] font-medium ${
              unassignedSubjects > 0
                ? "text-orange-400"
                : "text-emerald-400"
            }`}
          >
            {unassignedSubjects > 0
              ? `${unassignedSubjects} unassigned`
              : "All subjects assigned"}
          </span>
        </footer>
      </div>
    </section>
  );
}