
// src/components/student/ChatInterface.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Message } from "@/types/message";
import { saveMessage } from "@/actions/chat";

interface ChatInterfaceProps {
  articleId: string;
  articleTitle: string;
  initialMessages: Message[];
}

export default function ChatInterface({
  articleId,
  articleTitle,
  initialMessages,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // הוספת הודעת המשתמש מיידית
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      article_id: articleId,
      user_id: "temp",
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      // שמירת הודעת המשתמש ב-DB
      await saveMessage(articleId, "user", userMessage);

      // קריאה ל-API של Gemini
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          message: userMessage,
          chatHistory: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // שמירת תשובת הבוט ב-DB
      await saveMessage(articleId, "assistant", data.message);

      // הוספת תשובת הבוט
      const assistantMessage: Message = {
        id: `temp-${Date.now()}-ai`,
        article_id: articleId,
        user_id: "temp",
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to send message"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex-shrink-0">
        <h2 className="text-xl font-bold truncate">{articleTitle}</h2>
        <p className="text-sm text-blue-100 mt-1">
          💬 Socratic Discussion • {messages.length} messages
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900">
              Start Your Discussion
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ask me anything about this article. I'll help you understand it
              deeply through thoughtful questions and discussion.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mt-6">
              <button
                onClick={() =>
                  setInput("What are the main findings of this article?")
                }
                className="bg-white border border-gray-300 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <span className="text-sm font-medium text-gray-900">
                  💡 What are the main findings?
                </span>
              </button>
              <button
                onClick={() =>
                  setInput("Explain the methodology used in this research")
                }
                className="bg-white border border-gray-300 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <span className="text-sm font-medium text-gray-900">
                  🔬 Explain the methodology
                </span>
              </button>
              <button
                onClick={() =>
                  setInput(
                    "What are the limitations of this study?"
                  )
                }
                className="bg-white border border-gray-300 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <span className="text-sm font-medium text-gray-900">
                  ⚠️ What are the limitations?
                </span>
              </button>
              <button
                onClick={() =>
                  setInput("How does this relate to other research?")
                }
                className="bg-white border border-gray-300 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <span className="text-sm font-medium text-gray-900">
                  🔗 Relation to other research
                </span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-md ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🤖</span>
                    <span className="text-xs font-semibold text-gray-500">
                      Socratic Assistant
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
                <span
                  className={`text-xs mt-2 block ${
                    msg.role === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">
                  Thinking deeply...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t bg-white p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this article... (Shift+Enter for new line)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex-shrink-0"
          >
            {isLoading ? "..." : "Send ➤"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: I use the Socratic method to help you think critically about
          the research
        </p>
      </form>
    </div>
  );
}