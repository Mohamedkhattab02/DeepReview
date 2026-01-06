// src/actions/socraticbot.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { SocraticMessage } from "@/types/socraticMessage";
import { StudentProgress } from "@/types/StudentProgress";

// ======================
// Helpers (TEXT <-> array)
// ======================
function safeParseArray<T = any>(value: any, fallback: T[] = []): T[] {
  if (!value) return fallback;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function safeStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "[]";
  }
}

async function getAuthedUser(supabase: any) {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("auth.getUser error:", error);
    return null;
  }
  return data.user ?? null;
}

// =======================================================
// Socratic sessions (socratic_messages)
// =======================================================

// Active session (not completed) for article
export async function getSocraticSession(
  articleId: string
): Promise<SocraticMessage | null> {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  if (!user) return null;

  const { data, error } = await supabase
    .from("socratic_messages")
    .select("*")
    .eq("article_id", articleId)
    .eq("user_id", user.id)
    .eq("is_completed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching socratic session:", error);
    return null;
  }

  return (data as SocraticMessage) ?? null;
}

// Create new session
export async function createSocraticSession(
  articleId: string
): Promise<SocraticMessage | null> {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
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
      // ❌ אין updated_at בטבלה שלך -> לא לשים!
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating socratic session:", error);
    return null;
  }

  // ⚠️ אל תעשה revalidatePath כאן אם זה נקרא בזמן render (כבר היה לך digest error)
  return data as SocraticMessage;
}

// Update session (questions_asked / questions_answered as TEXT JSON arrays)
export async function updateSocraticSession(
  sessionId: string,
  questionAskedJson: string,
  questionAnsweredJson: string,
  newLevel: number,
  isCompleted: boolean
): Promise<boolean> {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  if (!user) return false;

  const askedArr = safeParseArray<any>(questionAskedJson, []);
  const ansArr = safeParseArray<any>(questionAnsweredJson, []);

  const updatePayload: any = {
    questions_asked: questionAskedJson,
    questions_answered: questionAnsweredJson,
    questions_asked_count: askedArr.length,
    questions_answered_count: ansArr.length,
    current_level: newLevel,
    is_completed: isCompleted,
    // ❌ אין updated_at בטבלה שלך -> לא לשים!
  };

  const { error } = await supabase
    .from("socratic_messages")
    .update(updatePayload)
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating socratic session:", error);
    return false;
  }

  // ✅ מותר לעשות revalidate רק אחרי mutation אמיתי (וזה נקרא בדרך כלל אחרי סיום)
  revalidatePath(`/dashboard/student/socraticbot`);
  return true;
}

// =======================================================
// Student Progress: add a NEW row every session/test
// (student_progress)
// =======================================================

export async function insertStudentProgressRow(payload: {
  articleId: string;
  sessionId: string;

  finalAverageScore: number | null;
  questionScores: number[];
  difficultyPath?: number[];

  comprehensionScore?: number | null;
  criticalThinkingScore?: number | null;
  qualityScore?: number | null;

  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}): Promise<boolean> {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  if (!user) return false;

  const row = {
    user_id: user.id,
    article_id: payload.articleId,
    session_id: payload.sessionId,

    final_average_score: payload.finalAverageScore,

    // TEXT columns that hold JSON strings
    question_scores: safeStringify(payload.questionScores ?? []),
    difficulty_path: safeStringify(payload.difficultyPath ?? []),

    comprehension_score: payload.comprehensionScore ?? null,
    critical_thinking_score: payload.criticalThinkingScore ?? null,
    quality_score: payload.qualityScore ?? null,

    strengths: safeStringify(payload.strengths ?? []),
    weaknesses: safeStringify(payload.weaknesses ?? []),
    recommendations: safeStringify(payload.recommendations ?? []),

    // created_at / updated_at יש להם default בטבלה -> לא חייבים לשלוח
  };

  const { error } = await supabase.from("student_progress").insert(row);

  if (error) {
    console.error("❌ student_progress insert failed:", error);
    return false;
  }

  return true;
}

// Get all progress rows for user+article
export async function getStudentProgressForArticle(
  articleId: string
): Promise<StudentProgress[]> {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  if (!user) return [];

  const { data, error } = await supabase
    .from("student_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching student_progress rows:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    ...row,
    question_scores: safeParseArray<number>(row.question_scores, []),
    difficulty_path: safeParseArray<number>(row.difficulty_path, []),
    strengths: safeParseArray<string>(row.strengths, []),
    weaknesses: safeParseArray<string>(row.weaknesses, []),
    recommendations: safeParseArray<string>(row.recommendations, []),
  })) as StudentProgress[];
}
