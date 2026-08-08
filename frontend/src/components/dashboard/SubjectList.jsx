import { cardStyle } from "../../utils/theme";
import CategoryBadge from "./CategoryBadge";

export default function SubjectList({ subjects }) {
  if (!subjects?.length) return null;
  return (
    <div className="rounded-2xl p-6" style={cardStyle}>
      <p className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-stone-400 mb-4">
        My Subjects — {subjects.length} assignment{subjects.length !== 1 ? "s" : ""}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="text-left pb-2 font-semibold text-stone-500 pr-4">Subject</th>
              <th className="text-left pb-2 font-semibold text-stone-500 pr-4">Programme</th>
              <th className="text-left pb-2 font-semibold text-stone-500 pr-4">Sem</th>
              <th className="text-left pb-2 font-semibold text-stone-500 pr-4">Div</th>
              <th className="text-left pb-2 font-semibold text-stone-500">Category</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => (
              <tr key={i} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                <td className="py-2.5 pr-4 font-medium text-stone-800">
                  {s.name}
                  {s.code && <span className="ml-1.5 text-[10px] text-stone-400 font-mono">({s.code})</span>}
                </td>
                <td className="py-2.5 pr-4 text-stone-500">{s.programme}</td>
                <td className="py-2.5 pr-4 text-stone-500">Sem {s.semester}</td>
                <td className="py-2.5 pr-4 text-stone-500">{s.division ?? "—"}</td>
                <td className="py-2.5"><CategoryBadge category={s.category} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}