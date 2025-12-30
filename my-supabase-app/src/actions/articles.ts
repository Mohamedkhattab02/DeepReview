// actions/articles.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { Article } from "@/types/article";

// ============================================
// קבלת כל המאמרים (עם פגינציה)
// ============================================
export async function getArticles(
  limit: number = 6,
  offset: number = 0
): Promise<Article[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("uploaded_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching articles:", error);
    return [];
  }

  return data as Article[];
}

// ============================================
// ספירת כל המאמרים
// ============================================
export async function getArticlesCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error counting articles:", error);
    return 0;
  }

  return count || 0;
}

// ============================================
// קבלת מאמרים של המשתמש הנוכחי
// ============================================
export async function getMyArticles(): Promise<Article[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("Error fetching my articles:", error);
    return [];
  }

  return data as Article[];
}

// ============================================
// מחיקת מאמר
// ============================================
export async function deleteArticle(articleId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // מחיקה רק אם המאמר שייך למשתמש
  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", articleId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting article:", error);
    return false;
  }

  return true;
}

// ============================================
// קבלת מאמר בודד
// ============================================
export async function getArticleById(
  articleId: string
): Promise<Article | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .single();

  if (error) {
    console.error("Error fetching article:", error);
    return null;
  }

  return data as Article;
}