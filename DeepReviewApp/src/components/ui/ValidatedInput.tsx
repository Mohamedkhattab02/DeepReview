// src/components/ui/ValidatedInput.tsx
"use client";

import { useState, InputHTMLAttributes } from "react";

interface ValidatedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  name: string;
  error?: string;
  showSuccess?: boolean;
  onValidate?: (value: string) => string | null; // Real-time validation
}

export default function ValidatedInput({
  label,
  name,
  error,
  showSuccess = true,
  onValidate,
  onChange,
  ...props
}: ValidatedInputProps) {
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const displayError = error || localError;
  const showValidIcon = touched && !displayError && showSuccess && props.value;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (onValidate) {
      const validationError = onValidate(e.target.value);
      setLocalError(validationError);
      setIsValid(!validationError && !!e.target.value);
    }
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (touched && onValidate) {
      const validationError = onValidate(e.target.value);
      setLocalError(validationError);
      setIsValid(!validationError && !!e.target.value);
    }
    onChange?.(e);
  };

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={name}
          name={name}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full bg-slate-800 border rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 outline-none transition
            ${
              displayError
                ? "border-red-500 ring-2 ring-red-500/20"
                : isValid
                ? "border-green-500 ring-2 ring-green-500/20"
                : "border-slate-700 focus:ring-2 focus:ring-blue-500/50"
            }`}
        />

        {/* Success/Error Icon */}
        {showValidIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}

        {displayError && touched && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Error Message */}
      {displayError && touched && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <span>⚠</span> {displayError}
        </p>
      )}
    </div>
  );
}