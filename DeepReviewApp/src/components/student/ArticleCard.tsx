// components/student/ArticleCard.tsx
"use client";

import { Article } from "@/types/article";
import Link from "next/link";
import { deleteArticle, getArticleReadPayload, type ArticleReadPayload } from "@/actions/articles";
import { useState } from "react";
import ExportButton from "../shared/ExportButton";

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
  const [openRead, setOpenRead] = useState(false);
  const [readLoading, setReadLoading] = useState(false);
  const [readData, setReadData] = useState<ArticleReadPayload | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [showAbstract, setShowAbstract] = useState(true);

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

  const handleRead = async () => {
    setOpenRead(true);

    if (readData) return;

    setReadLoading(true);
    try {
      const payload = await getArticleReadPayload(article.id);

      if (!payload) {
        alert("Failed to load article content");
        setOpenRead(false);
        return;
      }

      setReadData(payload);
    } catch (e) {
      console.error(e);
      alert("Failed to load article content");
      setOpenRead(false);
    } finally {
      setReadLoading(false);
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

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));

  return (
    <>
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
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
                ✓ Analyzed
              </span>
            ) : (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full ml-2 animate-pulse flex-shrink-0">
                ⏳ Processing
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {article.abstract && (
            <p className="text-gray-600 text-sm line-clamp-3">
              {article.abstract}
            </p>
          )}

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
              {article.main_topics.length > 3 && (
                <span className="text-xs text-gray-500 self-center">
                  +{article.main_topics.length - 3} more
                </span>
              )}
            </div>
          )}

          {article.keywords && article.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.keywords.slice(0, 4).map((keyword, idx) => (
                <span
                  key={idx}
                  className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
            <span className="flex items-center gap-1">
              📅 {formatDate(article.uploaded_at)}
            </span>
            {article.pages != null && (
              <span className="flex items-center gap-1">📄 {article.pages}p</span>
            )}
            {article.publication_year != null && (
              <span className="flex items-center gap-1">📆 {article.publication_year}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 border-t flex gap-2">

              <button
            onClick={handleRead}
            className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition font-medium text-sm"
          >
            📖Read
          </button>

          <Link
            href={`/dashboard/student/chat/${article.id}`}
            className="px-2 py-1 rounded-2xl font-bold text-l bg-blue-900 text-white !opacity-100 dark:!opacity-100 dark:!text-white dark:![filter:brightness(1.2)] transition shadow-xl"
          >
            💬Chat
          </Link>

      
            <Link
            href={`/dashboard/student/socraticbot/${article.id}`}
            className="px-2 py-1 rounded-2xl font-bold text-l bg-blue-900 text-white !opacity-100 dark:!opacity-100 dark:!text-white dark:![filter:brightness(1.2)] transition shadow-xl"
          >
            💬socratic
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

      {/* Enhanced Reading Modal */}
      {openRead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpenRead(false)}
        >
          <div
            className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="min-w-0 flex-1 mr-4">
                <h4 className="font-bold text-lg truncate">
                  {readData?.title ?? article.title ?? "Article"}
                </h4>
                {article.authors && article.authors.length > 0 && (
                  <p className="text-sm text-blue-100 mt-1">
                    {article.authors.join(", ")}
                  </p>
                )}
              </div>

              <button
                onClick={() => setOpenRead(false)}
                className="text-white hover:bg-white/20 px-3 py-2 rounded-lg transition flex-shrink-0"
              >
                ✕
              </button>
            </div>

          {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAbstract(!showAbstract)}
                  className="text-sm px-4 py-2 rounded-lg transition bg-blue-600 dark:bg-blue-600 text-white dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600 font-medium"
                >
                  {showAbstract ? "Hide Abstract" : "Show Abstract"}
                </button>
                
                <ExportButton
                  type="abstract"
                  data={{
                    title: article.title,
                    authors: article.authors,
                    abstract: article.abstract || "No abstract available",
                  }}
                  label="Export Abstract"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Font Size:</span>
                <button
                  onClick={decreaseFontSize}
                  className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition border border-gray-200 dark:border-slate-600"
                >
                  A-
                </button>
                <span className="text-sm font-mono w-12 text-center text-gray-700 dark:text-gray-300">
                  {fontSize}px
                </span>
                <button
                  onClick={increaseFontSize}
                  className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition border border-gray-200 dark:border-slate-600"
                >
                  A+
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 space-y-6">
                {/* Abstract Section */}
                {showAbstract && (readData?.abstract || article.abstract) && (
                  <div className="border-l-4 border-blue-500 pl-6 py-2 bg-blue-50 rounded-r-lg">
                    <h5 className="font-bold text-gray-900 mb-3 text-lg">Abstract</h5>
                    <div
                      className="text-gray-700 leading-relaxed"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {readLoading
                        ? "Loading..."
                        : (readData?.abstract ?? article.abstract ?? "No abstract available")}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {(article.keywords?.length > 0 || article.main_topics?.length > 0) && (
                  <div className="space-y-3 py-4 border-y">
                    {article.keywords && article.keywords.length > 0 && (
                      <div>
                        <h6 className="text-sm font-semibold text-gray-700 mb-2">Keywords:</h6>
                        <div className="flex flex-wrap gap-2">
                          {article.keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {article.main_topics && article.main_topics.length > 0 && (
                      <div>
                        <h6 className="text-sm font-semibold text-gray-700 mb-2">Topics:</h6>
                        <div className="flex flex-wrap gap-2">
                          {article.main_topics.map((topic, idx) => (
                            <span
                              key={idx}
                              className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Full Content */}
                <div>
                  <h5 className="font-bold text-gray-900 mb-4 text-lg">Full Content</h5>

                  {readLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600">Loading content...</p>
                    </div>
                  ) : readData?.contentText ? (
                    <div
                      className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                      style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                    >
                      {readData.contentText}
                    </div>
                  ) : readData?.pdfUrl ? (
                    <div className="border rounded-xl overflow-hidden shadow-lg">
                      <iframe
                        title="PDF Preview"
                        src={readData.pdfUrl}
                        className="w-full h-[60vh]"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-4xl mb-3">📄</div>
                      <p className="text-gray-600 mb-2">No full content available</p>
                      <p className="text-sm text-gray-500">
                        This article may not have extracted text
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {article.pages && `${article.pages} pages`}
                {article.publication_year && ` • Published ${article.publication_year}`}
              </div>
              <button
                onClick={() => setOpenRead(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}