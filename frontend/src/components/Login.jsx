import { useState } from "react";
import OrkisLogo from "./OrkisLogo";
import RoleSidebar from "./RoleSidebar";
import PasswordLoginForm from "./PasswordLoginForm";
import OtpLoginForm from "./OtpLoginForm";
import MemoryGraphBackground from "./MemoryGraphBackground";

export default function Login({ onLoginSuccess }) {
  const [role, setRole] = useState("student");
  const [mode, setMode] = useState("password");

  return (
    <div className="min-h-screen bg-cream-100 relative overflow-hidden">
      <div className="flex items-center px-8 py-6">
        <OrkisLogo />
      </div>

      <MemoryGraphBackground className="absolute -top-4 right-0 w-72 h-64 opacity-70 animate-drift hidden md:block" />
      <MemoryGraphBackground className="absolute bottom-0 -left-10 w-64 h-56 opacity-50 animate-drift hidden lg:block" />

      <div className="flex flex-col items-center px-4 pt-6 pb-20">
        <h1 className="font-display text-4xl text-orkis-dark mb-8 animate-fadeUp">
          <span className="font-medium">Sign in to</span>{" "}
          <span className="italic font-semibold text-orkis-600">Orkis</span>
        </h1>

        <div className="relative w-full max-w-xl animate-fadeUp">
          <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[28px] border-2 border-orkis-400/40" />
          <div className="relative bg-white border border-cream-200 rounded-[28px] shadow-[0_8px_30px_rgba(31,27,23,0.06)] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row">
              <RoleSidebar role={role} setRole={setRole} />

              <div className="flex-1 sm:pl-6">
                <div className="flex bg-cream-100 rounded-lg p-1 mb-5 max-w-xs">
                  <button
                    type="button"
                    onClick={() => setMode("password")}
                    className={`flex-1 py-1.5 text-sm rounded-md transition ${
                      mode === "password"
                        ? "bg-white shadow-sm text-orkis-dark font-semibold"
                        : "text-gray-400 hover:text-orkis-dark font-medium"
                    }`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("otp")}
                    className={`flex-1 py-1.5 text-sm rounded-md transition ${
                      mode === "otp"
                        ? "bg-white shadow-sm text-orkis-dark font-semibold"
                        : "text-gray-400 hover:text-orkis-dark font-medium"
                    }`}
                  >
                    OTP
                  </button>
                </div>

                {mode === "password" ? (
                  <PasswordLoginForm role={role} onSuccess={onLoginSuccess} />
                ) : (
                  <OtpLoginForm role={role} onSuccess={onLoginSuccess} />
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          New to <span className="italic">Orkis</span>?{" "}
          <a href="#" className="text-orkis-600 hover:underline">
            Contact your institution admin
          </a>
        </p>
      </div>
    </div>
  );
}