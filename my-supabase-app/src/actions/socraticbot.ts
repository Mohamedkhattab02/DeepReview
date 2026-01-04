// src/actions/socraticbot.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { SocraticMessage, StudentProgress } from "@/types/socraticMessage";
import { revalidatePath } from "next/cache";

// קבלת סשן סוקרטי נוכחי או יצירת חדש
export async function getSocraticSession(
  articleId: string
): Promise<SocraticMessage | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // חיפוש סשן פעיל (לא הושלם)
  const { data, error } = await supabase
    .from("socratic_messages")
    .select("*")
    .eq("article_id", articleId)
    .eq("user_id", user.id)
    .eq("is_completed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching socratic session:", error);
    return null;
  }

  return data as SocraticMessage | null;
}

// יצירת סשן סוקרטי חדש
export async function createSocraticSession(
  articleId: string
): Promise<SocraticMessage | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("socratic_messages")
    .insert({
      article_id: articleId,
      user_id: user.id,
      role: "assistant",
      current_level: 1,
      questions_asked_count: 0,
      questions_answered_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating socratic session:", error);
    return null;
  }

  revalidatePath(`/student/socraticbot/${articleId}`);
  return data as SocraticMessage;
}

// עדכון סשן עם שאלה ותשובה
export async function updateSocraticSession(
  sessionId: string,
  questionAsked: string,
  questionAnswered: string,
  newLevel: number,
  isCompleted: boolean
): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase
    .from("socratic_messages")
    .update({
      questions_asked: questionAsked,
      questions_answered: questionAnswered,
      questions_asked_count: newLevel,
      questions_answered_count: newLevel - 1,
      current_level: newLevel,
      is_completed: isCompleted,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating socratic session:", error);
    return false;
  }

  revalidatePath(`/student/socraticbot/*`);
  return true;
}

// קבלת התקדמות סטודנט
export async function getStudentProgress(): Promise<StudentProgress | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("student_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching student progress:", error);
    return null;
  }

  return data as StudentProgress | null;
}

// עדכון התקדמות עם ציונים וממצאים
export async function updateStudentProgressScores(
  comprehensionScore: number,
  criticalThinkingScore: number,
  qualityScore: number,
  strengths: string[],
  weaknesses: string[],
  recommendations: string[]
): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase
    .from("student_progress")
    .upsert({
      user_id: user.id,
      overall_comprehension_score: comprehensionScore,
      critical_thinking_score: criticalThinkingScore,
      average_quality_score: qualityScore,
      strengths,
      weaknesses,
      recommendations,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error updating progress scores:", error);
    return false;
  }

  return true;
}

// קבלת כל הסשנים שהסתיימו עבור מאמר
export async function getCompletedSessions(
  articleId: string
): Promise<SocraticMessage[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("socratic_messages")
    .select("*")
    .eq("article_id", articleId)
    .eq("user_id", user.id)
    .eq("is_completed", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching completed sessions:", error);
    return [];
  }

  return data as SocraticMessage[];
}