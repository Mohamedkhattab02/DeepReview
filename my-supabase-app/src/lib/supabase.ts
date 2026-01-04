import { createClient } from "@supabase/supabase-js";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);


// ============================================
// TYPES - הגדרות TypeScript
// ============================================
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'instructor';
  created_at: string;
}

export interface Article {
  id: string;
  user_id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  full_text: string | null;
  keywords: string[];
  pages: number | null;
  publication_year: number | null;
  main_topics: string[];
  analysis_completed: boolean;
  created_at:Timestamp;
  uploaded_at:Timestamp;
}

// src/types/message.ts

export interface Message {
  id: string;
  article_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string; // ISO timestamp (מה-DB)
}

// types/socraticMessage.ts
export interface SocraticMessage {
  id: string;
  article_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  questions_asked: string | null;
  questions_answered: string | null;
  questions_asked_count: number;
  questions_answered_count: number;
  current_level: number;
  is_completed: boolean;
  created_at: string;
}
// types/StudentProgress.ts
export interface StudentProgress {
  id: string;
  user_id: string;
  total_articles: number;
  total_questions_asked: number;
  total_questions_answered: number;
  average_quality_score: number | null;
  overall_comprehension_score: number | null;
  critical_thinking_score: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommendations: string[] | null;
}