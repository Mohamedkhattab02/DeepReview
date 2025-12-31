// src/app/(dashboard)/student/chat/[articleId]/page.tsx
import { getArticleById } from "@/actions/articles";
import { getChatHistory } from "@/actions/chat";
import ChatInterface from "@/components/student/ChatInterface";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ChatPage({
  params,
}: {
  params: { articleId: string };
}) {
  const { articleId } =await params;

  // קבלת המאמר
  const article = await getArticleById(articleId);
console.log("ARTICLE ID FROM URL:", articleId);
console.log("ARTICLE FROM DB:", article);

  if (!article) {
    notFound();
  }

  // קבלת היסטוריית השיחה
  const chatHistory = await getChatHistory(articleId);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Back Button */}
      <div className="mb-4">
        <Link
          href="/student"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 min-h-0">
        <ChatInterface
          articleId={articleId}
          articleTitle={article.title}
          initialMessages={chatHistory}
        />
      </div>
    </div>
  );
}

