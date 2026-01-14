"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, BookOpen, AlertCircle, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/types/message";
import { saveMessage, clearChatHistory } from "@/actions/chat";
import { ar } from "zod/locales";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  articleId: string;
  articleTitle: string;
  initialMessages: Message[];
}

export default function ChatInterface({
  articleId,
  articleTitle,
  initialMessages = [],
}: ChatInterfaceProps) {
  // המרה של ההודעות הראשוניות מ-DB לפורמט של הקומפוננטה
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.created_at),
    }))
  );
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 📜 Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🎨 Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // 📨 Send message with proper DB persistence
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageContent = input.trim();
    setInput("");
    setIsLoading(true);
    setError(null);

    // הודעת משתמש זמנית עם ID ייחודי
    const tempUserMessage: ChatMessage = {
      role: "user",
      content: userMessageContent,
      timestamp: new Date(),
    };

    // הצג הודעה מיד בממשק
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      // 1️⃣ שמור הודעת משתמש ב-DB
      const savedUserMessage = await saveMessage(articleId, "user", userMessageContent);
      
      if (!savedUserMessage) {
        throw new Error("error saving user message");
      }

      // 2️⃣ שלח ל-API לקבלת תשובת AI
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          message: userMessageContent,
          chatHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.userFriendlyMessage || "error receiving response");
      }

      // 3️⃣ שמור תשובת AI ב-DB
      const savedAssistantMessage = await saveMessage(articleId, "assistant", data.message);
      
      if (!savedAssistantMessage) {
        throw new Error("error saving assistant message");
      }

      // 4️⃣ הצג תשובת AI בממשק
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "שגיאה לא ידועה";
      setError(errorMessage);
      console.error("Chat error:", err);
      
      // הסר את ההודעה הזמנית במקרה של שגיאה
      setMessages((prev) => prev.slice(0, -1));
      
      // החזר את הטקסט לשדה הקלט
      setInput(userMessageContent);
    } finally {
      setIsLoading(false);
    }
  };

  // ⌨️ Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 🗑️ Clear chat history
  const clearHistory = async () => {
    if (!confirm("Are you sure you want to clear the chat history? This action cannot be undone.")) {
      return;
    }

    setIsClearing(true);
    setError(null);

    try {
      const success = await clearChatHistory(articleId);

      if (success) {
        setMessages([]);
      } else {
        throw new Error("error clearing history");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "שגיאה במחיקת ההיסטוריה";
      setError(errorMessage);
      console.error("Clear history error:", err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
      {/* 🎯 Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              Academic Chat
            </h2>
            <p className="text-sm text-blue-100 mt-0.5 line-clamp-1">
              {articleTitle}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              disabled={isClearing}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2 rounded-xl transition-all disabled:opacity-50"
              title="Clear Chat History"
            >
              {isClearing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 💬 Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-8 rounded-3xl shadow-lg max-w-md">
              <Sparkles className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                👋 hello! I'm your academic assistant.
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Ask me <span className="font-semibold text-indigo-600">any question</span> about the article
                and I'll explain it in a <span className="font-semibold text-purple-600">clear and professional</span> way 🚀
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl shadow-sm">
                  <span className="text-2xl mb-1 block">🔍</span>
                  <span className="text-slate-700 font-medium">Deep Analysis</span>
                </div>
                <div className="bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl shadow-sm">
                  <span className="text-2xl mb-1 block">💡</span>
                  <span className="text-slate-700 font-medium">Simple Explanations</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}-${message.timestamp.getTime()}`}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } animate-fadeIn`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mr-3 ring-4 ring-purple-100">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl px-6 py-4 shadow-lg ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    : "bg-white border border-slate-200"
                }`}
              >
                <div
                  className={`prose prose-sm max-w-none ${
                    message.role === "user"
                      ? "prose-invert"
                      : "prose-slate prose-headings:font-bold prose-p:leading-relaxed prose-li:marker:text-indigo-600"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="m-0 leading-relaxed font-medium">
                      {message.content}
                    </p>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1 className="text-2xl font-bold text-indigo-900 mt-4 mb-3 flex items-center gap-2" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-xl font-bold text-indigo-800 mt-3 mb-2 flex items-center gap-2" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-lg font-semibold text-indigo-700 mt-2 mb-2" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="my-3 leading-relaxed text-slate-700" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="my-3 space-y-2" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="my-3 space-y-2" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="text-slate-700" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-bold text-indigo-900" {...props} />
                        ),
                        em: ({ node, ...props }) => (
                          <em className="italic text-purple-700" {...props} />
                        ),
                        code: ({ node, inline, ...props }: any) =>
                          inline ? (
                            <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded text-sm font-mono" {...props} />
                          ) : (
                            <code className="block bg-slate-100 text-slate-800 p-3 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
                          ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-slate-600 my-4 bg-indigo-50/50 py-2 rounded-r-lg" {...props} />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
                <div
                  className={`text-xs mt-3 pt-2 border-t ${
                    message.role === "user"
                      ? "text-blue-200 border-blue-400/30"
                      : "text-slate-400 border-slate-200"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString("he-IL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg ml-3 ring-4 ring-blue-100">
                  <span className="text-white font-bold text-sm">אתה</span>
                </div>
              )}
            </div>
          ))
        )}

        {/* 🔄 Loading indicator */}
        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mr-3 ring-4 ring-purple-100">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-lg max-w-[75%]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm text-slate-600 font-medium">
                 analyzing your question...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ⚠️ Error message */}
        {error && (
          <div className="flex justify-center animate-fadeIn">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 max-w-md">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">שגיאה</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ✍️ Input Area */}
      <div className="border-t border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-5">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="💭 Ask a question about the article..."
              className="w-full resize-none rounded-2xl border-2 border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 px-5 py-4 text-slate-800 placeholder-slate-400 transition-all duration-200 shadow-sm"
              rows={1}
              disabled={isLoading}
            />
            
          </div>

          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center gap-3 group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>sending...</span>
              </>
            ) : (
              <>
                <span>send</span>
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-3 text-center">
          💡 <span className="font-medium">Tip:</span> Ask specific questions for more accurate answers
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}