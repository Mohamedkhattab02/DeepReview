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