// src/components/student/ArticleCard.tsx
'use client'

import { Article } from '@/types/article'
import { deleteArticle } from '@/actions/articles'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ArticleCardProps {
  article: Article
  showActions?: boolean
}

export default function ArticleCard({ article, showActions = true }: ArticleCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) return
    
    setIsDeleting(true)
    try {
      await deleteArticle(article.id)
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete article')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const handleChat = () => {
    router.push(`/student/chat?articleId=${article.id}`)
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {article.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {article.authors.join(', ')}
          </p>
          {article.publication_year && (
            <p className="text-xs text-gray-500">
              Published: {article.publication_year}
            </p>
          )}
        </div>
        {article.analysis_completed && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            Analyzed
          </span>
        )}
      </div>
      
      {article.abstract && (
        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
          {article.abstract}
        </p>
      )}
      
      {article.main_topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.main_topics.slice(0, 3).map((topic, idx) => (
            <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
              {topic}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleChat}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Start Chat
        </button>
        {showActions && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  )
}