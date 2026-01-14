// src/components/instructor/StudentDetailView.tsx
"use client";

import { useState } from "react";

interface Student {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  totalSessions: number;
  averageScore: number;
}

interface ProgressSession {
  id: string;
  article_id: string;
  final_average_score: number;
  question_scores: number[];
  difficulty_path: number[];
  comprehension_score: number | null;
  critical_thinking_score: number | null;
  quality_score: number | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  created_at: string;
  articles?: {
    title: string;
    authors: string[];
  };
}

interface StudentDetailViewProps {
  student: Student;
  sessions: ProgressSession[];
}

export default function StudentDetailView({
  student,
  sessions,
}: StudentDetailViewProps) {
  const [selectedSession, setSelectedSession] = useState<ProgressSession | null>(
    sessions.length > 0 ? sessions[0] : null
  );

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Progress Data
        </h3>
        <p className="text-gray-600">
          {student.full_name} hasn't completed any Socratic sessions yet.
        </p>
      </div>
    );
  }

  // Calculate aggregate data
  const totalSessions = sessions.length;
  const averageScore =
    sessions.reduce((sum, s) => sum + (s.final_average_score || 0), 0) /
    totalSessions;

  const avgComprehension =
    sessions.reduce((sum, s) => sum + (s.comprehension_score || 0), 0) /
    totalSessions;

  const avgCriticalThinking =
    sessions.reduce((sum, s) => sum + (s.critical_thinking_score || 0), 0) /
    totalSessions;

  const avgQuality =
    sessions.reduce((sum, s) => sum + (s.quality_score || 0), 0) / totalSessions;

  // Aggregate strengths, weaknesses, recommendations
  const allStrengths: string[] = [];
  const allWeaknesses: string[] = [];
  const allRecommendations: string[] = [];

  sessions.forEach((session) => {
    allStrengths.push(...session.strengths);
    allWeaknesses.push(...session.weaknesses);
    allRecommendations.push(...session.recommendations);
  });

  // Get unique and most common
  const uniqueStrengths = [...new Set(allStrengths)].slice(0, 8);
  const uniqueWeaknesses = [...new Set(allWeaknesses)].slice(0, 8);
  const uniqueRecommendations = [...new Set(allRecommendations)].slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl font-bold">{totalSessions}</div>
          <div className="text-blue-100 text-sm mt-1">Total Sessions</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl font-bold">{Math.round(averageScore)}</div>
          <div className="text-green-100 text-sm mt-1">Average Score</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl font-bold">{Math.round(avgComprehension)}</div>
          <div className="text-purple-100 text-sm mt-1">Comprehension</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl font-bold">
            {Math.round(avgCriticalThinking)}
          </div>
          <div className="text-pink-100 text-sm mt-1">Critical Thinking</div>
        </div>
      </div>

      {/* Overall Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strengths */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💪</span>
            <h3 className="text-xl font-bold text-green-900">
              Overall Strengths
            </h3>
          </div>
          <div className="space-y-2">
            {uniqueStrengths.length > 0 ? (
              uniqueStrengths.map((strength, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-green-50 p-3 rounded-lg"
                >
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-sm text-gray-800 flex-1">
                    {strength}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                No strengths identified yet
              </p>
            )}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📈</span>
            <h3 className="text-xl font-bold text-orange-900">
              Areas to Improve
            </h3>
          </div>
          <div className="space-y-2">
            {uniqueWeaknesses.length > 0 ? (
              uniqueWeaknesses.map((weakness, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-orange-50 p-3 rounded-lg"
                >
                  <span className="text-orange-600 font-bold">→</span>
                  <span className="text-sm text-gray-800 flex-1">
                    {weakness}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                No weaknesses identified yet
              </p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💡</span>
            <h3 className="text-xl font-bold text-blue-900">
              Recommendations
            </h3>
          </div>
          <div className="space-y-2">
            {uniqueRecommendations.length > 0 ? (
              uniqueRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg"
                >
                  <span className="text-blue-600 font-bold">{idx + 1}.</span>
                  <span className="text-sm text-gray-800 flex-1">{rec}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                No recommendations yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Progress Over Time
        </h3>
        <div className="space-y-3">
          {sessions.map((session, idx) => {
            const sessionNum = sessions.length - idx;
            const scorePercentage = (session.final_average_score / 100) * 100;

            return (
              <div key={session.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Session {sessionNum} -{" "}
                    {session.articles?.title?.substring(0, 50) || "Unknown"}
                    {session.articles?.title && session.articles.title.length > 50
                      ? "..."
                      : ""}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {session.final_average_score}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      session.final_average_score >= 85
                        ? "bg-green-500"
                        : session.final_average_score >= 70
                        ? "bg-blue-500"
                        : session.final_average_score >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${scorePercentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Details Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Session Details
        </h3>

        {/* Session Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {sessions.map((session, idx) => {
            const sessionNum = sessions.length - idx;
            const isSelected = selectedSession?.id === session.id;

            return (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Session {sessionNum}
              </button>
            );
          })}
        </div>

        {/* Selected Session Details */}
        {selectedSession && (
          <div className="space-y-6">
            {/* Article Info */}
            <div className="bg-gradient-to-r from-blue-400 to-purple-300 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2">
                {selectedSession.articles?.title || "Unknown Article"}
              </h4>
              <p className="text-sm text-gray-600">
                {selectedSession.articles?.authors.join(", ") || "Unknown Authors"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Completed:{" "}
                {new Date(selectedSession.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Scores Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {selectedSession.final_average_score}
                </div>
                <div className="text-xs text-gray-600 mt-1">Final Score</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {selectedSession.comprehension_score || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Comprehension</div>
              </div>
              <div className="bg-pink-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-pink-600">
                  {selectedSession.critical_thinking_score || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Critical Thinking</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {selectedSession.quality_score || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Quality</div>
              </div>
            </div>

            {/* Question Scores */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">
                Question-by-Question Performance
              </h5>
              <div className="grid grid-cols-5 gap-3">
                {selectedSession.question_scores.map((score, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-purple-300 to-blue-300 rounded-lg p-4 text-center border-2 border-gray-200"
                  >
                    <div className="text-2xl font-bold text-gray-900">{score}</div>
                    <div className="text-xs text-gray-500 mt-1">Question {i + 1}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty Path */}
            {selectedSession.difficulty_path.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">
                  Difficulty Progression
                </h5>
                <div className="flex items-center gap-2">
                  {selectedSession.difficulty_path.map((diff, i) => (
                    <div key={i} className="flex-1">
                      <div
                        className={`rounded-lg p-3 text-center font-bold ${
                          diff >= 4
                            ? "bg-red-100 text-red-700"
                            : diff >= 3
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        Level {diff}
                      </div>
                      <div className="text-xs text-center text-gray-500 mt-1">
                        Q{i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session-Specific Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Strengths for this session */}
              {selectedSession.strengths.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <span>💪</span> Session Strengths
                  </h5>
                  <ul className="space-y-1">
                    {selectedSession.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses for this session */}
              {selectedSession.weaknesses.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h5 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <span>📈</span> Session Weaknesses
                  </h5>
                  <ul className="space-y-1">
                    {selectedSession.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-600">→</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations for this session */}
              {selectedSession.recommendations.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <span>💡</span> Recommendations
                  </h5>
                  <ul className="space-y-1">
                    {selectedSession.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-600">{idx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
