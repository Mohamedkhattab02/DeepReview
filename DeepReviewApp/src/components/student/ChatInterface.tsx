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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    if (textareaRef.current && !isLoading) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

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
    setError(null);

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
      await saveMessage(articleId, "user", userMessage);

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

      await saveMessage(articleId, "assistant", data.message);

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
      setError(error instanceof Error ? error.message : "Failed to send message");
      
      // Remove the temporary user message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));
      
      // Restore the input
      setInput(userMessage);
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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header with Glassmorphism */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-5 flex-shrink-0 shadow-xl">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-lg">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate drop-shadow-sm">
                {articleTitle}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-blue-100/90 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
                  Socratic Discussion
                </span>
                <span className="text-sm text-blue-100/70">
                  {messages.length} {messages.length === 1 ? "message" : "messages"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area with Custom Scrollbar */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e1 transparent",
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-12 space-y-6 animate-fade-in">
            <div className="relative inline-block">
              <div className="text-7xl animate-bounce-slow">🤖</div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Start Your Socratic Journey
              </h3>
              <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
                Ask me anything about this article. I'll guide you through deep understanding 
                using thoughtful questions and discussion.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-8">
              {[
                { icon: "💡", text: "What are the main findings?", query: "What are the main findings of this article?" },
                { icon: "🔬", text: "Explain the methodology", query: "Explain the methodology used in this research" },
                { icon: "⚠️", text: "What are the limitations?", query: "What are the limitations of this study?" },
                { icon: "🔗", text: "Relation to other research", query: "How does this relate to other research?" },
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion.query)}
                  className="group relative bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">
                      {suggestion.icon}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {suggestion.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div
                  className={`max-w-[80%] lg:max-w-[70%] rounded-2xl px-6 py-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                      : "bg-white text-gray-900 border-2 border-gray-100 hover:border-blue-200"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg shadow-md">
                        🤖
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Socratic Assistant
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className={`prose prose-sm max-w-none ${msg.role === "user" ? "prose-invert" : ""}`}>
                    <p className="whitespace-pre-wrap leading-relaxed m-0">
                      {msg.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <span
                      className={`text-xs font-medium ${
                        msg.role === "user" ? "text-blue-200" : "text-gray-500"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-slide-up">
                <div className="bg-white border-2 border-blue-100 rounded-2xl px-6 py-5 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg shadow-md">
                      🤖
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex space-x-1.5">
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.15s" }}
                          ></div>
                          <div
                            className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.3s" }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          Thinking deeply...
                        </span>
                      </div>
                      <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-progress"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input Area with Enhanced Design */}
      <form onSubmit={handleSubmit} className="border-t-2 border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-2xl">
        <div className="flex gap-3 items-end max-w-5xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this article... (Shift+Enter for new line)"
              className="w-full px-5 py-4 pr-12 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all duration-300 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md"
              rows={1}
              disabled={isLoading}
            />
            <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-medium">
              {input.length > 0 && `${input.length} chars`}
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex-shrink-0 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
          >
            <span className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending
                </>
              ) : (
                <>
                  Send
                  <span className="group-hover:translate-x-1 transition-transform">➤</span>
                </>
              )}
            </span>
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3 max-w-5xl mx-auto">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>I use the Socratic method to help you think critically</span>
          </p>
          <p className="text-xs text-gray-400">
            Press <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono">Enter</kbd> to send
          </p>
        </div>
      </form>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}