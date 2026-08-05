import { useState } from "react";
import OrkisLogo from "./OrkisLogo";
// import RoleSidebar from "./RoleSidebar";
import PasswordLoginForm from "./PasswordLoginForm";
import OtpLoginForm from "./OtpLoginForm";
// import DotSphere from "./DotSphere";
import GradualBlur from "./GradualBlur";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";



export default function Login({ onLoginSuccess }) {
  const [role, setRole] = useState("student");
  const [mode, setMode] = useState("password");

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

        {/* Glassy Neumorphic Login Card - Reduced Max Width to max-w-md */}
        <div className="relative w-full max-w-md animate-[pushUp_1.8s_cubic-bezier(0.16,1,0.3,1)_forwards] flex flex-col items-center">
          {/* Animated Flowing Gradient Outer Border Frame */}
          <div className="relative p-[1.5px] rounded-[34px] overflow-hidden shadow-[-14px_-14px_30px_rgba(255,255,255,0.9),_14px_14px_30px_rgba(195,183,170,0.45)]">

            {/* Inner Glassy Card Content - Increased Min-Height and Padding */}
            <div className="relative flex flex-col justify-between rounded-[32px] bg-[#F4EFEA]/85 backdrop-blur-xl p-8 sm
         -:p-12 min-h-[480px]"> 
              <div className="text-center mb-6 animate-fadeUp">
                <h1 className="font-heading text-3xl font-bold tracking-tight text-orkis-dark flex items-center justify-center gap-2.5">
                  Sign in to Orkis
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
                          role={role}
                          onSuccess={onLoginSuccess}
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
                          role={role}
                          onSuccess={onLoginSuccess}
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