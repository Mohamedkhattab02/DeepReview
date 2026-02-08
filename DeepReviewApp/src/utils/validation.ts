// src/utils/validation.ts
/**
 * Validation utilities for authentication and user management.
 *
 * 1. Centralizes all form validation logic (login, register, profile) in one place.
 * 2. Uses Zod schemas to enforce strict, type-safe validation rules.
 * 3. Provides password strength evaluation for better UX feedback.
 * 4. Ensures consistent error messages across the application.
 * 5. Supports safe parsing with structured, field-level error reporting.
 * 6. Enables automatic TypeScript type inference from validation schemas.
 */

import { z } from "zod";

/**
 * Password Strength Calculator
 * מחשב רמת חוזק סיסמה: weak, medium, strong, very-strong
 */
export function calculatePasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong" | "very-strong";
  score: number; // 0-100
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add lowercase letters");
  }

  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add uppercase letters");
  }

  if (/[0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add numbers");
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add special characters (!@#$...)");
  }

  // Bonus: no common patterns
  const commonPatterns = ["123", "password", "qwerty", "abc"];
  const hasCommonPattern = commonPatterns.some((p) =>
    password.toLowerCase().includes(p)
  );
  if (!hasCommonPattern) {
    score += 10;
  } else {
    feedback.push("Avoid common patterns");
  }

  // Determine strength level
  let strength: "weak" | "medium" | "strong" | "very-strong";
  if (score < 40) strength = "weak";
  else if (score < 60) strength = "medium";
  else if (score < 80) strength = "strong";
  else strength = "very-strong";

  return { strength, score, feedback };
}

/**
 * Password Schema - חובה:
 * - לפחות 8 תווים
 * - אות גדולה אחת
 * - אות קטנה אחת
 * - מספר אחד
 * - תו מיוחד אחד
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

/**
 * Email Schema
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format")
  .toLowerCase();

/**
 * Full Name Schema
 */
export const fullNameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name is too long")
  .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces");

/**
 * Role Schema
 */
export const roleSchema = z.enum(
  ["student", "instructor"] as const,
  {
    message: "Please select a valid role",
  }
);


/**
 * Register Form Schema (Full)
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    full_name: fullNameSchema,
    role: roleSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Login Form Schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Type Inference
 */
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Safe Parse Helper - מחזיר errors מובנים
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  });

  return { success: false, errors };
}