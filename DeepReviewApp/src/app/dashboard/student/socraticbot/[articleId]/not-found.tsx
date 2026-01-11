
// src/app/(dashboard)/student/chat/[articleId]/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="text-6xl">📄</div>
      <h2 className="text-2xl font-bold text-gray-900">Article Not Found</h2>
      <p className="text-gray-600">
        The article you're looking for doesn't exist or you don't have access to
        it.
      </p>
      <Link
        href="/student"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}