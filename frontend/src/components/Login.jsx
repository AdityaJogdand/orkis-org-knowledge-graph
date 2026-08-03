import { useState } from "react";
import OrkisLogo from "./OrkisLogo";
import RoleSidebar from "./RoleSidebar";
import PasswordLoginForm from "./PasswordLoginForm";
import OtpLoginForm from "./OtpLoginForm";
import MemoryGraphBackground from "./MemoryGraphBackground";
import CursorGrid from "./CursorGrid";

export default function Login({ onLoginSuccess }) {
  const [role, setRole] = useState("student");
  const [mode, setMode] = useState("password");

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream-100">

      {/* Cursor grid */}
      <div className="absolute inset-0 -z-10">
        <CursorGrid
          className="w-full h-full"
          cellSize={60}
          color="#F97316"
          radius={160}
          falloff="smooth"
          holdTime={500}
          fadeDuration={900}
          lineWidth={1}
          maxOpacity={0.85}
          fillOpacity={0}
          gridOpacity={0.07}
          cellRadius={0}
          clickPulse
          pulseSpeed={550}
        />
      </div>

      {/* Logo */}
      <div className="flex items-center px-8 py-6">
        <OrkisLogo />
      </div>

      {/* Decorative Background */}
      {/* <MemoryGraphBackground className="absolute -top-4 right-0 w-72 h-64 opacity-70 animate-drift hidden md:block" /> */}
      {/* <MemoryGraphBackground className="absolute bottom-0 -left-10 w-64 h-56 opacity-50 animate-drift hidden lg:block" /> */}

      {/* Main Content */}
      <div className="flex flex-col items-center px-4 pt-6 pb-20">
        <div className="text-center mb-8 animate-fadeUp">
          <h1 className="font-heading text-4xl font-700 tracking-tight text-orkis-dark flex items-center justify-center gap-3">
            Sign in to
            <img src="/src/assets/orkis-orange.png" alt="Orkis" className="h-9 w-auto inline-block" />
          </h1>
          <p className="font-heading text-sm font-medium text-gray-400 mt-2 tracking-widest uppercase">Your institution, connected.</p>
        </div>

        <div className="relative w-full max-w-xl animate-fadeUp">
          <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[28px] border-2 border-orkis-400/40"></div>

          <div className="relative rounded-[28px] p-[1px] bg-[linear-gradient(135deg,#FF6D29_0%,#453027_45%,#161316_100%)] shadow-[0_16px_60px_rgba(31,27,23,0.14)]">
            <div className="rounded-[28px] bg-white/95 border border-cream-200/80 p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row">
                {/* Sidebar */}
                <RoleSidebar role={role} setRole={setRole} />

                {/* Login Area */}
                <div className="flex-1 sm:pl-6">
                  {/* Toggle */}
                  <div className="flex bg-orange-50 border border-orange-100 rounded-lg p-1 mb-5 max-w-xs">
                    <button
                      type="button"
                      onClick={() => setMode("password")}
                      className={`flex-1 py-1.5 text-sm rounded-md transition ${
                        mode === "password"
                          ? "bg-[#f97316] shadow-sm text-white font-semibold"
                          : "text-gray-400 hover:text-[#f97316] font-medium"
                      }`}
                    >
                      Password
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("otp")}
                      className={`flex-1 py-1.5 text-sm rounded-md transition ${
                        mode === "otp"
                          ? "bg-[#f97316] shadow-sm text-white font-semibold"
                          : "text-gray-400 hover:text-[#f97316] font-medium"
                      }`}
                    >
                      OTP
                    </button>
                  </div>

                  {/* Forms — fixed height so card doesn't resize on mode switch */}
                  <div className="min-h-[260px]">
                    {mode === "password" ? (
                      <PasswordLoginForm
                        role={role}
                        onSuccess={onLoginSuccess}
                      />
                    ) : (
                      <OtpLoginForm
                        role={role}
                        onSuccess={onLoginSuccess}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          New to <span className="italic">Orkis</span>?{" "}
          <a
            href="#"
            className="text-orkis-600 hover:text-orkis-700 hover:underline"
          >
            Contact your institution admin
          </a>
        </p>
      </div>
    </div>
  );
}