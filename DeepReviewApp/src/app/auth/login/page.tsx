// app/(auth)/login/page.tsx
/**
 * Login page for user authentication.
 * Renders the LoginForm component responsible for handling user sign-in.
 * Part of the protected auth flow in the application.
 */

import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}