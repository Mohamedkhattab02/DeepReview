// components/student/ProgressTracker.tsx
"use client";

import { useState, useEffect } from "react";
import { StudentProgress } from "@/types/StudentProgress";
import { getArticleProgress, getAllUserProgress } from "@/actions/myprofile";
import { CheckCircle, TrendingUp, Award, Target } from "lucide-react";

interface ProgressTrackerProps {
  articleId?: string;
  showCompact?: boolean;
}

export default function ProgressTracker({ articleId, showCompact = false }: ProgressTrackerProps) {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [allProgress, setAllProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [articleId]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      if (articleId) {
        const data = await getArticleProgress(articleId);
        setProgress(data);
      } else {
        const data = await getAllUserProgress();
        setAllProgress(data);
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Single Article Progress View - Compact
  if (articleId && progress && showCompact) {
    return (
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-purple-900 flex items-center gap-2">
            <CheckCircle size={18} />
            ההתקדמות שלך
          </h3>
          {progress.final_average_score && (
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {progress.final_average_score}/100
            </span>
          )}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-purple-700">הבנת החומר:</span>
            <span className="font-bold text-purple-900">{progress.comprehension_score || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">חשיבה ביקורתית:</span>
            <span className="font-bold text-purple-900">{progress.critical_thinking_score || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">איכות תשובות:</span>
            <span className="font-bold text-purple-900">{progress.quality_score || 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Single Article Progress View - Full
  if (articleId && progress) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="text-purple-600" size={28} />
            ההתקדמות שלך במאמר זה
          </h3>
          {progress.final_average_score && (
            <div className="text-center bg-purple-100 rounded-lg px-6 py-3">
              <p className="text-4xl font-bold text-purple-900">{progress.final_average_score}</p>
              <p className="text-xs text-purple-700 mt-1">ציון סופי</p>
            </div>
          )}
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700 font-medium mb-2">הבנת החומר</p>
            <p className="text-3xl font-bold text-blue-900">{progress.comprehension_score || 'N/A'}</p>
            <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${progress.comprehension_score || 0}%` }}
              />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-sm text-purple-700 font-medium mb-2">חשיבה ביקורתית</p>
            <p className="text-3xl font-bold text-purple-900">{progress.critical_thinking_score || 'N/A'}</p>
            <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all"
                style={{ width: `${progress.critical_thinking_score || 0}%` }}
              />
            </div>
          </div>

          <div className="bg-pink-50 rounded-lg p-4 text-center">
            <p className="text-sm text-pink-700 font-medium mb-2">איכות תשובות</p>
            <p className="text-3xl font-bold text-pink-900">{progress.quality_score || 'N/A'}</p>
            <div className="mt-2 h-2 bg-pink-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-600 rounded-full transition-all"
                style={{ width: `${progress.quality_score || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Scores */}
        {progress.question_scores.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">ציונים לפי שאלה:</h4>
            <div className="flex flex-wrap gap-2">
              {progress.question_scores.map((score, idx) => (
                <div
                  key={idx}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    score >= 90
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : score >= 70
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                  }`}
                >
                  שאלה {idx + 1}: <span className="font-bold">{score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Path */}
        {progress.difficulty_path.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">מסלול קושי:</h4>
            <div className="flex items-center gap-2 flex-wrap">
              {progress.difficulty_path.map((level, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-medium border-2 border-indigo-300">
                    {idx === 0 ? 'התחלה' : `שאלה ${idx}`}: רמה {level}
                  </span>
                  {idx < progress.difficulty_path.length - 1 && (
                    <span className="text-gray-400 mx-2 text-xl">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths and Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6">
          {progress.strengths.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle size={20} />
                החוזקות שלך:
              </h4>
              <ul className="space-y-2">
                {progress.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-green-800">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {progress.weaknesses.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <Target size={20} />
                נקודות לשיפור:
              </h4>
              <ul className="space-y-2">
                {progress.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-orange-800">
                    <span className="text-orange-600 font-bold">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {progress.recommendations.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <TrendingUp size={20} />
              המלצות להמשך:
            </h4>
            <ul className="space-y-2">
              {progress.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-blue-800">
                  <span className="text-blue-600 font-bold">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // All Progress Overview
  if (!articleId && allProgress.length > 0) {
    const avgScore = Math.round(
      allProgress
        .filter(p => p.final_average_score !== null)
        .reduce((sum, p) => sum + (p.final_average_score || 0), 0) / allProgress.length
    );

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="text-purple-600" size={24} />
          סיכום התקדמות כללי
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center bg-purple-100 rounded-lg p-4">
            <p className="text-sm text-purple-700 mb-1">סשנים</p>
            <p className="text-3xl font-bold text-purple-900">{allProgress.length}</p>
          </div>
          
          <div className="text-center bg-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-700 mb-1">ציון ממוצע</p>
            <p className="text-3xl font-bold text-blue-900">{avgScore}</p>
          </div>
          
          <div className="text-center bg-green-100 rounded-lg p-4">
            <p className="text-sm text-green-700 mb-1">הישג הכי גבוה</p>
            <p className="text-3xl font-bold text-green-900">
              {Math.max(...allProgress.map(p => p.final_average_score || 0))}
            </p>
          </div>
          
          <div className="text-center bg-pink-100 rounded-lg p-4">
            <p className="text-sm text-pink-700 mb-1">שאלות נענו</p>
            <p className="text-3xl font-bold text-pink-900">
              {allProgress.reduce((sum, p) => sum + p.question_scores.length, 0)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No Progress Yet
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <div className="text-5xl mb-4">📊</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">אין עדיין נתוני התקדמות</h3>
      <p className="text-gray-600">
        {articleId 
          ? 'התחל סשן סוקרטי כדי לעקוב אחר ההתקדמות שלך'
          : 'השלם סשן סוקרטי ראשון כדי לראות את ההתקדמות שלך'}
      </p>
    </div>
  );
}