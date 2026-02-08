// app/(auth)/register/page.tsx
/**
 * Registration page for new users.
 * Displays the RegisterForm component to handle account creation.
 * Integrates into the application's authentication flow.
 */

import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return <RegisterForm />;
}