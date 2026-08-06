import { useState, useCallback } from "react";
import OrkisLogo from "./OrkisLogo";
import PasswordLoginForm from "./PasswordLoginForm";
import OtpLoginForm from "./OtpLoginForm";
import Toast from "./Toast";
import Loader from "./Loader";

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState("password");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const handleError = useCallback((msg) => { setLoading(false); setToast(msg); }, []);
  const dismissToast = useCallback(() => setToast(""), []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4EFEA]">
        <Loader />
        <p className="text-sm text-gray-400 mt-2 font-medium">Signing you in…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F4EFEA] flex flex-col">



      {/* Scaled Bottom Semi-Circle Dot Sphere */}
      <div className="absolute inset-x-0 -bottom-48 z-10 pointer-events-none flex justify-center">
        <div className="w-full max-w-7xl opacity-90">
          {/* <DotSphere /> */}
        </div>
      </div>

      {/* Top Logo Header */}
      <div className="relative z-20 flex items-center px-8 py-6">
        <OrkisLogo />
      </div>

      {/* Main Container */}
      <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">

        {/* Login Card */}
        <div className="relative w-[55vw] min-w-[520px] animate-[pushUp_1.8s_cubic-bezier(0.16,1,0.3,1)_forwards]">
          <Toast message={toast} onDismiss={dismissToast} />
          <div className="relative rounded-[44px] overflow-hidden shadow-[-14px_-14px_30px_rgba(255,255,255,0.9),_14px_14px_30px_rgba(195,183,170,0.45)] flex">

            {/* Orange patch — rounded rectangle with margin */}
            <div className="flex-shrink-0 flex items-center py-4 pl-3">
              <div className="w-80 h-full bg-[#f97316] rounded-[28px] relative overflow-hidden flex flex-col justify-between px-6 pt-8 pb-0">
                {/* Header */}
                <div>
                  <p className="text-white/70 text-xs font-semibold tracking-widest uppercase mb-2">Welcome to Orkis</p>
                  <h2 className="font-heading text-white text-2xl font-bold leading-snug">
                    Your institution,<br />connected.
                  </h2>
                </div>

                {/* SVG pushed to bottom */}
                <img
                  src="/src/assets/education.svg"
                  alt=""
                  className="w-full scale-135 object-contain object-bottom self-end"
                />
              </div>
            </div>

            {/* Card Content */}
            <div className="relative flex flex-col justify-between bg-[#F4EFEA] p-8 sm:p-12 min-h-[480px] flex-1">
              <div className="text-center mb-6 animate-fadeUp">
                <h1 className="font-heading text-3xl font-bold tracking-tight text-orkis-dark flex items-center justify-center gap-2.5">
                  Sign in to <span className="text-[#f97316]">Orkis</span>
                </h1>

                <p className="font-heading text-xs font-medium text-gray-500 mt-2 tracking-widest uppercase">
                  Your institution, connected.
                </p>
              </div>

              <div className="flex flex-col flex-1 justify-center">

                {/* Sidebar */}
                {/* <RoleSidebar role={role} setRole={setRole} /> */}

                {/* Login Content */}
                <div className="w-full">
                  <div className="min-h-[200px] flex flex-col mt-[-3rem] justify-center">
                    {mode === "password" ? (
                      <div>
                        <PasswordLoginForm
                          onSuccess={onLoginSuccess}
                          onError={handleError}
                          onLoading={setLoading}
                        />

                        {/* Forgot Password & Switch to OTP Links */}
                        <div className="flex items-center justify-between mt-6 text-xs sm:text-sm">
                          <button
                            type="button"
                            onClick={() => setMode("otp")}
                            className="text-[#f97316] font-medium hover:underline transition-all"
                          >
                            Login with OTP
                          </button>

                          <a
                            href="#"
                            className="text-orange-500 hover:text-gray-700 italic hover:underline transition-all"
                          >
                            Forgot password?
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <OtpLoginForm
                          onSuccess={onLoginSuccess}
                          onError={handleError}
                        />

                        {/* Switch Back to Password Link */}
                        <div className="flex items-center justify-start mt-6 text-xs sm:text-sm">
                          <button
                            type="button"
                            onClick={() => setMode("password")}
                            className="text-[#f97316] font-medium hover:underline transition-all"
                          >
                            Login with Password
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-4 relative z-30 animate-[pushUp_1.8s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0">
          New to <span className="italic">Orkis</span>?{" "}
          <a
            href="#"
            className="text-orkis-600 hover:text-orkis-700 hover:underline font-medium"
          >
            Contact your institution admin
          </a>
        </p>


      </div>


      {/* Keyframe Animations */}
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes pushUp {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

    </div>
  );
}