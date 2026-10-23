import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import AuthLayout, { inputClass, primaryButtonClass } from "../components/AuthLayout";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/login", form);
      login(data.token, data.user);
      navigate(data.user.onboardingCompleted ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="It's good to see you again."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="text-brand-700 font-semibold hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" placeholder="you@example.com" className={inputClass} />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <input id="password" type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="current-password" placeholder="••••••••" className={inputClass} />
        </div>

        <button type="submit" disabled={loading} className={`${primaryButtonClass} mt-2`}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
