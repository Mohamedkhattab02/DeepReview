// components/student/PersonalInsights.tsx
import { StudentProgress } from "@/types/StudentProgress";
import { Lightbulb, TrendingUp, Target, Award } from "lucide-react";

interface PersonalInsightsProps {
  progressRecords: StudentProgress[];
}

export default function PersonalInsights({ progressRecords }: PersonalInsightsProps) {
  if (progressRecords.length === 0) {
    return null;
  }

  // Aggregate all strengths, weaknesses, and recommendations
  const allStrengths = progressRecords.flatMap(p => p.strengths);
  const allWeaknesses = progressRecords.flatMap(p => p.weaknesses);
  const allRecommendations = progressRecords.flatMap(p => p.recommendations);

  // Count occurrences
  const strengthCounts = allStrengths.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const weaknessCounts = allWeaknesses.reduce((acc, w) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recommendationCounts = allRecommendations.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get top items (sorted by frequency)
  const topStrengths = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([strength, count]) => ({ text: strength, count }));

  const topWeaknesses = Object.entries(weaknessCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([weakness, count]) => ({ text: weakness, count }));

  const topRecommendations = Object.entries(recommendationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([rec, count]) => ({ text: rec, count }));

  // Calculate improvement areas
  const avgScores = progressRecords
    .filter(p => p.final_average_score !== null)
    .map(p => p.final_average_score || 0);

  const recentTrend = avgScores.length >= 3
    ? avgScores.slice(-3).reduce((a, b) => a + b, 0) / 3 >
      avgScores.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(avgScores.length - 3, 1)
    : null;

  return (
    <div className="space-y-6">
      {/* Overall Insights */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-300">
        <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
          <Award className="text-purple-600" size={24} />
         Personal insights
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Performance Summary */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="text-blue-600" size={20} />
              <h4 className="font-semibold text-gray-900">Performance Summary</h4>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              Completion {progressRecords.length} Socratic sessions with an average score of {' '}
              <span className="font-bold text-purple-600">
                {Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length)}
              </span>
              .{' '}
              {recentTrend !== null && (
                <>
                  {recentTrend ? (
                    <span className="text-green-600 font-semibold">
                     Your performance is improving! 📈
                    </span>
                  ) : (
                    <span className="text-orange-600 font-semibold">
                     There is room for improvement in recent sessions 💪
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="text-purple-600" size={20} />
              <h4 className="font-semibold text-gray-900">Quick Stats</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Completed sessions:</span>
                <span className="font-bold text-gray-900">{progressRecords.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Highest score:</span>
                <span className="font-bold text-green-600">{Math.max(...avgScores)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Top strengths:</span>
                <span className="font-bold text-blue-600">{topStrengths.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths, Weaknesses, Recommendations Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Top Strengths */}
        {topStrengths.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-100 p-2 rounded-full">
                <Award className="text-green-600" size={20} />
              </div>
              <h3 className="font-bold text-gray-900">Top Strengths</h3>
            </div>
            <ul className="space-y-3">
              {topStrengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{strength.text}</p>
                    {strength.count > 1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Identified {strength.count} times
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Top Weaknesses */}
        {topWeaknesses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-orange-100 p-2 rounded-full">
                <Target className="text-orange-600" size={20} />
              </div>
              <h3 className="font-bold text-gray-900">Top Weaknesses</h3>
            </div>
            <ul className="space-y-3">
              {topWeaknesses.map((weakness, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{weakness.text}</p>
                    {weakness.count > 1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Identified {weakness.count} times
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Top Recommendations */}
        {topRecommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Lightbulb className="text-blue-600" size={20} />
              </div>
              <h3 className="font-bold text-gray-900">Top Recommendations</h3>
            </div>
            <ul className="space-y-3">
              {topRecommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">→</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{rec.text}</p>
                    {rec.count > 1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended {rec.count} times
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Plan */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="text-yellow-600" size={24} />
          <h3 className="font-bold text-gray-900 text-lg">Recommended Action Plan</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-lg p-4 border-r-4 border-green-500">
            <h4 className="font-semibold text-green-900 mb-2">Continue to strengthen:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              {topStrengths.slice(0, 3).map((s, idx) => (
                <li key={idx}>• {s.text}</li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border-r-4 border-blue-500">
            <h4 className="font-semibold text-blue-900 mb-2">Focus on improvement:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {topWeaknesses.slice(0, 3).map((w, idx) => (
                <li key={idx}>• {w.text}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}