"use client";

import { useState } from "react";
import { signUp } from "@/actions/auth";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "instructor">("student");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // אם הצליח, redirect קורה אוטומטית
  }

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400 text-sm">Join DeepReview today</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            required
            placeholder="John Doe"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 ring-blue-500 outline-none transition"
          />
        </div>

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
            minLength={6}
            placeholder="••••••••"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 ring-blue-500 outline-none transition"
          />
          <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole("student")}
              className={`p-4 rounded-xl border-2 transition ${
                selectedRole === "student"
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-slate-700 bg-slate-800 text-gray-400 hover:border-slate-600"
              }`}
            >
              <div className="text-2xl mb-1">🎓</div>
              <div className="font-bold text-sm">Student</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("instructor")}
              className={`p-4 rounded-xl border-2 transition ${
                selectedRole === "instructor"
                  ? "border-purple-500 bg-purple-500/10 text-purple-400"
                  : "border-slate-700 bg-slate-800 text-gray-400 hover:border-slate-600"
              }`}
            >
              <div className="text-2xl mb-1">👨‍🏫</div>
              <div className="font-bold text-sm">Instructor</div>
            </button>
          </div>
          <input type="hidden" name="role" value={selectedRole} />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-lg"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <a href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
          Sign in
        </a>
      </div>
    </div>
  );
}