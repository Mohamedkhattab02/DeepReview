// src/components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import { signUp } from "@/actions/auth";
import ValidatedInput from "@/components/ui/ValidatedInput";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";
import {
  emailSchema,
  fullNameSchema,
  passwordSchema,
  registerSchema,
  validateForm,
} from "@/utils/validation";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
    role: "student" as "student" | "instructor",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time validation functions
  const validateEmail = (value: string) => {
    const result = emailSchema.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  };

  const validateFullName = (value: string) => {
    const result = fullNameSchema.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  };

  const validatePassword = (value: string) => {
    const result = passwordSchema.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) return "Please confirm your password";
    if (value !== formData.password) return "Passwords don't match";
    return null;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrors({});

    // Full form validation
    const validation = validateForm(registerSchema, formData);

    if (!validation.success) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    // Create FormData for server action
    const formDataObj = new FormData();
    formDataObj.append("email", formData.email);
    formDataObj.append("password", formData.password);
    formDataObj.append("full_name", formData.full_name);
    formDataObj.append("role", formData.role);

    const result = await signUp(formDataObj);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If success, redirect happens automatically
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
        <ValidatedInput
          label="Full Name"
          name="full_name"
          type="text"
          required
          placeholder="John Doe"
          value={formData.full_name}
          onChange={handleChange}
          onValidate={validateFullName}
          error={errors.full_name}
        />

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
        <div>
          <ValidatedInput
            label="Password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            onValidate={validatePassword}
            error={errors.password}
            showSuccess={false} // Don't show checkmark for password
          />
          <PasswordStrengthIndicator password={formData.password} />
        </div>

        {/* Confirm Password */}
        <ValidatedInput
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          required
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          onValidate={validateConfirmPassword}
          error={errors.confirmPassword}
        />

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, role: "student" }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.role === "student"
                  ? "border-blue-500 bg-blue-500/10 text-white"
                  : "border-slate-700 bg-slate-800 text-gray-400 hover:border-slate-600"
              }`}
            >
              <div className="text-2xl mb-2">🎓</div>
              <div className="font-semibold">Student</div>
            </button>

            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, role: "instructor" }))
              }
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.role === "instructor"
                  ? "border-blue-500 bg-blue-500/10 text-white"
                  : "border-slate-700 bg-slate-800 text-gray-400 hover:border-slate-600"
              }`}
            >
              <div className="text-2xl mb-2">👨‍🏫</div>
              <div className="font-semibold">Instructor</div>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-lg"
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
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <a
          href="/auth/login"
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Sign in
        </a>
      </div>
    </div>
  );
}