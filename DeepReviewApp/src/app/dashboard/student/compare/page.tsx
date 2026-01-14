//compare/page.tsx
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ComparisonView from "@/components/student/ComparisonView";

export default async function ComparePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ✅ שליפת כל המאמרים המנותחים של המשתמש
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("user_id", user.id)
    .eq("analysis_completed", true)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ComparisonView articles={articles || []} />
    </div>
  );
}