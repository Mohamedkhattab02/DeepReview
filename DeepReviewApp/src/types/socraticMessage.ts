// types/socraticMessage.ts
export interface SocraticMessage {
  id: string;
  article_id: string;
  user_id: string;
  role: "user" | "assistant";

  // JSON string stored as TEXT
  questions_asked: string | null;
  questions_answered: string | null;

  questions_asked_count: number;
  questions_answered_count: number;

  // לפי הטבלה אצלך: 1..6
  current_level: number;

  is_completed: boolean;

  created_at: string;
  updated_at?: string;
}
