import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

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
  created_at: string;
  uploaded_at: string;

}
