// src/components/student/ChatInterfaceSocratic.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SocraticMessage } from "@/types/socraticMessage";
import { updateSocraticSession } from "@/actions/socraticbot";

interface ChatInterfaceSocraticProps {
  articleId: string;
  articleTitle: string;
  sessionId: string;
  initialSession?: SocraticMessage; // לא חובה
}

interface QAPair {
  question: string;
  answer: string;
  feedback?: string; // פידבק קצר (string) מהשרת
  score?: number | null; // 0-100
  isCorrect?: boolean | null; // נכון/לא נכון
  difficulty?: number | null; // הרמה שהשאלה נשאלה בה
}

type FinalFeedback = {
  averageScore?: number;
  scores?: number[];
  difficultyPath?: number[];
  summaryText?: string;
  // אופציונלי אם עדיין מחזיר את אלו
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

  // currentLevel = רמת קושי (1..5)
  const [currentLevel, setCurrentLevel] = useState<number>(3);

  // questionIndex = מספר השאלה מתוך 5 (1..5)
  const [questionIndex, setQuestionIndex] = useState<number>(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<FinalFeedback | null>(null);

  // ✅ נשמור גם בקליינט כדי להציג ולחשב ולשלוח לשרת בסוף (אם תרצה)
  const [questionScores, setQuestionScores] = useState<number[]>([]);
  const [difficultyPath, setDifficultyPath] = useState<number[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (!currentQuestion) loadFirstQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [qaHistory, currentQuestion, isCompleted]);

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
      setCurrentLevel(typeof data.level === "number" ? data.level : 3);
      setQuestionIndex(typeof data.questionIndex === "number" ? data.questionIndex : 1);

      // התחלה נקייה
      setQaHistory([]);
      setQuestionScores([]);
      setDifficultyPath([typeof data.level === "number" ? data.level : 3]);
      setIsCompleted(false);
      setFinalFeedback(null);
    } catch (err) {
      console.error("Failed to load first question:", err);
      alert("Failed to start Socratic session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || isLoading || !currentQuestion) return;

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
          currentLevel,
          questionIndex,
          currentQuestion, // ✅ חובה ל-grading
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

      const answerScore: number | null =
        typeof data.answerScore === "number" ? data.answerScore : null;
      const isCorrect: boolean | null =
        typeof data.isCorrect === "boolean" ? data.isCorrect : null;
      const feedbackText =
        typeof data.feedback === "string" ? data.feedback : undefined;

      const askedDifficulty = currentLevel;

      // ✅ history כולל שאלה אחרונה
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

      // ✅ צבירת ציונים ומסלול קושי
      if (typeof answerScore === "number") {
        setQuestionScores((prev) => [...prev, answerScore]);
      } else {
        setQuestionScores((prev) => [...prev, 0]);
      }

      // data.level הוא הקושי הבא (אחרי העלאה/הורדה)
      const nextLevel = typeof data.level === "number" ? data.level : currentLevel;
      setDifficultyPath((prev) => {
        // נשמור את הקושי הבא (לשאלה הבאה), אבל רק אם לא סיימנו
        if (data.isCompleted) return prev;
        return [...prev, nextLevel];
      });

      if (data.isCompleted) {
        setIsCompleted(true);
        setFinalFeedback((data.feedback as FinalFeedback) || null);

        // ✅ שמירת שאלות/תשובות ב-DB (כמו אצלך)
        await updateSocraticSession(
          sessionId,
          JSON.stringify(newHistory.map((qa) => qa.question)),
          JSON.stringify(newHistory.map((qa) => qa.answer)),
          6,
          true
        );

        // NOTE:
        // את העדכון לטבלת student_progress החדשה עושים בשרת/אקשן חדש.
        // אם כבר יש לך action (למשל createStudentProgressAttempt) – תוסיף פה קריאה אליו.
      } else {
        setCurrentQuestion(data.question || "");
        setCurrentLevel(nextLevel);
        setQuestionIndex(typeof data.questionIndex === "number" ? data.questionIndex : questionIndex + 1);
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);
      alert("Failed to submit answer");
    } finally {
      setIsLoading(false);
    }
  };

  const finalAverageScoreUI = useMemo(() => {
    // אם השרת מחזיר averageScore בסיום, נעדיף אותו
    if (finalFeedback && typeof finalFeedback.averageScore === "number") {
      return finalFeedback.averageScore;
    }
    // אחרת נחשב מהקליינט
    if (questionScores.length === 5) {
      const avg = questionScores.reduce((a, b) => a + b, 0) / 5;
      return Math.round(avg * 100) / 100;
    }
    return null;
  }, [finalFeedback, questionScores]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold truncate">{articleTitle}</h2>

        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-purple-100">
            🎓 Socratic Learning • Question {Math.min(questionIndex, 5)} of 5 • Difficulty{" "}
            {currentLevel}/5
          </p>
          <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-medium">
            {progressPercentage.toFixed(0)}% Complete
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎓</span>
                    <span className="text-xs font-semibold">Question {idx + 1}</span>
                  </div>
                  {typeof qa.difficulty === "number" && (
                    <span className="text-[11px] bg-white/20 px-2 py-1 rounded-full">
                      Difficulty {qa.difficulty}/5
                    </span>
                  )}
                </div>
                <p className="leading-relaxed">{qa.question}</p>
              </div>
            </div>

            {/* Answer */}
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-blue-600 text-white rounded-2xl px-5 py-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold">Your Answer:</div>

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
        {isCompleted && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 space-y-4 border-2 border-purple-300">
            <div className="text-center">
              <div className="text-6xl mb-3">🎉</div>
              <h3 className="text-2xl font-bold text-purple-900 mb-2">Session Complete!</h3>
              <p className="text-purple-700">You've completed all 5 questions</p>
            </div>

            {typeof finalAverageScoreUI === "number" && (
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-4xl font-bold text-gray-900">{finalAverageScoreUI}</div>
                <div className="text-xs text-gray-600 mt-1">Final Average Score (out of 100)</div>
              </div>
            )}

            {/* Scores per question */}
            {questionScores.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Scores per question:</h4>
                <div className="flex flex-wrap gap-2">
                  {questionScores.map((s, i) => (
                    <span key={i} className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                      Q{i + 1}: {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty path */}
            {difficultyPath.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Difficulty path:</h4>
                <div className="flex flex-wrap gap-2">
                  {difficultyPath.map((d, i) => (
                    <span key={i} className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                      {i === 0 ? "Start" : `Q${i + 1}`}: {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Optional summaryText */}
            {finalFeedback?.summaryText && (
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
