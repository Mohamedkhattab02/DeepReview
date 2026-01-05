// src/actions/socraticbot.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { SocraticMessage } from "@/types/socraticMessage";
import { StudentProgress } from "@/types/StudentProgress";

// קבלת סשן סוקרטי פעיל (לא הושלם)
export async function getSocraticSession(
  articleId: string
): Promise<SocraticMessage | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("socratic_messages")
    .select("*")
    .eq("article_id", articleId)
    .eq("user_id", user.id)
    .eq("is_completed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle(); // ✅ במקום single()

  if (error) {
    console.error("Error fetching socratic session:", error);
    return null;
  }

  return (data as SocraticMessage) ?? null;
}

// יצירת סשן חדש
export async function createSocraticSession(
  articleId: string
): Promise<SocraticMessage | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
      questions_asked: "[]",
      questions_answered: "[]",
      is_completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating socratic session:", error);
    return null;
  }

  return data as SocraticMessage;
}

// עדכון סשן עם שאלות/תשובות
export async function updateSocraticSession(
  sessionId: string,
  questionAskedJson: string,
  questionAnsweredJson: string,
  newLevel: number,
  isCompleted: boolean
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // אופציונלי: נסה לחשב counts אמיתיים מה-JSON
  let askedCount = newLevel;
  let answeredCount = Math.max(0, newLevel - 1);

  try {
    const askedArr = JSON.parse(questionAskedJson);
    const ansArr = JSON.parse(questionAnsweredJson);
    if (Array.isArray(askedArr)) askedCount = askedArr.length;
    if (Array.isArray(ansArr)) answeredCount = ansArr.length;
  } catch {}

  const { error } = await supabase
    .from("socratic_messages")
    .update({
      questions_asked: questionAskedJson,
      questions_answered: questionAnsweredJson,
      questions_asked_count: askedCount,
      questions_answered_count: answeredCount,
      current_level: newLevel,
      is_completed: isCompleted,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating socratic session:", error);
    return false;
  }

  // ✅ revalidate רק אחרי mutation אמיתי (וזה נקרא מה-Client אחרי סיום)
  revalidatePath(`/dashboard/student/socraticbot`);
  return true;
}

// קבלת התקדמות סטודנט
export async function getStudentProgress(): Promise<StudentProgress | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("student_progress")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching student progress:", error);
    return null;
  }

  return (data as StudentProgress) ?? null;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: existingProgress } = await supabase
    .from("student_progress")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // ממוצע משוקלל
  let newComprehension = comprehensionScore;
  let newCriticalThinking = criticalThinkingScore;
  let newQuality = qualityScore;

  if (existingProgress) {
    const weight = 0.4;
    const oldWeight = 0.6;

    if (existingProgress.overall_comprehension_score != null) {
      newComprehension =
        existingProgress.overall_comprehension_score * oldWeight +
        comprehensionScore * weight;
    }

    if (existingProgress.critical_thinking_score != null) {
      newCriticalThinking =
        existingProgress.critical_thinking_score * oldWeight +
        criticalThinkingScore * weight;
    }

    if (existingProgress.average_quality_score != null) {
      newQuality =
        existingProgress.average_quality_score * oldWeight +
        qualityScore * weight;
    }
  }

  // איחוד arrays ושמירת עד 5
  let mergedStrengths = strengths;
  let mergedWeaknesses = weaknesses;
  let mergedRecommendations = recommendations;

  if (existingProgress) {
    if (existingProgress.strengths) {
      mergedStrengths = [
        ...new Set([...strengths, ...existingProgress.strengths]),
      ].slice(0, 5);
    }
    if (existingProgress.weaknesses) {
      mergedWeaknesses = [
        ...new Set([...weaknesses, ...existingProgress.weaknesses]),
      ].slice(0, 5);
    }
    if (existingProgress.recommendations) {
      mergedRecommendations = [
        ...new Set([...recommendations, ...existingProgress.recommendations]),
      ].slice(0, 5);
    }
  }

  const { error } = await supabase.from("student_progress").upsert(
    {
      user_id: user.id,
      overall_comprehension_score: Math.round(newComprehension * 100) / 100,
      critical_thinking_score: Math.round(newCriticalThinking * 100) / 100,
      average_quality_score: Math.round(newQuality * 100) / 100,
      strengths: mergedStrengths,
      weaknesses: mergedWeaknesses,
      recommendations: mergedRecommendations,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Error updating progress scores:", error);
    return false;
  }

  return true;
}

// כל הסשנים שהסתיימו
export async function getCompletedSessions(articleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
