import orkisLogo from "../assets/orkis-orange.png";

const ROLE_LABELS = {
  associate_dean: "Associate Dean",
  programme_chair: "Programme Chairperson",
  faculty: "Faculty",
  student: "Student",
};

const ROLE_COLOR = {
  associate_dean: "bg-purple-100 text-purple-700",
  programme_chair: "bg-blue-100 text-blue-700",
  faculty: "bg-green-100 text-green-700",
  student: "bg-orange-100 text-orange-700",
};

export default function Home({ user, onLogout }) {
  const handleLogout = () => {
    localStorage.removeItem("orkis_token");
    localStorage.removeItem("orkis_refresh");
    onLogout?.();
  };

  return (
    <div className="min-h-screen bg-[#F6F2EA] font-sans">

      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <img src={orkisLogo} alt="Orkis" className="h-8 w-auto" />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-lg border border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white transition font-medium"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* Welcome */}
        <div className="mb-10">
          <p className="text-sm text-gray-400 uppercase tracking-widest font-medium mb-1">Welcome back</p>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            {user?.full_name || "User"}
          </h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {user?.roles?.map((r) => (
              <span
                key={r}
                className={`text-xs font-semibold px-3 py-1 rounded-full ${ROLE_COLOR[r] || "bg-gray-100 text-gray-600"}`}
              >
                {ROLE_LABELS[r] || r}
              </span>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {[
            { label: "Knowledge Graph", desc: "Explore institutional connections", icon: "🕸️", soon: false },
            { label: "Smart Query", desc: "Ask anything about your institution", icon: "🔍", soon: false },
            { label: "Cognitive Load", desc: "Adaptive information delivery", icon: "🧠", soon: true },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#f97316]/30 transition cursor-pointer relative"
            >
              {card.soon && (
                <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-[#f97316] rounded-full border border-orange-100">
                  Soon
                </span>
              )}
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-semibold text-gray-800 text-sm">{card.label}</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Full name</span>
              <span className="text-gray-800 font-medium">{user?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="text-gray-800 font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Role</span>
              <span className="text-gray-800 font-medium">
                {user?.roles?.map((r) => ROLE_LABELS[r] || r).join(", ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
