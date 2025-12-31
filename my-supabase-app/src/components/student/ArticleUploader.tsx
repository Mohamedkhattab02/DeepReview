'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ArticleUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()

  // -----------------------------
  // Drag & Drop handlers
  // -----------------------------
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError(null)

    const droppedFile = e.dataTransfer.files?.[0]
    if (!droppedFile) return

    if (droppedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file only')
      return
    }

    setFile(droppedFile)
    setTitle(droppedFile.name.replace(/\.pdf$/i, ''))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file only')
      return
    }

    setFile(selectedFile)
    setTitle(selectedFile.name.replace(/\.pdf$/i, ''))
  }

  // -----------------------------
  // Submit
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Upload failed')
      }

      // הצלחה
      setSuccess(true)
      setFile(null)
      setTitle('')

      // מעבר חלק לדף הספרייה
      setTimeout(() => {
        router.push('/dashboard/student/mylibrary')
        router.refresh()
      }, 1200)

    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // -----------------------------
  // UI
  // -----------------------------
 return (
  <div className="max-w-2xl mx-auto">
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="space-y-4">
            <div className="text-6xl">📄</div>

            {file ? (
              <div className="space-y-2">
                <p className="text-lg font-medium text-green-600">
                  ✓ File Selected
                </p>
                <p className="text-sm text-gray-600">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Drag and drop your PDF here
                </p>
                <p className="text-sm text-gray-500">or click to browse</p>
                <p className="text-xs text-gray-400">
                  Max file size: 10MB
                </p>
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Title Input */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Article Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter article title (auto-filled from filename)"
          required
          disabled={isUploading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!file || !title || isUploading}
        className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg
                   hover:bg-blue-700 transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed
                   font-semibold text-lg shadow-lg disabled:shadow-none"
      >
        {isUploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
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
                d="M4 12a8 8 0 018-8V0
                   C5.373 0 0 5.373 0 12h4
                   zm2 5.291A7.962 7.962 0 014 12H0
                   c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Uploading & Analyzing...
          </span>
        ) : (
          '🚀 Upload & Analyze Article'
        )}
      </button>
    </form>

    {/* Info Box – הוחזר במלואו */}
    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <span>💡</span> What happens after upload?
      </h3>
      <ul className="space-y-2 text-sm text-blue-800">
        <li className="flex items-start gap-2">
          <span className="text-blue-600">1.</span>
          <span>PDF is uploaded securely to cloud storage</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-600">2.</span>
          <span>AI extracts text and metadata from the document</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-600">3.</span>
          <span>
            Gemini AI analyzes content: authors, abstract, keywords, topics
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-600">4.</span>
          <span>Article becomes available for Socratic discussions</span>
        </li>
      </ul>
    </div>
  </div>
)}