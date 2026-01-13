// components/student/ArticleProgressList.tsx

import { StudentProgress } from "@/types/StudentProgress";
import { Article } from "@/types/article";
import Link from "next/link";
import { BookOpen, MessageCircle, Brain, TrendingUp, Calendar, CheckCircle, XCircle } from "lucide-react";

interface ArticleProgressListProps {
  articles: Article[];
  progressRecords: StudentProgress[];
  messagesPerArticle: Record<string, number>;
  socraticQuestionsPerArticle: Record<string, number>;
}

export default function ArticleProgressList({
  articles,
  progressRecords,
  messagesPerArticle,
  socraticQuestionsPerArticle,
}: ArticleProgressListProps) {
  // Map progress to articles
  const articlesWithProgress = articles.map(article => {
    const progress = progressRecords.find(p => p.article_id === article.id);
    const messagesCount = messagesPerArticle[article.id] || 0;
    const socraticCount = socraticQuestionsPerArticle[article.id] || 0;

    return {
      ...article,
      progress,
      messagesCount,
      socraticCount,
    };
  });

  if (articles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="text-7xl mb-6">📚</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2"> There are no articles yet</h3>
        <p className="text-gray-600 mb-8">Start learning by uploading your first article!</p>
        <Link
          href="/dashboard/student/upload"
          className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold shadow-lg"
        >
          Upload Article
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Articles</h2>
        <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow">
          Total {articles.length} articles
        </span>
      </div>

      <div className="grid gap-6">
        {articlesWithProgress.map((article) => {
          const hasProgress = !!article.progress;
          const score = article.progress?.final_average_score || 0;
          
          return (
            <div
              key={article.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                {/* Article Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/student/articles/${article.id}`}
                      className="text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors"
                    >
                      {article.title}
                    </Link>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(article.created_at).toLocaleDateString('he-IL')}
                      </span>
                      {article.authors && article.authors.length > 0 && (
                        <span>👤 {article.authors.join(', ')}</span>
                      )}
                      {article.publication_year && (
                        <span>📅 {article.publication_year}</span>
                      )}
                    </div>
                  </div>
                  
                  {hasProgress ? (
                    <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                      <CheckCircle size={18} />
                      <span className="font-semibold">Completed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full">
                      <XCircle size={18} />
                      <span className="font-semibold">In Progress</span>
                    </div>
                  )}
                </div>

                {/* Topics */}
                {article.main_topics && article.main_topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.main_topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <MessageCircle size={16} className="text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Messages</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{article.messagesCount}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Brain size={16} className="text-purple-600" />
                      <span className="text-xs text-purple-600 font-medium">Questions</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{article.socraticCount}</p>
                  </div>

                  {hasProgress && (
                    <>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <TrendingUp size={16} className="text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Average Score</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{score}</p>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <BookOpen size={16} className="text-yellow-600" />
                          <span className="text-xs text-yellow-600 font-medium">Difficulty Level</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-900">
                          {article.progress?.difficulty_path[article.progress.difficulty_path.length - 1] || 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress Details */}
                {hasProgress && article.progress && (
                  <div className="border-t pt-4 space-y-3">
                    {/* Scores per question */}
                    {article.progress.question_scores.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Scores per question:</p>
                        <div className="flex flex-wrap gap-2">
                          {article.progress.question_scores.map((score, idx) => (
                            <span
                              key={idx}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                score >= 90
                                  ? 'bg-green-100 text-green-700'
                                  : score >= 70
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              Q{idx + 1}: {score}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strengths & Weaknesses */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {article.progress.strengths.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-green-700 mb-2">💪 Strengths:</p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {article.progress.strengths.map((strength, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {article.progress.weaknesses.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-orange-700 mb-2">📌 Weaknesses:</p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {article.progress.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-orange-600">•</span>
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Recommendations */}
                    {article.progress.recommendations.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 mb-2">💡 Recommendations:</p>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {article.progress.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span>→</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}