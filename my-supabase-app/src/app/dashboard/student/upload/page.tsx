"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      if (!title) setTitle(droppedFile.name.replace(/\.pdf$/i, ""));
      setError("");
    } else {
      setError("Please upload a PDF file");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.pdf$/i, ""));
      setError("");
    } else {
      setFile(null);
      setError("Please upload a PDF file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title.trim()) {
      setError("Please provide both file and title");
      return;
    }

    setUploading(true);
    setError("");
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 10 : p));
    }, 400);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      const raw = await response.text();
      console.log("STATUS:", response.status);
      console.log("RAW RESPONSE:", raw);

      let data: any = null;
      try {
        data = JSON.parse(raw);
      } catch {
        const preview = raw?.slice(0, 200) || "";
        throw new Error(
          `Server returned non-JSON (status ${response.status}). Preview: ${preview}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.details || `Upload failed (status ${response.status})`
        );
      }

      // Success
      setTimeout(() => {
        router.push("/dashboard/student/mylibrary");
        router.refresh();
      }, 400);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Upload failed");
      setProgress(0);
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Upload Article
        </h1>
        <p className="text-gray-600 mt-2">
          Upload a research paper to analyze and discuss
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Article Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title..."
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ring-blue-500 outline-none transition"
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              PDF File
            </label>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {file ? (
                <div className="space-y-3">
                  <div className="text-5xl">📄</div>
                  <div>
                    <p className="font-bold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-6xl">📁</div>
                  <div>
                    <p className="text-lg font-bold text-gray-700">
                      Drop your PDF here
                    </p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-input"
                  />

                  <label
                    htmlFor="file-input"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer font-medium"
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !file || !title.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {uploading ? "Uploading..." : "Upload & Analyze"}
          </button>
        </form>
      </div>
    </div>
  );
}
