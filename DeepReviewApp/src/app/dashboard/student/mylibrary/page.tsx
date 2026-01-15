// app/(dashboard)/student/mylibrary/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { getMyArticles } from "@/actions/articles";
import ArticleCard from "@/components/student/ArticleCard";
import Link from "next/link";
import { Article } from "@/types/article";

export default function MyLibraryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const loadArticles = useCallback(async () => {
    try {
      const data = await getMyArticles();
      setArticles(data);
      return data;
    } catch (error) {
      console.error("Failed to load articles:", error);
      return [];
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await loadArticles();
      setLoading(false);
    };
    initLoad();
  }, [loadArticles]);

  // Auto-refresh polling when there are articles being analyzed
  useEffect(() => {
    const hasAnalyzing = articles.some((a) => !a.analysis_completed);
    
    if (!hasAnalyzing) return;

    const pollInterval = setInterval(async () => {
      await loadArticles();
    }, 1000); // Check every 1 seconds

    return () => clearInterval(pollInterval);
  }, [articles, loadArticles]);

  const handleDelete = () => {
    loadArticles(); // Refresh after delete
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  const analyzedCount = articles.filter((a) => a.analysis_completed).length;
  const analyzingCount = articles.length - analyzedCount;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Library
          </h1>
          <p className="text-gray-600 mt-2">
            Your uploaded articles and research papers
          </p>
        </div>
        <Link
          href="/dashboard/student/upload"
        className="px-10 py-5 rounded-2xl font-bold text-l bg-gradient-to-r from-blue-600 to-purple-600 text-white !opacity-100 dark:!opacity-100 dark:!text-white dark:![filter:brightness(1.2)] transition shadow-xl"
        >
          ➕ Upload New Article
        </Link>
      </div>

      {/* Articles */}
      {articles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
          <div className="text-7xl mb-6">📚</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Your library is empty
          </h3>
          <p className="text-gray-600 mb-8">
            Upload your first article to get started
          </p>
          <Link
            href="/dashboard/student/upload"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-bold shadow-lg"
          >
            Upload Article
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Stats Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 flex-1">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-bold text-blue-900">
                  {articles.length} {articles.length === 1 ? "Article" : "Articles"}
                </p>
                <p className="text-sm text-blue-700">
                  {analyzedCount} analyzed
                </p>
              </div>
            </div>

            {/* Analyzing Status Card - Shows when articles are being analyzed */}
            {analyzingCount > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-3 flex-1 animate-pulse">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                <div>
                  <p className="font-bold text-amber-900">
                    {analyzingCount} {analyzingCount === 1 ? "Article" : "Articles"} Analyzing
                  </p>
                  <p className="text-sm text-amber-700">
                    Auto-refreshing...
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                showActions={true}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}