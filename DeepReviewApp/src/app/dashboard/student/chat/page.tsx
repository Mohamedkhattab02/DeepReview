"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/student/ChatInterface";

export default function ChatPage() {
  return <ChatInterface articleId={""} articleTitle={""} initialMessages={[]}/>;
}
