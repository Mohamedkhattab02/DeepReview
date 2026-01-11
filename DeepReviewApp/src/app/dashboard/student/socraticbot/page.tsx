"use client";

import ChatInterfaceSocratic from "@/components/student/ChatInterfacesocratic";
//import ChatInterfaceSocratic from "@/components/student/ChatInterfaceSocratic";

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