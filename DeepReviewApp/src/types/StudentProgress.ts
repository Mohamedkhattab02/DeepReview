// types/StudentProgress.ts
export interface StudentProgress {
  id: string;

  user_id: string;
  article_id: string;
  session_id: string;

  final_average_score: number | null;

  question_scores: number[];
  difficulty_path: number[];

  comprehension_score: number | null;
  critical_thinking_score: number | null;
  quality_score: number | null;

  strengths: string[];
  weaknesses: string[];
  recommendations: string[];

  created_at: string;
  updated_at: string;
}
