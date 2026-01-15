// src/components/student/ChatInterfaceSocratic.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Loader2, Sparkles, BookOpen, AlertCircle, Trash2, Trophy, Target } from "lucide-react";
import { SocraticMessage } from "@/types/socraticMessage";
import { updateSocraticSession } from "@/actions/socraticbot";

interface ChatInterfaceSocraticProps {
  articleId: string;
  articleTitle: string;
  sessionId: string;
  initialSession?: SocraticMessage;
}

interface QAPair {
  question: string;
  answer: string;
  feedback?: string;
  score?: number | null;
  isCorrect?: boolean | null;
  difficulty?: number | null;
}

type FinalFeedback = {
  averageScore?: number;
  scores?: number[];
  difficultyPath?: number[];
  summaryText?: string;
  comprehensionScore?: number;
  criticalThinkingScore?: number;
  qualityScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  isFallback?: boolean;
};

export default function ChatInterfaceSocratic({
  articleId,
  articleTitle,
  sessionId,
}: ChatInterfaceSocraticProps) {
  const [qaHistory, setQaHistory] = useState<QAPair[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState("");
  const [currentLevel, setCurrentLevel] = useState<number>(3);
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<FinalFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionScores, setQuestionScores] = useState<number[]>([]);
  const [difficultyPath, setDifficultyPath] = useState<number[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const didInitRef = useRef(false);

  // 📜 Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [qaHistory, currentQuestion, isCompleted]);

  // 🎨 Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [userAnswer]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    if (!currentQuestion) loadFirstQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressPercentage = useMemo(() => {
    const idx = Math.min(questionIndex, 5);
    return (idx / 5) * 100;
  }, [questionIndex]);

  const averageSoFar = useMemo(() => {
    if (questionScores.length === 0) return 0;
    const avg =
      questionScores.reduce((sum, s) => sum + (typeof s === "number" ? s : 0), 0) /
      questionScores.length;
    return Math.round(avg * 100) / 100;
  }, [questionScores]);

  const loadFirstQuestion = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/socraticbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          sessionId,
          userAnswer: null,
          currentLevel: 0,
          questionIndex: 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Rate limit 😅 ${data.retryAfterSeconds ?? 60}`);
          return;
        }
        setError(data.message || data.error || "Failed to start session");
        return;
      }

      setCurrentQuestion(data.question || "");
      setCurrentLevel(typeof data.level === "number" ? data.level : 3);
      setQuestionIndex(typeof data.questionIndex === "number" ? data.questionIndex : 1);

      setQaHistory([]);
      setQuestionScores([]);
      setDifficultyPath([typeof data.level === "number" ? data.level : 3]);
      setIsCompleted(false);
      setFinalFeedback(null);
    } catch (err) {
      console.error("Failed to load first question:", err);
      setError("Failed to start Socratic session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || isLoading || !currentQuestion) return;

    const answer = userAnswer.trim();
    setUserAnswer("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/socraticbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          sessionId,
          userAnswer: answer,
          currentLevel,
          questionIndex,
          currentQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Rate limit 😅  ${data.retryAfterSeconds ?? 60} `);
          return;
        }
        setError(data.message || data.error || "Failed to submit answer");
        return;
      }

      const answerScore: number | null =
        typeof data.answerScore === "number" ? data.answerScore : null;
      const isCorrect: boolean | null =
        typeof data.isCorrect === "boolean" ? data.isCorrect : null;
      const feedbackText =
        typeof data.feedback === "string" ? data.feedback : undefined;

      const askedDifficulty = currentLevel;

      const newHistory: QAPair[] = [
        ...qaHistory,
        {
          question: currentQuestion,
          answer,
          feedback: feedbackText,
          score: answerScore,
          isCorrect,
          difficulty: askedDifficulty,
        },
      ];
      setQaHistory(newHistory);

      if (typeof answerScore === "number") {
        setQuestionScores((prev) => [...prev, answerScore]);
      } else {
        setQuestionScores((prev) => [...prev, 0]);
      }

      const nextLevel = typeof data.level === "number" ? data.level : currentLevel;
      setDifficultyPath((prev) => {
        if (data.isCompleted) return prev;
        return [...prev, nextLevel];
      });

      if (data.isCompleted) {
        setIsCompleted(true);
        setFinalFeedback((data.feedback as FinalFeedback) || null);

        await updateSocraticSession(
          sessionId,
          JSON.stringify(newHistory.map((qa) => qa.question)),
          JSON.stringify(newHistory.map((qa) => qa.answer)),
          6,
          true
        );
      } else {
        setCurrentQuestion(data.question || "");
        setCurrentLevel(nextLevel);
        setQuestionIndex(typeof data.questionIndex === "number" ? data.questionIndex : questionIndex + 1);
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);
      setError("Failed to submit answer");
      setUserAnswer(answer);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  const resetSession = async () => {
    if (!confirm(" Are you sure you want to start over? This action is irreversible.")) {
      return;
    }

    setQaHistory([]);
    setCurrentQuestion("");
    setQuestionScores([]);
    setDifficultyPath([]);
    setIsCompleted(false);
    setFinalFeedback(null);
    setQuestionIndex(1);
    setCurrentLevel(3);
    
    await loadFirstQuestion();
  };

  const finalAverageScoreUI = useMemo(() => {
    if (finalFeedback && typeof finalFeedback.averageScore === "number") {
      return finalFeedback.averageScore;
    }
    if (questionScores.length === 5) {
      const avg = questionScores.reduce((a, b) => a + b, 0) / 5;
      return Math.round(avg * 100) / 100;
    }
    return null;
  }, [finalFeedback, questionScores]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
      {/* 🎯 Header */}
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white px-6 py-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Socratic Learning
            </h2>
            <p className="text-sm text-slate-300 mt-0.5 line-clamp-1">
              {articleTitle}
            </p>
          </div>
          {qaHistory.length > 0 && !isCompleted && (
            <button
              onClick={resetSession}
              disabled={isLoading}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2 rounded-xl transition-all disabled:opacity-50"
              title="Start Over"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Progress Info */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>Question {Math.min(questionIndex, 5)} of 5</span>
            <span className="text-slate-400">•</span>
            <span>Difficulty Level {currentLevel}/5</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
            {progressPercentage.toFixed(0)}% completed
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-500 shadow-lg" 
            style={{ width: `${progressPercentage}%` }} 
          />
        </div>

        {/* Average Score */}
        {questionScores.length > 0 && !isCompleted && (
          <div className="mt-3 text-xs text-slate-300 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>ציון ממוצע עד כה: <span className="font-semibold text-white">{averageSoFar}/100</span></span>
          </div>
        )}
      </div>

      {/* 💬 Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {qaHistory.length === 0 && !currentQuestion && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md border border-slate-200">
              <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                Welcome to Socratic Learning
              </h3>
              <p className="text-slate-600 leading-relaxed">
                I'll ask you <span className="font-semibold text-slate-800">5 questions</span> about the article.
                <br />
                Difficulty level will be adjusted based on <span className="font-semibold text-slate-800">your answers</span>
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white px-4 py-3 rounded-xl border border-slate-200">
                  <span className="text-2xl mb-1 block">🎯</span>
                  <span className="text-slate-700 font-medium">Difficulty Level</span>
                </div>
                <div className="bg-white px-4 py-3 rounded-xl border border-slate-200">
                  <span className="text-2xl mb-1 block">💡</span>
                  <span className="text-slate-700 font-medium">Immediate Feedback</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History - Questions & Answers */}
        {qaHistory.map((qa, idx) => (
          <div key={idx} className="space-y-4 animate-fadeIn">
            {/* Question */}
            <div className="flex justify-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg mr-3 ring-4 ring-slate-100">
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              <div className="max-w-[75%] rounded-2xl px-6 py-4 shadow-lg bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Question {idx + 1}</span>
                  {typeof qa.difficulty === "number" && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-semibold">
                      Difficulty Level {qa.difficulty}/5
                    </span>
                  )}
                </div>
                <p className="text-slate-700 leading-relaxed">{qa.question}</p>
              </div>
            </div>

            {/* Answer */}
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl px-6 py-4 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-blue-400/30">
                  <span className="text-xs font-semibold">Your Answer:</span>
                  <div className="flex items-center gap-2">
                    {typeof qa.isCorrect === "boolean" && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          qa.isCorrect 
                            ? "bg-white/20 text-white" 
                            : "bg-white/20 text-white"
                        }`}
                      >
                        {qa.isCorrect ? "✓ נכון" : "✗ שגוי"}
                      </span>
                    )}
                    {typeof qa.score === "number" && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-semibold">
                        {qa.score}
                      </span>
                    )}
                  </div>
                </div>
                <p className="leading-relaxed">{qa.answer}</p>
              </div>

              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ml-3 ring-4 ring-blue-100">
                <span className="text-white font-bold text-sm">You</span>
              </div>
            </div>

            {/* Feedback */}
            {qa.feedback && (
              <div className="flex justify-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg mr-3 ring-4 ring-slate-100">
                  <span className="text-white text-xl">✨</span>
                </div>

                <div className="max-w-[75%] rounded-2xl px-6 py-4 shadow-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">Feedback:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-sm">{qa.feedback}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Current Question */}
        {currentQuestion && !isCompleted && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg mr-3 ring-4 ring-slate-100">
              <Sparkles className="w-5 h-5 text-white" />
            </div>

            <div className="max-w-[75%] rounded-2xl px-6 py-4 shadow-lg bg-white border border-slate-200">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600">
                  question {Math.min(questionIndex, 5)}
                </span>
                <span className="text-[10px] bg-white text-slate-700 px-2 py-1 rounded-full font-semibold">
                   level {currentLevel}/5
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">{currentQuestion}</p>
            </div>
          </div>
        )}

        {/* Final Feedback */}
        {isCompleted && finalFeedback && (
          <div className="bg-white rounded-2xl p-8 space-y-6 border-2 border-slate-200 shadow-2xl animate-fadeIn">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-3xl font-bold text-slate-800 mb-2">You've completed the session!</h3>
              <p className="text-slate-600 text-lg">You've successfully completed all 5 questions</p>
            </div>

            {typeof finalAverageScoreUI === "number" && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 text-center shadow-lg border border-slate-200">
                <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <div className="text-5xl font-bold text-slate-800 mb-2">{finalAverageScoreUI}</div>
                <div className="text-sm text-slate-600">Final Average Score (out of 100)</div>
              </div>
            )}

            {questionScores.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-6 shadow-lg border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Scores by Question:
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  {questionScores.map((s, i) => (
                    <div key={i} className="bg-white px-4 py-3 rounded-lg text-center border border-slate-200">
                      <div className="text-xs text-slate-600 font-semibold mb-1">Question {i + 1}</div>
                      <div className="text-xl font-bold text-slate-800">{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {difficultyPath.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-6 shadow-lg border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  Difficulty Path:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {difficultyPath.map((d, i) => (
                    <div key={i} className="bg-white px-4 py-2 rounded-full border border-slate-200">
                      <span className="text-xs text-slate-700 font-semibold">
                        {i === 0 ? "Start" : `Question ${i}`}: Level {d}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {finalFeedback.summaryText && (
              <div className="bg-slate-50 rounded-xl p-6 shadow-lg border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📝</span>
                  Summary:
                </h4>
                <p className="text-slate-700 leading-relaxed">{finalFeedback.summaryText}</p>
              </div>
            )}

            <button
              onClick={resetSession}
              className="w-full bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4 rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all font-bold shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Start New Session
            </button>
          </div>
        )}

        {/* 🔄 Loading indicator */}
        {isLoading && !isCompleted && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg mr-3 ring-4 ring-slate-100">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-lg max-w-[75%]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2.5 h-2.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2.5 h-2.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm text-slate-600 font-medium">
                  Preparing the next question...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ⚠️ Error message */}
        {error && (
          <div className="flex justify-center animate-fadeIn">
            <div className="bg-slate-50 border border-slate-300 text-slate-700 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3 max-w-md">
              <AlertCircle className="w-6 h-6 flex-shrink-0 text-slate-600" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ✍️ Input Area */}
      {!isCompleted && (
        <div className="border-t border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-5">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="💭 Write your answer here."
                className="w-full resize-none rounded-2xl border-2 border-slate-300 focus:border-slate-500 focus:ring-4 focus:ring-slate-100 px-5 py-4 text-slate-800 placeholder-slate-400 transition-all duration-200 shadow-sm"
                rows={1}
                disabled={isLoading || !currentQuestion}
              />
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={!userAnswer.trim() || isLoading || !currentQuestion}
              className="flex-shrink-0 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:from-slate-800 hover:to-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Answer</span>
                  <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-3 text-center">
            💡 <span className="font-medium">Tip:</span> Explain your reasoning, don't just state facts
          </p>
        </div>
      )}

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