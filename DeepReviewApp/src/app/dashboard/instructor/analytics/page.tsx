// src/app/(dashboard)/instructor/analytics/page.tsx
import { getAnalyticsData } from "@/actions/instructor";
import AnalyticsDashboard from "@/components/instructor/AnalyticsDashboard";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Detailed insights and performance metrics
        </p>
      </div>

      <AnalyticsDashboard
        progressOverTime={data.progressOverTime}
        scoreDistribution={data.scoreDistribution}
        topStudents={data.topStudents}
      />
    </div>
  );
}