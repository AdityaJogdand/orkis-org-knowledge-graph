import { COLORS } from "../../utils/theme";

export default function TabSwitcher({ active, onChange, tabs }) {
  return (
    <div className="inline-flex rounded-2xl p-1 gap-1" style={{ background: "#EFEBE2" }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="px-5 py-2 rounded-xl text-[13px] font-semibold font-heading transition-all duration-200"
          style={
            active === t.id
              ? { background: COLORS.ink, color: "#fff" }
              : { background: "transparent", color: COLORS.muted }
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}