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
}