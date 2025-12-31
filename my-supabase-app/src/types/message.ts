
export interface Message {
  id: string;
  article_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string; // ISO timestamp (מה-DB)
}