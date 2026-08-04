import { useState } from "react";
import OtpInput from "./OtpInput";
import useCountdown from "../hooks/useCountdown";

const OTP_TTL_SECONDS = 10 * 60;

export default function OtpLoginForm({ role, onSuccess }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("request");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { formatted, start, isActive } = useCountdown();

  const requestOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not send OTP");
      setStage("verify");
      start(OTP_TTL_SECONDS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      let data;
      try { data = await res.json(); }
      catch { throw new Error("Server unreachable. Is the backend running?"); }

      if (!res.ok) throw new Error(data.detail || "Invalid or expired code");

      localStorage.setItem("orkis_token", data.access_token);
      localStorage.setItem("orkis_refresh", data.refresh_token);

      const meRes = await fetch("/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const user = await meRes.json();
      onSuccess?.(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (stage === "request") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          requestOtp();
        }}
        className="space-y-4 animate-fadeUp"
      >
        {error && (
          <div className="rounded-lg bg-red-50 text-red-600 text-sm px-4 py-2 border border-red-200">
            {error}
          </div>
        )}

        <input
          type="email"
          required
          placeholder="College email address*"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-[#f97316] rounded-xl bg-white placeholder:text-gray-400 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 focus:border-[#f97316] transition"
        />

        <div className="rounded-xl ring-2 ring-[#f97316]">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white py-3 rounded-xl font-medium text-sm active:scale-[0.99] transition disabled:opacity-50"
          >
            {loading ? "Sending code..." : "Send OTP to email"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={verifyOtp} className="space-y-4 animate-fadeUp">
      {error && (
        <div className="rounded-lg bg-red-50 text-red-600 text-sm px-4 py-2 border border-red-200">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-500">
        Code sent to <span className="text-orkis-dark font-medium not-italic">{email}</span>
      </p>

      <OtpInput value={otp} onChange={setOtp} length={6} />

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {isActive ? `Expires in ${formatted}` : "Code expired"}
        </span>
        <button
          type="button"
          onClick={requestOtp}
          disabled={isActive || loading}
          className="text-orkis-600 font-medium italic hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
        >
          Resend
        </button>
      </div>

      <div className="rounded-xl ring-2 ring-[#f97316]">
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white py-3 rounded-xl font-medium text-sm active:scale-[0.99] transition disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify & Sign In"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setStage("request");
          setOtp("");
        }}
        className="w-full text-center text-sm text-gray-400 hover:text-orkis-dark"
      >
        ← Use a different email
      </button>
    </form>
  );
}