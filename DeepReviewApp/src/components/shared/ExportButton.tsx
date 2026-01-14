// src/components/shared/ExportButton.tsx
"use client";

import { useMemo, useState } from "react";

interface ExportButtonProps {
  type: "abstract" | "comparison";
  data: any;
  label?: string;
}

export default function ExportButton({ type, data, label }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // ✅ validate data before enabling export
  const isValid = useMemo(() => {
    if (!data) return false;

    if (type === "abstract") {
      return Boolean(data?.title && data?.abstract);
    }

    if (type === "comparison") {
      // must have these keys
      return Boolean(data?.article1 && data?.article2 && data?.comparisonData);
    }

    return false;
  }, [type, data]);

  const closeMenu = () => setShowMenu(false);

  const handleExport = async (format: "pdf" | "word") => {
    setIsExporting(true);
    closeMenu();

    try {
      if (!isValid) {
        throw new Error(
          `Export data is missing/invalid for type="${type}". Check the object keys.`
        );
      }

      // ✅ load exports only when needed
      const exports = await import("@/lib/export");

      if (type === "abstract") {
        const title = data.title ?? "";
        const authors = Array.isArray(data.authors) ? data.authors : [];
        const abstract = data.abstract ?? "";

        if (format === "pdf") {
          if (!exports.exportAbstractToPDF) {
            throw new Error("exportAbstractToPDF is not exported from @/lib/export");
          }
          await exports.exportAbstractToPDF(title, authors, abstract);
        } else {
          if (!exports.exportAbstractToWord) {
            throw new Error("exportAbstractToWord is not exported from @/lib/export");
          }
          await exports.exportAbstractToWord(title, authors, abstract);
        }
      }

      if (type === "comparison") {
        const { article1, article2, comparisonData } = data;

        if (format === "pdf") {
          if (!exports.exportComparisonToPDF) {
            throw new Error("exportComparisonToPDF is not exported from @/lib/export");
          }
          await exports.exportComparisonToPDF(article1, article2, comparisonData);
        } else {
          if (!exports.exportComparisonToWord) {
            throw new Error("exportComparisonToWord is not exported from @/lib/export");
          }
          await exports.exportComparisonToWord(article1, article2, comparisonData);
        }
      }
    } catch (error: any) {
      console.error("Export failed:", error);

      // ✅ show the REAL reason (so we can fix fast)
      const msg =
        error?.message ||
        (typeof error === "string" ? error : "Unknown export error");
      alert(`Failed to export: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu((s) => !s)}
        disabled={isExporting || !isValid}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
        title={!isValid ? "Select data first before exporting" : ""}
      >
        {isExporting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {label || "Export"}
          </>
        )}
      </button>

      {showMenu && !isExporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            Export as PDF
          </button>

          <button
            type="button"
            onClick={() => handleExport("word")}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
            </svg>
            Export as Word
          </button>
        </div>
      )}
    </div>
  );
}
