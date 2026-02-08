/**
 * Socratic chat page for students.
 * Serves as a client-side entry point that renders the ChatInterfaceSocratic component.
 * Initializes the Socratic session context for guided, question-based learning.
 */

"use client";

import ChatInterfaceSocratic from "@/components/student/ChatInterfacesocratic";

import { SocraticMessage } from "@/types/socraticMessage";

export default function ChatPage() {
  return (
    <ChatInterfaceSocratic
      articleId=""
      articleTitle=""
      sessionId=""
      initialSession={{} as SocraticMessage}
    />
  );
}