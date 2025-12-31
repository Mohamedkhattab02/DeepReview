// src/actions/chat.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { Message } from "@/types/message";
import { revalidatePath } from "next/cache";

// ✅ הנתיב הנכון בפרויקט שלך
const STUDENT_CHAT_PATH = (articleId: string) =>
  `/dashboard/student/chat/${articleId}`;

// ============================================
// קבלת כל ההודעות של מאמר עבור המשתמש הנוכחי
// ============================================
export async function getChatHistory(articleId: string): Promise<Message[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    console.error("Auth error in getChatHistory:", {
      message: userErr.message,
      status: userErr.status,
      name: userErr.name,
    });
    return [];
  }

  if (!user) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("article_id", articleId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("DB error fetching chat history:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return (data ?? []) as Message[];
}

// ============================================
// שמירת הודעה חדשה
// ============================================
export async function saveMessage(
  articleId: string,
  role: "user" | "assistant",
  content: string
): Promise<Message | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    console.error("Auth error in saveMessage:", {
      message: userErr.message,
      status: userErr.status,
      name: userErr.name,
    });
    return null;
  }

  if (!user) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      article_id: articleId,
      user_id: user.id,
      role,
      content,
    })
    .select("*")
    .single();

  if (error) {
    console.error("DB error saving message:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  // ✅ היה /student/chat/... -> זה גרם לבעיות
  revalidatePath(STUDENT_CHAT_PATH(articleId));

  return data as Message;
}

// ============================================
// מחיקת כל ההיסטוריה של מאמר
// ============================================
export async function clearChatHistory(articleId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    console.error("Auth error in clearChatHistory:", {
      message: userErr.message,
      status: userErr.status,
      name: userErr.name,
    });
    return false;
  }

  if (!user) return false;

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("article_id", articleId)
    .eq("user_id", user.id);

  if (error) {
    console.error("DB error clearing chat history:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return false;
  }

  // ✅ היה /student/chat/... -> תוקן
  revalidatePath(STUDENT_CHAT_PATH(articleId));
  return true;
}
