// src/components/auth/PasswordStrengthIndicator.tsx
"use client";

import { calculatePasswordStrength } from "@/utils/validation";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const { strength, score, feedback } = calculatePasswordStrength(password);

  const colors = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-blue-500",
    "very-strong": "bg-green-500",
  };

  const textColors = {
    weak: "text-red-400",
    medium: "text-yellow-400",
    strong: "text-blue-400",
    "very-strong": "text-green-400",
  };

  const labels = {
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
    "very-strong": "Very Strong",
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Progress Bar */}
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[strength]} transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Strength Label */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${textColors[strength]}`}>
          {labels[strength]}
        </span>
        <span className="text-gray-500 text-xs">{score}%</span>
      </div>

      {/* Feedback (if not very strong) */}
      {strength !== "very-strong" && feedback.length > 0 && (
        <ul className="text-xs text-gray-400 space-y-1 mt-2">
          {feedback.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-gray-600">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}