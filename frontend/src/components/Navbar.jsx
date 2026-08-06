import { useEffect, useRef, useState } from "react";
import whiteLogo from "../assets/white logo.png";

function nameFromEmail(email = "") {
  return email.split("@")[0].split(".")
    .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function initials(email = "") {
  return nameFromEmail(email).split(" ").map(n => n[0]).join("").slice(0, 2);
}

export default function Navbar({ user, onLogout, roleLabel }) {
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const name = nameFromEmail(user?.email);

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <header className="flex items-center justify-between px-10 py-4 bg-[#f97316] rounded-b-3xl">

      <img src={whiteLogo} alt="Orkis" className="h-7 w-auto" />

      {/* avatar + dropdown */}
      <div className="relative" ref={dropRef}>
        <button
          onClick={() => setDropOpen(o => !o)}
          className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-[13px] text-[#f97316] bg-white shrink-0 focus:outline-none hover:bg-orange-50 transition"
        >
          {initials(user?.email)}
        </button>

        {dropOpen && (
          <div className="absolute right-0 mt-2 w-48 z-50 bg-white shadow-lg rounded-2xl">
            <div className="px-4 pt-3 pb-2 border-b border-gray-100 rounded-t-2xl">
              <p className="font-heading font-semibold text-[12px] text-gray-800 leading-tight">{name}</p>
              {roleLabel && <p className="font-sans text-[10px] text-[#f97316] font-medium mt-0.5">{roleLabel}</p>}
              <p className="font-sans text-[10px] text-gray-400 mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={() => { setDropOpen(false); onLogout(); }}
              className="w-full text-left px-4 py-3 font-sans text-[12px] text-gray-500 hover:text-red-500 hover:bg-red-50 transition rounded-b-2xl"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

    </header>
  );
}
