import { useState } from "react";

export default function PasswordLoginForm({ role, onSuccess }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      let data;
      try { data = await res.json(); }
      catch { throw new Error("Server unreachable. Is the backend running?"); }

      if (!res.ok) throw new Error(data.detail || "Invalid credentials");

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fadeUp">
      {error && (
        <div className="rounded-lg bg-red-50 text-red-600 text-sm px-4 py-2 border border-red-200">
          {error}
        </div>
      )}

      <input
        type="email"
        name="email"
        required
        placeholder="Email address*"
        value={formData.email}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-[#f97316] rounded-xl bg-white placeholder:text-gray-400 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 focus:border-[#f97316] transition"
      />

      <input
        type="password"
        name="password"
        required
        placeholder="Password*"
        value={formData.password}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-[#f97316] rounded-xl bg-white placeholder:text-gray-400 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 focus:border-[#f97316] transition"
      />

      <div className="flex justify-end text-sm">
        <a href="#" className="text-orkis-600 hover:underline italic">
          Forgot password?
        </a>
      </div>

      <div className="rounded-xl ring-2 ring-[#f97316]">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white py-3 rounded-xl font-medium text-sm active:scale-[0.99] transition disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    </form>
  );
}