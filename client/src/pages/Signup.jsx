import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import AuthLayout, { inputClass, primaryButtonClass } from "../components/AuthLayout";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/signup", form);
      login(data.token, data.user);
      navigate(data.user.onboardingCompleted ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your space"
      subtitle="A calm, private place to check in with yourself."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-brand-700 font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
          <input id="name" type="text" name="name" value={form.name} onChange={handleChange} required autoComplete="name" placeholder="Your name" className={inputClass} />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" placeholder="you@example.com" className={inputClass} />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <input id="password" type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="new-password" placeholder="Min. 6 characters" className={inputClass} />
        </div>

        <button type="submit" disabled={loading} className={`${primaryButtonClass} mt-2`}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
