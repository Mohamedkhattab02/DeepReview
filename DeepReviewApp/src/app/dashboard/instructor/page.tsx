// src/app/(dashboard)/instructor/page.tsx
/**
 * Instructor dashboard page.
 * Displays high-level statistics about students, articles, and learning sessions.
 * Provides quick navigation to student management, analytics, and article administration.
 */

import { getInstructorStats } from "@/actions/instructor";
import Link from "next/link";

export default async function InstructorDashboard() {
  const stats = await getInstructorStats();

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: "👥",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Total Articles",
      value: stats.totalArticles,
      icon: "📚",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Completed Sessions",
      value: stats.completedSessions,
      icon: "✅",
      color: "from-green-500 to-green-600",
    },
    {
      title: "Average Score",
      value: stats.averageScore,
      icon: "📊",
      color: "from-pink-500 to-pink-600",
    },
  ];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Instructor Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Overview of your students' progress and performance
        </p>
      </div>

      {/* Stats Grid (DISPLAY ONLY) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="group">
            <div
              className={`bg-gradient-to-br ${stat.color} text-white rounded-2xl p-6 shadow-lg transition-all transform hover:scale-105`}
            >
              <div className="text-5xl mb-3">{stat.icon}</div>
              <div className="text-4xl font-bold mb-1">
                {stat.value}
              </div>
              <div className="text-white/80 text-sm">
                {stat.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions (NAVIGATION) */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Students */}
          <Link
            href="/dashboard/instructor/students"
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <div className="text-4xl">👥</div>
            <div>
              <div className="font-semibold text-gray-900">
                View Students
              </div>
              <div className="text-sm text-gray-600">
                Monitor student progress
              </div>
            </div>
          </Link>

          {/* Analytics */}
          <Link
            href="/dashboard/instructor/analytics"
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition"
          >
            <div className="text-4xl">📊</div>
            <div>
              <div className="font-semibold text-gray-900">
                Analytics
              </div>
              <div className="text-sm text-gray-600">
                View detailed charts
              </div>
            </div>
          </Link>

          {/* Articles */}
          <Link
            href="/dashboard/instructor/articles"
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition"
          >
            <div className="text-4xl">📚</div>
            <div>
              <div className="font-semibold text-gray-900">
                Manage Articles
              </div>
              <div className="text-sm text-gray-600">
                Review and organize
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
