// src/components/student/ChatInterfaceSocratic.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { SocraticMessage } from "@/types/socraticMessage";
import { updateSocraticSession, updateStudentProgressScores } from "@/actions/socraticbot";

interface ChatInterfaceSocraticProps {
  articleId: string;
  articleTitle: string;
  sessionId: string;
  initialSession: SocraticMessage;
}

interface QAPair {
  question: string;
  answer: string;
  feedback?: string;
}

export default function ChatInterfaceSocratic({
  articleId,
  articleTitle,
  sessionId,
  initialSession,
}: ChatInterfaceSocraticProps) {
  const [qaHistory, setQaHistory] = useState<QAPair[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState("");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentQuestion) {
      loadFirstQuestion();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [qaHistory, currentQuestion]);

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
        }),
      });

      const data = await response.json();
      setCurrentQuestion(data.question);
      setCurrentLevel(1);
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
          currentLevel,
        }),
      });

      const data = await response.json();

      // הוסף לhistory
      setQaHistory((prev) => [
        ...prev,
        {
          question: currentQuestion,
          answer: answer,
          feedback: data.feedback,
        },
      ]);

      if (data.isCompleted) {
        setIsCompleted(true);
        setFinalFeedback(data.feedback);

        // עדכן session ב-DB
        await updateSocraticSession(
          sessionId,
          JSON.stringify(qaHistory.map((qa) => qa.question)),
          JSON.stringify(qaHistory.map((qa) => qa.answer)),
          6,
          true
        );

        // עדכן progress
        await updateStudentProgressScores(
          data.feedback.comprehensionScore,
          data.feedback.criticalThinkingScore,
          data.feedback.qualityScore,
          data.feedback.strengths,
          data.feedback.weaknesses,
          data.feedback.recommendations
        );
      } else {
        setCurrentQuestion(data.question);
        setCurrentLevel(data.level);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      alert("Failed to submit answer");
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (currentLevel / 5) * 100;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold truncate">{articleTitle}</h2>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-purple-100">
            🎓 Socratic Learning • Question {currentLevel} of 5
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
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-purple-50 to-white">
        {qaHistory.length === 0 && !currentQuestion && (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">🎓</div>
            <h3 className="text-xl font-semibold text-gray-900">
              Welcome to Socratic Learning
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              I'll guide you through 5 carefully crafted questions to deepen
              your understanding of this article using the Socratic method.
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
                  <span className="text-xs font-semibold">
                    Question {idx + 1}
                  </span>
                </div>
                <p className="leading-relaxed">{qa.question}</p>
              </div>
            </div>

            {/* Answer */}
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-blue-600 text-white rounded-2xl px-5 py-4 shadow-lg">
                <div className="text-xs font-semibold mb-2">Your Answer:</div>
                <p className="leading-relaxed">{qa.answer}</p>
              </div>
            </div>

            {/* Feedback */}
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
                  Question {currentLevel}
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
              <h3 className="text-2xl font-bold text-purple-900 mb-2">
                Excellent Work!
              </h3>
              <p className="text-purple-700">
                You've completed all 5 Socratic questions
              </p>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {finalFeedback.comprehensionScore}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Comprehension
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {finalFeedback.criticalThinkingScore}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Critical Thinking
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-pink-600">
                  {finalFeedback.qualityScore}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Answer Quality
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Summary:</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {finalFeedback.summaryText}
              </p>
            </div>

            {/* Strengths */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <span>💪</span> Strengths:
              </h4>
              <ul className="space-y-1">
                {finalFeedback.strengths.map((strength: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <span>📈</span> Areas for Improvement:
              </h4>
              <ul className="space-y-1">
                {finalFeedback.weaknesses.map((weakness: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-600">→</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span>💡</span> Recommendations:
              </h4>
              <ul className="space-y-1">
                {finalFeedback.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-purple-200 rounded-2xl px-5 py-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">
                  Crafting the next question...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
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
                Question {currentLevel} of 5
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Completed State - Action Buttons */}
      {isCompleted && (
        <div className="border-t bg-gradient-to-r from-purple-50 to-pink-50 p-6">
          <div className="flex gap-4 justify-center">
            <a
              href="/student"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              ← Back to Dashboard
            </a>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium"
            >
              🔄 Start New Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}