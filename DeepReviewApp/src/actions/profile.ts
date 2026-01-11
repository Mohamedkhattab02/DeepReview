// actions/profile.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { Message } from "@/types/message";

import { Article } from "@/types/article";
import { SocraticMessage } from "@/types/socraticMessage";
import { StudentProgress } from "@/types/StudentProgress";
import { User } from "@supabase/supabase-js/dist/index.cjs";

interface ProfileData {
  user: User;
  articles: Article[];
  progressRecords: StudentProgress[];
  totalMessages: number;
  totalSocraticQuestions: number;
  messagesPerArticle: Record<string, number>;
  socraticQuestionsPerArticle: Record<string, number>;
}

export async function getUserProfileData(): Promise<ProfileData> {
  const supabase = await createClient();

  // Get current user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authUser) {
    throw new Error("User not authenticated");
  }

  // Get user profile
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (userError || !user) {
    throw new Error("Failed to fetch user profile");
  }

  // Get all user's articles
  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select("*")
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false });

  if (articlesError) {
    throw new Error("Failed to fetch articles");
  }

  // Get all progress records
  const { data: progressRecords, error: progressError } = await supabase
    .from("student_progress")
    .select("*")
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false });

  if (progressError) {
    throw new Error("Failed to fetch progress records");
  }

  // Parse JSON fields in progress records
  const parsedProgressRecords = (progressRecords || []).map((record: any) => ({
    ...record,
    question_scores: typeof record.question_scores === 'string' 
      ? JSON.parse(record.question_scores) 
      : record.question_scores || [],
    difficulty_path: typeof record.difficulty_path === 'string'
      ? JSON.parse(record.difficulty_path)
      : record.difficulty_path || [],
    strengths: typeof record.strengths === 'string'
      ? JSON.parse(record.strengths)
      : record.strengths || [],
    weaknesses: typeof record.weaknesses === 'string'
      ? JSON.parse(record.weaknesses)
      : record.weaknesses || [],
    recommendations: typeof record.recommendations === 'string'
      ? JSON.parse(record.recommendations)
      : record.recommendations || [],
  }));

  // Get total messages count
  const { count: totalMessages } = await supabase
    .from("messages")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", authUser.id);

  // Get messages count per article
  const { data: messagesData } = await supabase
    .from("messages")
    .select("article_id")
    .eq("user_id", authUser.id);

  const messagesPerArticle: Record<string, number> = {};
  (messagesData || []).forEach((msg) => {
    messagesPerArticle[msg.article_id] = (messagesPerArticle[msg.article_id] || 0) + 1;
  });

  // Get total socratic questions count
  const { data: socraticData } = await supabase
    .from("socratic_messages")
    .select("questions_asked_count, article_id")
    .eq("user_id", authUser.id);

  let totalSocraticQuestions = 0;
  const socraticQuestionsPerArticle: Record<string, number> = {};

  (socraticData || []).forEach((record) => {
    const count = record.questions_asked_count || 0;
    totalSocraticQuestions += count;
    socraticQuestionsPerArticle[record.article_id] = 
      (socraticQuestionsPerArticle[record.article_id] || 0) + count;
  });

  return {
    user,
    articles: articles || [],
    progressRecords: parsedProgressRecords,
    totalMessages: totalMessages || 0,
    totalSocraticQuestions,
    messagesPerArticle,
    socraticQuestionsPerArticle,
  };
}

export async function getArticleProgress(articleId: string): Promise<StudentProgress | null> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("student_progress")
    .select("*")
    .eq("article_id", articleId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  // Parse JSON fields
  return {
    ...data,
    question_scores: typeof data.question_scores === 'string' 
      ? JSON.parse(data.question_scores) 
      : data.question_scores || [],
    difficulty_path: typeof data.difficulty_path === 'string'
      ? JSON.parse(data.difficulty_path)
      : data.difficulty_path || [],
    strengths: typeof data.strengths === 'string'
      ? JSON.parse(data.strengths)
      : data.strengths || [],
    weaknesses: typeof data.weaknesses === 'string'
      ? JSON.parse(data.weaknesses)
      : data.weaknesses || [],
    recommendations: typeof data.recommendations === 'string'
      ? JSON.parse(data.recommendations)
      : data.recommendations || [],
  };
}

export async function getAllUserProgress(): Promise<StudentProgress[]> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("student_progress")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  // Parse JSON fields for all records
  return data.map((record: any) => ({
    ...record,
    question_scores: typeof record.question_scores === 'string' 
      ? JSON.parse(record.question_scores) 
      : record.question_scores || [],
    difficulty_path: typeof record.difficulty_path === 'string'
      ? JSON.parse(record.difficulty_path)
      : record.difficulty_path || [],
    strengths: typeof record.strengths === 'string'
      ? JSON.parse(record.strengths)
      : record.strengths || [],
    weaknesses: typeof record.weaknesses === 'string'
      ? JSON.parse(record.weaknesses)
      : record.weaknesses || [],
    recommendations: typeof record.recommendations === 'string'
      ? JSON.parse(record.recommendations)
      : record.recommendations || [],
  }));
}