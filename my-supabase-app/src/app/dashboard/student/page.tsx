// app/(dashboard)/student/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getArticles, getArticlesCount } from "@/actions/articles";
import ArticleCard from "@/components/student/ArticleCard";
import Link from "next/link";
import { Article } from "@/types/article";

const ARTICLES_PER_PAGE = 6;

export default function StudentDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadInitialArticles();
  }, []);

  const loadInitialArticles = async () => {
    setLoading(true);
    try {
      const [articlesData, count] = await Promise.all([
        getArticles(ARTICLES_PER_PAGE, 0),
        getArticlesCount(),
      ]);
      setArticles(articlesData);
      setTotalCount(count);
    } catch (error) {
      console.error("Failed to load articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const offset = currentPage * ARTICLES_PER_PAGE;
      const moreArticles = await getArticles(ARTICLES_PER_PAGE, offset);
      setArticles((prev) => [...prev, ...moreArticles]);
      setCurrentPage((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to load more articles:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = articles.length < totalCount;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Community Articles
          </h1>
          <p className="text-gray-600 mt-2">
            Explore research articles from the community
          </p>
        </div>
      </div>

      {/* Articles Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Latest Articles
          </h2>
          <span className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
            Showing {articles.length} of {totalCount} articles
          </span>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <div className="text-7xl mb-6">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No articles yet
            </h3>
            <p className="text-gray-600 mb-8">
              Be the first to upload an article and start learning!
            </p>
            <Link
              href="/dashboard/student/upload"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-bold shadow-lg"
            >
              Upload Your First Article
            </Link>
          </div>
        ) : (
          <>
            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  showActions={false}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-gray-700 text-white px-10 py-4 rounded-xl hover:bg-gray-800 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg inline-flex items-center gap-3"
                >
                  {loadingMore ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Articles
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {totalCount - articles.length} remaining
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}