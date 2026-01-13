// src/app/(dashboard)/instructor/articles/page.tsx
import { getAllArticles } from "@/actions/instructor";
import ArticleManager from "@/components/instructor/ArticleManager";

export default async function ArticlesPage() {
  const articles = await getAllArticles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Article Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all uploaded articles
        </p>
      </div>

      <ArticleManager articles={articles} />
    </div>
  );
}