import { useRef } from "react";
import NextClassCard from "./NextClassCard";
import StatCard from "./StatCard";

export default function FacultyKPIs({ data, kpisRef }) {
  const internalRef = useRef(null);
  const ref = kpisRef ?? internalRef;
  return (
    <div ref={ref} className="grid grid-cols-4 gap-4">
      <NextClassCard next_class={data.next_class} />
      <StatCard label="My Subjects" value={data.total_subjects} caption={`${data.core_subjects} core · ${data.elective_subjects} elective`} />
      <StatCard label="Weekly Hours" value={`${data.weekly_hours}h`} caption="Actual teaching load this week" accent />
      <StatCard
        label="Semesters Active"
        value={data.semesters?.length ?? "—"}
        caption={data.semesters?.map(s => `Sem ${s}`).join(" · ") || "—"}
      />
    </div>
  );
}