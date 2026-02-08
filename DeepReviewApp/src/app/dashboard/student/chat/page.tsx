/**
 * Student chat page.
 * Acts as a client-side entry point that renders the ChatInterface component.
 * Manages navigation context for interactive, article-based conversations.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/student/ChatInterface";

export default function ChatPage() {
  return <ChatInterface articleId={""} articleTitle={""} initialMessages={[]}/>;
}
