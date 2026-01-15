// src/components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "@/actions/auth";
import ValidatedInput from "@/components/ui/ValidatedInput";
import { emailSchema, loginSchema, validateForm } from "@/utils/validation";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (value: string) => {
    const result = emailSchema.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrors({});

    // Validate form
    const validation = validateForm(loginSchema, formData);

    if (!validation.success) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append("email", formData.email);
    formDataObj.append("password", formData.password);

    const result = await signIn(formDataObj);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h1>
        <p className="text-slate-600 dark:text-gray-400 text-sm">Sign in to your account</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-start gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <ValidatedInput
          label="Email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          onValidate={validateEmail}
          error={errors.email}
        />

        {/* Password */}
        <ValidatedInput
          label="Password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          showSuccess={false}
        />

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <a
            href="/auth/forgot-password"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
          >
            Forgot password?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-lg hover:shadow-blue-500/20"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="mt-6 text-center text-sm text-slate-600 dark:text-gray-400">
        Don't have an account?{" "}
        <a
          href="/auth/register"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition"
        >
          Sign up
        </a>
      </div>

      {/* 🔙 Back to Home */}
      <div className="mt-4 text-center">
        <a
          href="/"
          className="inline-block px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700
                    text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:border-blue-500
                    transition"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}