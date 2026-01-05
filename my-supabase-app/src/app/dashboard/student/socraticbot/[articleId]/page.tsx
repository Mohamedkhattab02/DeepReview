// src/app/(dashboard)/student/socraticbot/[articleId]/page.tsx
import { getArticleById } from "@/actions/articles";
import {getSocraticSession,createSocraticSession,
} from "@/actions/socraticbot";
//import ChatInterfaceSocratic from "@/components/student/ChatInterfaceSocratic";
import ChatInterfaceSocratic from "@/components/student/ChatInterfacesocratic"
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function SocraticBotPage({
  params,
}: {
  params: { articleId: string };
}) {
  const { articleId } = await params;

  // קבלת המאמר
  const article = await getArticleById(articleId);

  if (!article) {
    notFound();
  }

  // בדיקה אם המאמר נוּתח
  if (!article.analysis_completed) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="text-6xl">⏳</div>
        <h2 className="text-2xl font-bold text-gray-900">
          Article Still Processing
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          This article is still being analyzed by AI. Please wait a few moments
          and refresh the page.
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

  // חיפוש או יצירת סשן סוקרטי
  let session = await getSocraticSession(articleId);

  if (!session) {
    session = await createSocraticSession(articleId);
    if (!session) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="text-6xl">❌</div>
          <h2 className="text-2xl font-bold text-gray-900">
            Failed to Create Session
          </h2>
          <p className="text-gray-600">
            Unable to start Socratic session. Please try again.
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
  }

  // אם הסשן הושלם - הצג הודעה
  if (session.is_completed) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="mb-4">
          <Link
            href="/dashboard/student"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-12 space-y-6">
          <div className="text-8xl">🎓</div>
          <h2 className="text-3xl font-bold text-gray-900 text-center">
            Session Already Completed!
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            You've already completed the Socratic learning session for this
            article. Would you like to start a new one?
          </p>
          <div className="flex gap-4">
            <Link
              href="/dashboard/student"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Return to Dashboard
            </Link>
            <form action={async () => {
              'use server'
              await createSocraticSession(articleId);
              redirect(`/dashboard/student/socraticbot/${articleId}`);
            }}>
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium"
              >
                🔄 Start New Session
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Back Button */}
      <div className="mb-4">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 min-h-0">
        <ChatInterfaceSocratic
          articleId={articleId}
          articleTitle={article.title}
          sessionId={session.id}
          initialSession={session}
        />
      </div>
    </div>
  );
}