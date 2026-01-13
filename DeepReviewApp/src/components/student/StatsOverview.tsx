// components/student/StatsOverview.tsx
import { StudentProgress } from "@/types/StudentProgress";
import { Article } from "@/types/article";
import { BookOpen, Brain, MessageCircle, TrendingUp, Award, Target } from "lucide-react";

interface StatsOverviewProps {
  articles: Article[];
  progressRecords: StudentProgress[];
  totalMessages: number;
  totalSocraticQuestions: number;
}

export default function StatsOverview({
  articles,
  progressRecords,
  totalMessages,
  totalSocraticQuestions,
}: StatsOverviewProps) {
  // Calculate stats
  const totalArticles = articles.length;
  const completedSessions = progressRecords.filter(p => p.final_average_score !== null).length;
  
  const averageScore = completedSessions > 0
    ? Math.round(
        progressRecords
          .filter(p => p.final_average_score !== null)
          .reduce((sum, p) => sum + (p.final_average_score || 0), 0) / completedSessions
      )
    : 0;

  const allScores = progressRecords
    .filter(p => p.question_scores && p.question_scores.length > 0)
    .flatMap(p => p.question_scores);
  
  const highestScore = allScores.length > 0 ? Math.max(...allScores) : 0;

  // Calculate average comprehension, critical thinking, quality
  const avgComprehension = completedSessions > 0
    ? Math.round(
        progressRecords
          .filter(p => p.comprehension_score !== null)
          .reduce((sum, p) => sum + (p.comprehension_score || 0), 0) / 
        progressRecords.filter(p => p.comprehension_score !== null).length
      )
    : 0;

  const avgCriticalThinking = completedSessions > 0
    ? Math.round(
        progressRecords
          .filter(p => p.critical_thinking_score !== null)
          .reduce((sum, p) => sum + (p.critical_thinking_score || 0), 0) / 
        progressRecords.filter(p => p.critical_thinking_score !== null).length
      )
    : 0;

  const avgQuality = completedSessions > 0
    ? Math.round(
        progressRecords
          .filter(p => p.quality_score !== null)
          .reduce((sum, p) => sum + (p.quality_score || 0), 0) / 
        progressRecords.filter(p => p.quality_score !== null).length
      )
    : 0;

  const stats = [
    {
      title: "Uploaded articles",
      value: totalArticles,
      icon: BookOpen,
      color: "indigo",
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-600",
      borderColor: "border-indigo-500",
    },
    {
      title: "Completed sessions",
      value: completedSessions,
      icon: Target,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
      borderColor: "border-purple-500",
    },
    {
      title: "Messages sent",
      value: totalMessages,
      icon: MessageCircle,
      color: "pink",
      bgColor: "bg-pink-100",
      textColor: "text-pink-600",
      borderColor: "border-pink-500",
    },
    {
      title: "Socratic Questions",
      value: totalSocraticQuestions,
      icon: Brain,
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      borderColor: "border-blue-500",
    },
    {
      title: "Average Score",
      value: averageScore,
      suffix: "/100",
      icon: TrendingUp,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      borderColor: "border-green-500",
    },
    {
      title: "Highest Score",
      value: highestScore,
      suffix: "/100",
      icon: Award,
      color: "yellow",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
      borderColor: "border-yellow-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg p-6 border-r-4 ${stat.borderColor} transform hover:scale-105 transition-transform duration-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">{stat.title}</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {stat.value}
                    {stat.suffix && <span className="text-2xl text-gray-500">{stat.suffix}</span>}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-4 rounded-full`}>
                  <Icon className={stat.textColor} size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Scores */}
      {completedSessions > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Brain className="text-purple-600" size={24} />
            Detailed scores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Comprehension */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Comprehension</span>
                <span className="text-lg font-bold text-indigo-600">{avgComprehension}/100</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${avgComprehension}%` }}
                />
              </div>
            </div>

            {/* Critical Thinking */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Critical Thinking</span>
                <span className="text-lg font-bold text-purple-600">{avgCriticalThinking}/100</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${avgCriticalThinking}%` }}
                />
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Quality</span>
                <span className="text-lg font-bold text-pink-600">{avgQuality}/100</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all duration-500"
                  style={{ width: `${avgQuality}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}