import StatCard from "./StatCard";

export default function DeanKPIs({ data, kpisRef }) {
  return (
    <div ref={kpisRef} className="grid grid-cols-5 gap-4">
      <StatCard label="Total Faculty" value={data.total_faculty} caption="Distinct across all programmes" />
      <StatCard
        label="Subjects Covered"
        percent={data.subjects_covered_pct}
        value={`${data.unassigned_subjects} unassigned`}
        caption="Share of subjects with a faculty match"
        accent
      />
      <StatCard label="Active Programmes" value={data.active_programmes} caption="MBA Tech · B.Tech CE · AI&DS" />
      <StatCard label="Pending Approvals" value={data.pending_approvals} caption="Leave requests awaiting sign-off" accent />
      <StatCard label="Unassigned Subjects" value={data.unassigned_subjects} caption="Subjects with no faculty matched" />
    </div>
  );
}