// src/components/student/ChatInterfaceSocratic.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { SocraticMessage } from "@/types/socraticMessage";
import {
  updateSocraticSession,
  updateStudentProgressScores,
} from "@/actions/socraticbot";

interface ChatInterfaceSocraticProps {
  articleId: string;
  articleTitle: string;
  sessionId: string;
  initialSession: SocraticMessage;
}

interface QAPair {
  question: string;
  answer: string;
  feedback?: string;      // feedback טקסט קצר מהשרת
  score?: number | null;  // ✅ ציון לכל תשובה (0-100)
  isCorrect?: boolean | null; // ✅ נכון/לא נכון
}

export default function ChatInterfaceSocratic({
  articleId,
  articleTitle,
  sessionId,
}: ChatInterfaceSocraticProps) {
  const [qaHistory, setQaHistory] = useState<QAPair[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState("");

  // ✅ currentLevel עכשיו = רמת קושי (1..5)
  const [currentLevel, setCurrentLevel] = useState(3);

  // ✅ questionIndex = מספר שאלה מתוך 5 (1..5)
  const [questionIndex, setQuestionIndex] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (!currentQuestion) {
      loadFirstQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [qaHistory, currentQuestion, isCompleted]);

  const loadFirstQuestion = async () => {
    setIsLoading(true);
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
          alert(`Rate limit 😅 נסה שוב בעוד ${data.retryAfterSeconds ?? 60} שניות`);
          return;
        }
        alert(data.message || data.error || "Failed to start session");
        return;
      }

      setCurrentQuestion(data.question || "");
      setCurrentLevel(data.level ?? 3);            // ✅ קושי התחלה (בינוני)
      setQuestionIndex(data.questionIndex ?? 1);   // ✅ שאלה 1
    } catch (error) {
      console.error("Failed to load first question:", error);
      alert("Failed to start Socratic session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || isLoading) return;

    const answer = userAnswer.trim();
    setUserAnswer("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/socraticbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          sessionId,
          userAnswer: answer,
          currentLevel,      // ✅ קושי נוכחי
          questionIndex,     // ✅ מספר שאלה
          currentQuestion,   // ✅ חובה כדי שהשרת ידרג נכונות
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          alert(`Rate limit 😅 נסה שוב בעוד ${data.retryAfterSeconds ?? 60} שניות`);
          return;
        }
        alert(data.message || data.error || "Failed to submit answer");
        return;
      }

      // feedback טקסט קצר (במהלך) — בסיום feedback הוא אובייקט גדול
      const feedbackText = typeof data.feedback === "string" ? data.feedback : undefined;

      // ✅ newHistory כדי שהעדכון DB יכלול את האחרונה
      const newHistory: QAPair[] = [
        ...qaHistory,
        {
          question: currentQuestion,
          answer,
          feedback: feedbackText,
          score: data.answerScore ?? null,
          isCorrect: data.isCorrect ?? null,
        },
      ];
      setQaHistory(newHistory);

      if (data.isCompleted) {
        setIsCompleted(true);
        setFinalFeedback(data.feedback);

        // ✅ שמירת שאלות/תשובות ב-DB
        await updateSocraticSession(
          sessionId,
          JSON.stringify(newHistory.map((qa) => qa.question)),
          JSON.stringify(newHistory.map((qa) => qa.answer)),
          6,
          true
        );

        // ✅ עדכון progress (אם קיים בפידבק הסופי שלך)
        if (
          data.feedback &&
          typeof data.feedback === "object" &&
          typeof data.feedback.comprehensionScore === "number"
        ) {
          await updateStudentProgressScores(
            data.feedback.comprehensionScore,
            data.feedback.criticalThinkingScore,
            data.feedback.qualityScore,
            data.feedback.strengths || [],
            data.feedback.weaknesses || [],
            data.feedback.recommendations || []
          );
        }
      } else {
        setCurrentQuestion(data.question || "");
        setCurrentLevel(data.level ?? currentLevel);                 // ✅ קושי חדש
        setQuestionIndex(data.questionIndex ?? questionIndex + 1);   // ✅ שאלה חדשה
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      alert("Failed to submit answer");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ התקדמות לפי מספר שאלה (לא לפי קושי)
  const progressPercentage = (questionIndex / 5) * 100;

  // ✅ ממוצע מהיסטוריה (כולל 0 אם אין score)
  const averageSoFar =
    qaHistory.length > 0
      ? Math.round(
          (qaHistory.reduce((sum, qa) => sum + (typeof qa.score === "number" ? qa.score : 0), 0) /
            qaHistory.length) * 100
        ) / 100
      : 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold truncate">{articleTitle}</h2>

        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-purple-100">
            🎓 Socratic Learning • Question {Math.min(questionIndex, 5)} of 5 • Difficulty {currentLevel}/5
          </p>
          <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-medium">
            {progressPercentage.toFixed(0)}% Complete
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Average so far */}
        <div className="mt-3 text-xs text-purple-100">
          Average score so far: <span className="font-semibold text-white">{averageSoFar}</span>/100
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-purple-50 to-white">
        {qaHistory.length === 0 && !currentQuestion && (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">🎓</div>
            <h3 className="text-xl font-semibold text-gray-900">Welcome to Socratic Learning</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              I'll guide you through 5 questions. Difficulty adapts based on your answers.
            </p>
          </div>
        )}

        {/* History */}
        {qaHistory.map((qa, idx) => (
          <div key={idx} className="space-y-4">
            {/* Question */}
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl px-5 py-4 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎓</span>
                  <span className="text-xs font-semibold">Question {idx + 1}</span>
                </div>
                <p className="leading-relaxed">{qa.question}</p>
              </div>
            </div>

            {/* Answer */}
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-blue-600 text-white rounded-2xl px-5 py-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold">Your Answer:</div>

                  {/* ✅ badge נכון/לא נכון + ציון */}
                  <div className="flex items-center gap-2">
                    {typeof qa.isCorrect === "boolean" && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          qa.isCorrect ? "bg-green-500/80" : "bg-red-500/80"
                        }`}
                      >
                        {qa.isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    )}
                    {typeof qa.score === "number" && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        Score: {qa.score}
                      </span>
                    )}
                  </div>
                </div>

                <p className="leading-relaxed">{qa.answer}</p>
              </div>
            </div>

            {/* Feedback (string only) */}
            {qa.feedback && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-green-50 border-2 border-green-200 text-green-900 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">✨</span>
                    <span className="text-xs font-semibold">Feedback:</span>
                  </div>
                  <p className="leading-relaxed text-sm">{qa.feedback}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Current Question */}
        {currentQuestion && !isCompleted && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl px-5 py-4 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎓</span>
                <span className="text-xs font-semibold">
                  Question {Math.min(questionIndex, 5)} • Difficulty {currentLevel}/5
                </span>
              </div>
              <p className="leading-relaxed">{currentQuestion}</p>
            </div>
          </div>
        )}

        {/* Final Feedback */}
        {isCompleted && finalFeedback && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 space-y-4 border-2 border-purple-300">
            <div className="text-center">
              <div className="text-6xl mb-3">🎉</div>
              <h3 className="text-2xl font-bold text-purple-900 mb-2">Session Complete!</h3>
              <p className="text-purple-700">You've completed all 5 questions</p>
            </div>

            {/* ✅ ציון סופי = averageScore שהשרת מחזיר */}
            {typeof finalFeedback.averageScore === "number" && (
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {finalFeedback.averageScore}
                </div>
                <div className="text-xs text-gray-600 mt-1">Final Average Score (out of 100)</div>
              </div>
            )}

            {/* (אופציונלי) ציונים מפורטים */}
            {Array.isArray(finalFeedback.scores) && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Scores per question:</h4>
                <div className="flex flex-wrap gap-2">
                  {finalFeedback.scores.map((s: number, i: number) => (
                    <span key={i} className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                      Q{i + 1}: {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* שאר הפידבק שלך אם קיים */}
            {finalFeedback.summaryText && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Summary:</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{finalFeedback.summaryText}</p>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-purple-200 rounded-2xl px-5 py-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="text-sm text-gray-600">Crafting the next question...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isCompleted && (
        <div className="border-t bg-gradient-to-r from-purple-50 to-pink-50 p-6">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span className="text-purple-600">💭</span>
              <span>Think deeply before answering. Quality over speed!</span>
            </div>

            <div className="flex gap-3 items-end">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitAnswer();
                  }
                }}
                placeholder="Type your thoughtful answer here... (Shift+Enter for new line)"
                className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isLoading || !currentQuestion}
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim() || isLoading || !currentQuestion}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg h-fit"
              >
                {isLoading ? "..." : "Submit ➤"}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>💡 Tip: Explain your reasoning, don't just state facts</span>
              <span className="text-purple-600 font-medium">
                Question {Math.min(questionIndex, 5)} of 5 • Difficulty {currentLevel}/5
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
