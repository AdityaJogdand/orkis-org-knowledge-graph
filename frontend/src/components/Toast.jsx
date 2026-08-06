import { useEffect } from "react";

export default function Toast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 flex items-center bg-red-50 border border-red-200 text-red-900 px-5 py-4 rounded-2xl shadow-lg animate-[toastIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
      <p className="text-sm font-semibold text-red-800 whitespace-nowrap">
        Login failed — {message}
      </p>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
