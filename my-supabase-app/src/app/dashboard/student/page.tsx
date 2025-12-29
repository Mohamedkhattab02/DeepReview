// src/app/(dashboard)/student/page.tsx
import { getArticles } from '@/actions/articles'
import ArticleCard from '@/components/student/ArticleCard'
//import ProgressTracker from '@/components/student/ProgressTracker'
import Link from 'next/link'

export default async function StudentDashboard() {
  const articles = await getArticles()
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Explore research articles from the community</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/student/mylibrary"
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            📚 My Library
          </Link>
          <Link
            href="/student/upload"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
          >
            ➕ Upload Article
          </Link>
        </div>
      </div>
      
      {/* Progress Tracker */}

     { /*<ProgressTracker />*/}
      
      {/* Articles Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">All Articles</h2>
          <span className="text-sm text-gray-600">{articles.length} articles available</span>
        </div>
        
        {articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles yet</h3>
            <p className="text-gray-600 mb-6">Be the first to upload an article!</p>
            <Link
              href="/student/upload"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Your First Article
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} showActions={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}