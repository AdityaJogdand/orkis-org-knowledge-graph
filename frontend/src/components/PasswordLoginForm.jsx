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
      const res = await fetch("/api/auth/login/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid credentials");

      localStorage.setItem("orkis_token", data.token);
      onSuccess?.(data.user);
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
        className="w-full px-4 py-3 border border-[rgba(255,109,41,0.2)] rounded-xl bg-[rgba(255,109,41,0.08)] placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(255,109,41,0.3)] focus:border-transparent transition"
      />

      <input
        type="password"
        name="password"
        required
        placeholder="Password*"
        value={formData.password}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-[rgba(255,109,41,0.2)] rounded-xl bg-[rgba(255,109,41,0.08)] placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(255,109,41,0.3)] focus:border-transparent transition"
      />

      <div className="flex justify-end text-sm">
        <a href="#" className="text-orkis-600 hover:underline italic">
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orkis-metallic bg-sheen-size hover:animate-sheen text-white py-3 rounded-xl font-medium text-sm hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}