import { useEffect } from "react";

export default function Toast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 flex items-start gap-3 bg-red-50 border border-red-200 text-red-900 px-5 py-4 rounded-2xl shadow-lg animate-[toastIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
      {/* Red dot */}
      <span className="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full bg-red-400" />
      <div>
        <p className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-0.5">Login failed</p>
        <p className="text-sm text-red-800 whitespace-nowrap">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-3 text-red-300 hover:text-red-600 text-lg leading-none"
      >
        ×
      </button>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
