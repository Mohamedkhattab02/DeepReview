
// src/actions/instructor.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// Get all students with their progress
export async function getAllStudents() {
  const supabase = await createClient();
  
  const { data: students, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      created_at,
      student_progress (
        final_average_score,
        comprehension_score,
        critical_thinking_score,
        quality_score
      )
    `)
    .eq("role", "student")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching students:", error);
    return [];
  }

  return students.map((student: any) => ({
    id: student.id,
    email: student.email,
    full_name: student.full_name,
    created_at: student.created_at,
    totalSessions: student.student_progress?.length || 0,
    averageScore: student.student_progress?.length > 0
      ? Math.round(
          student.student_progress.reduce(
            (sum: number, p: any) => sum + (p.final_average_score || 0),
            0
          ) / student.student_progress.length
        )
      : 0,
  }));
}

// Get single student detailed progress
export async function getStudentProgress(studentId: string) {
  const supabase = await createClient();

  const { data: progress, error } = await supabase
    .from("student_progress")
    .select(`
      *,
      articles (
        id,
        title,
        authors
      ),
      socratic_messages (
        created_at
      )
    `)
    .eq("user_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching student progress:", error);
    return [];
  }

  return progress.map((p: any) => ({
    ...p,
    question_scores: JSON.parse(p.question_scores || "[]"),
    difficulty_path: JSON.parse(p.difficulty_path || "[]"),
    strengths: JSON.parse(p.strengths || "[]"),
    weaknesses: JSON.parse(p.weaknesses || "[]"),
    recommendations: JSON.parse(p.recommendations || "[]"),
  }));
}

// Get instructor statistics
export async function getInstructorStats() {
  const supabase = await createClient();

  const [studentsResult, articlesResult, sessionsResult, progressResult] =
    await Promise.all([
      supabase.from("users").select("id", { count: "exact" }).eq("role", "student"),
      supabase.from("articles").select("id", { count: "exact" }),
      supabase.from("socratic_messages").select("id", { count: "exact" }).eq("is_completed", true),
      supabase.from("student_progress").select("final_average_score"),
    ]);

  const totalStudents = studentsResult.count || 0;
  const totalArticles = articlesResult.count || 0;
  const completedSessions = sessionsResult.count || 0;

  const scores = progressResult.data?.map((p: any) => p.final_average_score).filter((s: number) => s > 0) || [];
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
    : 0;

  return {
    totalStudents,
    totalArticles,
    completedSessions,
    averageScore,
  };
}

// Get all articles with upload info
export async function getAllArticles() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      user_id,
      title,
      authors,
      uploaded_at,
      analysis_completed,
      users (
        full_name,
        email
      )
    `)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("Error fetching articles:", error);
    return [];
  }

  return (data ?? []).map((a: any) => ({
    ...a,
    authors: a.authors ?? [],   // ✅ מונע null -> slice/some crash
    users: a.users ?? null,     // ✅ בטוח גם אם אין קשר
  }));
}


// Delete article (instructor only)
export async function deleteArticleAsInstructor(articleId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", articleId);

  if (error) {
    console.error("Error deleting article:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/instructor/articles");
  return { success: true };
}

// Get analytics data for charts
export async function getAnalyticsData() {
  const supabase = await createClient();

  // Progress over time
  const { data: progressOverTime } = await supabase
    .from("student_progress")
    .select("created_at, final_average_score")
    .order("created_at", { ascending: true });

  // Score distribution
  const { data: scoreDistribution } = await supabase
    .from("student_progress")
    .select("final_average_score");

  // Top performing students
  const { data: topStudents } = await supabase
    .from("student_progress")
    .select(`
      user_id,
      final_average_score,
      users (
        full_name
      )
    `)
    .order("final_average_score", { ascending: false })
    .limit(5);

  return {
    progressOverTime: progressOverTime || [],
    scoreDistribution: scoreDistribution || [],
    topStudents: topStudents || [],
  };
}