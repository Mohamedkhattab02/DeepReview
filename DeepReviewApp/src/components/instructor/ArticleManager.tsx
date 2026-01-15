// src/components/instructor/ArticleManager.tsx
"use client";

import { useState } from "react";
import { deleteArticleAsInstructor } from "@/actions/instructor";

interface Article {
  id: string;
  title: string;
  authors: string[];
  uploaded_at: string;
  analysis_completed: boolean;
  users?: {
    full_name: string;
    email: string;
  };
}

interface ArticleManagerProps {
  articles: Article[];
}

export default function ArticleManager({ articles }: ArticleManagerProps) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.authors.some((author) => author.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (articleId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;

    setDeleting(articleId);
    try {
      const result = await deleteArticleAsInstructor(articleId);
      if (result.success) {
        window.location.reload();
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete article");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
        <a
          href="/dashboard/instructor"
        className="text-white hover:text-white dark:text-white dark:hover:text-white text-lg font-semibold bg-red-900 px-6 py-3 rounded-xl transition hover:bg-red-800 shadow-md">
        
          ← Back to Dashboard
        </a>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Article Management</h2>
        <span className="text-sm text-gray-600">
          {filteredArticles.length} of {articles.length} articles
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search articles..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-900 line-clamp-2 flex-1">
                {article.title}
              </h3>
              {article.analysis_completed && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
                  ✓
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-3">
              {article.authors.slice(0, 2).join(", ")}
              {article.authors.length > 2 && ` +${article.authors.length - 2}`}
            </p>

            <div className="text-xs text-gray-500 mb-4">
              <div>Uploaded by: {article.users?.full_name || "Unknown"}</div>
              <div>
                {new Date(article.uploaded_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            <button
              onClick={() => handleDelete(article.id, article.title)}
              disabled={deleting === article.id}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition disabled:opacity-50 text-sm font-medium"
            >
              {deleting === article.id ? "Deleting..." : "Delete Article"}
            </button>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Articles Found
          </h3>
          <p className="text-gray-600">
            {search ? "Try a different search term" : "No articles uploaded yet"}
          </p>
        </div>
      )}
    </div>
  );
}