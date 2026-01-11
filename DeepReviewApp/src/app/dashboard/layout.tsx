// app/(dashboard)/layout.tsx
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/shared/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}