// src/components/instructor/AnalyticsDashboard.tsx
"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsProps {
  progressOverTime: any[];
  scoreDistribution: any[];
  topStudents: any[];
}

export default function AnalyticsDashboard({
  progressOverTime,
  scoreDistribution,
  topStudents,
}: AnalyticsProps) {
  // Format data for charts
  const timeData = progressOverTime.map((p) => ({
    date: new Date(p.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: p.final_average_score || 0,
  }));

  // Group scores into ranges
  const scoreRanges = {
    "90-100": 0,
    "80-89": 0,
    "70-79": 0,
    "60-69": 0,
    "0-59": 0,
  };

  scoreDistribution.forEach((s: any) => {
    const score = s.final_average_score || 0;
    if (score >= 90) scoreRanges["90-100"]++;
    else if (score >= 80) scoreRanges["80-89"]++;
    else if (score >= 70) scoreRanges["70-79"]++;
    else if (score >= 60) scoreRanges["60-69"]++;
    else scoreRanges["0-59"]++;
  });

  const distributionData = Object.entries(scoreRanges).map(([range, count]) => ({
    range,
    count,
  }));

  return (
    <div className="space-y-8">
            {/* Back Button */}
      <a
        href="/dashboard/instructor"
        className="text-white hover:text-white dark:text-white dark:hover:text-white text-lg font-semibold bg-red-900 px-6 py-3 rounded-xl transition hover:bg-red-800 shadow-md">
      
        ← Back to Dashboard
      </a>

      {/* Progress Over Time */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Progress Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis domain={[0, 100]} stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#6b7280' }} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Score Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Score Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" />
            <XAxis dataKey="range" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#6b7280' }} />
            <Bar dataKey="count" fill="#8b5cf6" name="Students" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Students */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Top Performing Students
        </h3>
        <div className="space-y-3">
          {topStudents.slice(0, 5).map((student: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-white">
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {student.users?.full_name || "Unknown"}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {student.final_average_score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}