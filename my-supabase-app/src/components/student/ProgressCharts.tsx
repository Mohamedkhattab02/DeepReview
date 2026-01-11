// components/student/ProgressCharts.tsx
import { StudentProgress } from "@/types/StudentProgress";
import { Article } from "@/types/article";
import { TrendingUp, BarChart3, Target } from "lucide-react";

interface ProgressChartsProps {
  progressRecords: StudentProgress[];
  articles: Article[];
}

export default function ProgressCharts({ progressRecords, articles }: ProgressChartsProps) {
  if (progressRecords.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="text-7xl mb-6">📊</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">אין עדיין נתוני התקדמות</h3>
        <p className="text-gray-600">השלם סשן סוקרטי כדי לראות את ההתקדמות שלך</p>
      </div>
    );
  }

  // Sort by date
  const sortedRecords = [...progressRecords].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Calculate trends
  const scores = sortedRecords
    .filter(r => r.final_average_score !== null)
    .map(r => r.final_average_score || 0);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const lastThreeAvg = scores.length >= 3
    ? Math.round(scores.slice(-3).reduce((a, b) => a + b, 0) / 3)
    : avgScore;

  const trend = lastThreeAvg > avgScore ? 'up' : lastThreeAvg < avgScore ? 'down' : 'stable';

  // Get article titles
  const articleMap = new Map(articles.map(a => [a.id, a.title]));

  return (
    <div className="space-y-6">
      {/* Trend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">ציון ממוצע כללי</h3>
            <BarChart3 className="text-blue-600" size={24} />
          </div>
          <p className="text-4xl font-bold text-gray-900">{avgScore}</p>
          <p className="text-sm text-gray-600 mt-1">מתוך 100</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">3 הסשנים האחרונים</h3>
            <Target className="text-purple-600" size={24} />
          </div>
          <p className="text-4xl font-bold text-gray-900">{lastThreeAvg}</p>
          <p className="text-sm text-gray-600 mt-1">ממוצע</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">מגמה</h3>
            <TrendingUp className={`${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`} size={24} />
          </div>
          <p className={`text-2xl font-bold ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {trend === 'up' ? '📈 עולה' : trend === 'down' ? '📉 יורדת' : '➡️ יציבה'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {trend === 'up' ? 'כל הכבוד!' : trend === 'down' ? 'המשך להשתפר' : 'שמור על הרמה'}
          </p>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="text-purple-600" size={24} />
          גרף התקדמות לאורך זמן
        </h3>
        
        <div className="space-y-4">
          {sortedRecords.map((record, idx) => {
            const score = record.final_average_score || 0;
            const articleTitle = articleMap.get(record.article_id) || 'Unknown Article';
            const date = new Date(record.created_at).toLocaleDateString('he-IL', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={record.id} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-gray-900 max-w-md truncate">
                      {articleTitle}
                    </span>
                    <span className="text-gray-500 text-xs">{date}</span>
                  </div>
                  <span className={`font-bold text-lg ${
                    score >= 90 ? 'text-green-600' :
                    score >= 70 ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {score}
                  </span>
                </div>
                
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      score >= 90 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      score >= 70 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                      'bg-gradient-to-r from-yellow-400 to-yellow-600'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">ניתוח מפורט לפי סשן</h3>
        
        <div className="space-y-6">
          {sortedRecords.map((record, idx) => {
            const articleTitle = articleMap.get(record.article_id) || 'Unknown Article';
            
            return (
              <div key={record.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      סשן #{idx + 1}: {articleTitle}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(record.created_at).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-center bg-purple-100 rounded-lg px-4 py-2">
                    <p className="text-3xl font-bold text-purple-900">{record.final_average_score || 0}</p>
                    <p className="text-xs text-purple-700">ציון סופי</p>
                  </div>
                </div>

                {/* Sub-scores */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {record.comprehension_score !== null && (
                    <div className="text-center bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-700 font-medium mb-1">הבנה</p>
                      <p className="text-2xl font-bold text-blue-900">{record.comprehension_score}</p>
                    </div>
                  )}
                  {record.critical_thinking_score !== null && (
                    <div className="text-center bg-purple-50 rounded-lg p-3">
                      <p className="text-sm text-purple-700 font-medium mb-1">חשיבה ביקורתית</p>
                      <p className="text-2xl font-bold text-purple-900">{record.critical_thinking_score}</p>
                    </div>
                  )}
                  {record.quality_score !== null && (
                    <div className="text-center bg-pink-50 rounded-lg p-3">
                      <p className="text-sm text-pink-700 font-medium mb-1">איכות</p>
                      <p className="text-2xl font-bold text-pink-900">{record.quality_score}</p>
                    </div>
                  )}
                </div>

                {/* Question Scores */}
                {record.question_scores.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">ציונים לפי שאלה:</p>
                    <div className="flex flex-wrap gap-2">
                      {record.question_scores.map((score, qIdx) => (
                        <span
                          key={qIdx}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            score >= 90
                              ? 'bg-green-100 text-green-700'
                              : score >= 70
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          ש{qIdx + 1}: {score}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Difficulty Path */}
                {record.difficulty_path.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">מסלול קושי:</p>
                    <div className="flex items-center gap-2">
                      {record.difficulty_path.map((level, dIdx) => (
                        <div key={dIdx} className="flex items-center">
                          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                            {dIdx === 0 ? 'התחלה' : `ש${dIdx}`}: רמה {level}
                          </span>
                          {dIdx < record.difficulty_path.length - 1 && (
                            <span className="text-gray-400 mx-1">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}