const ROLES = [
  { id: "student", label: "Student" },
  { id: "faculty", label: "Faculty / Staff" },
  { id: "admin", label: "Admin" },
  { id: "management", label: "Management" },
];

export default function RoleSidebar({ role, setRole }) {
  return (
    <div className="w-full sm:w-40 shrink-0 border-b sm:border-b-0 sm:border-r border-cream-200 pb-4 sm:pb-0 sm:pr-5 mb-5 sm:mb-0">
      <div className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
        {ROLES.map((r) => {
          const active = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`relative text-left whitespace-nowrap px-3 py-2 rounded-lg text-sm transition-all duration-200
                ${
                  active
                    ? "italic font-semibold text-orkis-dark bg-orkis-50"
                    : "font-medium text-gray-400 hover:text-orkis-dark"
                }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-orkis-metallic" />
              )}
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}