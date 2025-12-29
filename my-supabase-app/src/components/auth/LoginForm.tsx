// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "@/actions/auth";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // אם הצליח, redirect קורה אוטומטית
  }

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-400 text-sm">Sign in to your account</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 ring-blue-500 outline-none transition"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 ring-blue-500 outline-none transition"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-lg"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Register Link */}
      <div className="mt-6 text-center text-sm text-gray-400">
        Don't have an account?{" "}
        <a href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium">
          Sign up
        </a>
      </div>
    </div>
  );
}