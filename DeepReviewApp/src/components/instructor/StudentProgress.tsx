// src/components/instructor/StudentProgress.tsx
"use client";

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

interface StudentProgressProps {
  sessions: ProgressSession[];
  studentName: string;
}

export default function StudentProgress({
  sessions,
  studentName,
}: StudentProgressProps) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Progress Data
        </h3>
        <p className="text-gray-600">
          {studentName} hasn't completed any Socratic sessions yet.
        </p>
      </div>
    );
  }

  const averageScore =
    sessions.reduce((sum, s) => sum + (s.final_average_score || 0), 0) /
    sessions.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl font-bold">{sessions.length}</div>
          <div className="text-blue-100 text-sm mt-1">Total Sessions</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl font-bold">{Math.round(averageScore)}</div>
          <div className="text-green-100 text-sm mt-1">Average Score</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl font-bold">
            {Math.round(
              sessions.reduce(
                (sum, s) => sum + (s.comprehension_score || 0),
                0
              ) / sessions.length
            )}
          </div>
          <div className="text-purple-100 text-sm mt-1">Comprehension</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl font-bold">
            {Math.round(
              sessions.reduce(
                (sum, s) => sum + (s.critical_thinking_score || 0),
                0
              ) / sessions.length
            )}
          </div>
          <div className="text-pink-100 text-sm mt-1">Critical Thinking</div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Session History</h3>

        {sessions.map((session, idx) => (
          <div
            key={session.id}
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">
                  Session #{sessions.length - idx}
                </h4>
                <p className="text-sm text-gray-600">
                  {session.articles?.title || "Unknown Article"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(session.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {session.final_average_score}
                </div>
                <div className="text-xs text-gray-500">Final Score</div>
              </div>
            </div>

            {/* Question Scores */}
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-gray-700 mb-2">
                Question Scores:
              </h5>
              <div className="flex gap-2">
                {session.question_scores.map((score, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-100 rounded-lg p-2 text-center"
                  >
                    <div className="text-lg font-bold text-gray-900">
                      {score}
                    </div>
                    <div className="text-xs text-gray-500">Q{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty Path */}
            {session.difficulty_path.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                  Difficulty Path:
                </h5>
                <div className="flex items-center gap-2">
                  {session.difficulty_path.map((diff, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        diff >= 4
                          ? "bg-red-100 text-red-700"
                          : diff >= 3
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Level {diff}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session.strengths.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-green-700 mb-2">
                    💪 Strengths:
                  </h5>
                  <ul className="space-y-1">
                    {session.strengths.slice(0, 3).map((strength, i) => (
                      <li key={i} className="text-sm text-gray-700">
                        • {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {session.weaknesses.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-orange-700 mb-2">
                    📈 Areas to Improve:
                  </h5>
                  <ul className="space-y-1">
                    {session.weaknesses.slice(0, 3).map((weakness, i) => (
                      <li key={i} className="text-sm text-gray-700">
                        • {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}