// components/student/ArticleCard.tsx
"use client";

import { Article } from "@/types/article";
import Link from "next/link";
import { deleteArticle } from "@/actions/articles";
import { useState } from "react";

interface ArticleCardProps {
  article: Article;
  showActions?: boolean;
  onDelete?: () => void;
}

export default function ArticleCard({
  article,
  showActions = false,
  onDelete,
}: ArticleCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    setDeleting(true);
    try {
      const success = await deleteArticle(article.id);

      if (success) {
        onDelete?.();
      } else {
        alert("Failed to delete article");
        setDeleting(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete article");
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white line-clamp-2">
              {article.title}
            </h3>

            {article.authors && article.authors.length > 0 && (
              <p className="text-blue-100 text-sm mt-1">
                {article.authors.slice(0, 2).join(", ")}
                {article.authors.length > 2 &&
                  ` +${article.authors.length - 2} more`}
              </p>
            )}
          </div>

          {article.analysis_completed ? (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2">
              ✓ Analyzed
            </span>
          ) : (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full ml-2 animate-pulse">
              ⏳ Processing
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Abstract */}
        {article.abstract && (
          <p className="text-gray-600 text-sm line-clamp-3">
            {article.abstract}
          </p>
        )}

        {/* Topics */}
        {article.main_topics && article.main_topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.main_topics.slice(0, 3).map((topic, idx) => (
              <span
                key={idx}
                className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
          <span>📅 {formatDate(article.uploaded_at)}</span>
          {article.pages != null && <span>📄 {article.pages} pages</span>}
          {article.publication_year != null && (
            <span>📆 {article.publication_year}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t flex gap-2">
        <Link
          href={`/student/chat/${article.id}`}
          className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
        >
          💬 Chat
        </Link>

        {showActions && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm"
          >
            {deleting ? "..." : "🗑️"}
          </button>
        )}
      </div>
    </div>
  );
}
