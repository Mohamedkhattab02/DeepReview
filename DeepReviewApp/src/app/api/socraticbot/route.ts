// src/app/api/socraticbot/route.ts

/**
 * Socratic learning API route for guided, 5-step article understanding.
 * Generates adaptive questions, grades student answers, and stores session progress + final feedback in Supabase.
 * Includes retry handling for rate limits and ensures all scores/questions are persisted to avoid losing results.
 */

import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ======================
// Helpers
// ======================
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractRetrySeconds(msg: string) {
  const retryMatch = msg.match(/retry in\s+([\d.]+)s/i);
  return retryMatch ? Math.ceil(Number(retryMatch[1])) : 60;
}

function isRateLimitError(msg: string) {
  const m = msg.toLowerCase();
  return m.includes("429") || m.includes("quota") || m.includes("too many requests");
}

async function generateWithRetry(model: any, prompt: string, maxRetries = 1): Promise<string> {
  let attempt = 0;
  while (true) {
    try {
      const result = await model.generateContent(prompt);
      return (await result.response).text().trim();
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (attempt < maxRetries && isRateLimitError(msg)) {
        const retrySeconds = extractRetrySeconds(msg);
        await sleep(retrySeconds * 1000);
        attempt++;
        continue;
      }
      throw e;
    }
  }
}

function clampLevel(level: number) {
  return Math.max(1, Math.min(5, level));
}

function safeParseJsonArray<T = any>(value: any): T[] {
  try {
    if (!value) return [];
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
// ======================
// Final feedback from Gemini (dynamic)
// ======================
async function generateFinalFeedback(params: {
  model: any;
  article: any;
  askedArr: string[];     // ["q1","q2",...]
  answeredArr: any[];     // [{answer, score, isCorrect, difficulty}, ...]
  averageScore: number;   // avg 0-100
}): Promise<{
  comprehensionScore: number;
  criticalThinkingScore: number;
  qualityScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summaryText: string;
  isFallback: boolean;
}> {
  const { model, article, askedArr, answeredArr, averageScore } = params;

  const qaText = askedArr.slice(0, 5).map((q, i) => {
    const a = answeredArr[i] || {};
    return `Q${i + 1}: ${q}
A${i + 1}: ${a.answer ?? "No answer"}
Score: ${a.score ?? 0}
Correct: ${a.isCorrect ?? false}
Difficulty: ${a.difficulty ?? 0}`;
  }).join("\n\n");

  const prompt = `You are an expert educational evaluator.

Analyze the student's FULL 5-question Socratic session and return ONLY valid JSON (no markdown).

Return EXACTLY this JSON schema:
{
  "comprehensionScore": 0,
  "criticalThinkingScore": 0,
  "qualityScore": 0,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "recommendations": ["...", "..."],
  "summaryText": "..."
}

Rules:
- Scores must be integers 0-100.
- Strengths/weaknesses/recommendations should be specific to the student's answers, not generic.
- summaryText: 3-4 sentences, concise.
- Use the final averageScore (${averageScore}/100) to calibrate tone.

Article:
Title: ${article.title}
Abstract: ${article.abstract || "No abstract"}
Topics: ${(article.main_topics || []).join(", ") || "Not available"}

Session Q&A:
${qaText}
`;

  try {
    const text = await generateWithRetry(model, prompt, 1);
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);

    const toInt = (x: any) => {
      const n = Number(x);
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, Math.min(100, Math.round(n)));
    };

    return {
      comprehensionScore: toInt(parsed.comprehensionScore),
      criticalThinkingScore: toInt(parsed.criticalThinkingScore),
      qualityScore: toInt(parsed.qualityScore),

      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 6) : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 6) : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 8) : [],

      summaryText: typeof parsed.summaryText === "string" ? parsed.summaryText : "Summary not available.",
      isFallback: false,
    };
  } catch (e) {
    // אם Gemini נכשל (429/parse וכו') -> fallback קצר
    return {
      comprehensionScore: 70,
      criticalThinkingScore: 68,
      qualityScore: 72,
      strengths: ["Completed the Socratic flow"],
      weaknesses: ["Some answers need more evidence"],
      recommendations: ["Add concrete examples from the article"],
      summaryText: "Feedback generation failed due to temporary limits. Try again later.",
      isFallback: true,
    };
  }
}


// ======================
// Grade Answer (correct + score)
// ======================
async function gradeAnswer(
  model: any,
  article: any,
  question: string,
  answer: string
): Promise<{ isCorrect: boolean; score: number; feedback: string }> {
  const prompt = `You are an educational grader.

Rules:
- Decide if the answer is correct enough to be considered "correct".
- If NOT correct => score MUST be 0.
- If correct => score 1-100 based on accuracy, completeness, and clarity.
- Keep feedback short (1-2 sentences).

Return ONLY valid JSON (no markdown):
{
  "isCorrect": true,
  "score": 85,
  "feedback": "..."
}

Article Title: ${article.title}
Abstract: ${article.abstract || "No abstract"}
Topics: ${(article.main_topics || []).join(", ") || "Not available"}

Question: ${question}
Student Answer: ${answer}
`;

  const text = await generateWithRetry(model, prompt, 1);

  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);

    const isCorrect = Boolean(parsed.isCorrect);
    let score = Number(parsed.score);

    if (!isCorrect) score = 0;
    if (!Number.isFinite(score)) score = 0;

    score = Math.max(0, Math.min(100, isCorrect ? score : 0));

    const feedback = typeof parsed.feedback === "string" ? parsed.feedback : "";
    return { isCorrect, score, feedback };
  } catch {
    return {
      isCorrect: false,
      score: 0,
      feedback: "Could not evaluate reliably. Please be more specific and reference the article.",
    };
  }
}

// ======================
// Main Route
// ======================
export async function POST(request: NextRequest) {
  try {
    // ✅ קוראים JSON פעם אחת בלבד
    const body = await request.json();
    const {
      articleId,
      sessionId,
      userAnswer,
      currentLevel,
      questionIndex,
      currentQuestion, // ✅ חייב להגיע מהלקוח כשיש תשובה
    } = body;

    if (!articleId || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // נביא את הסשן (כדי לשמור scores באמת ב-DB ולא לקבל 0 בסוף)
    const { data: sessionRow, error: sessionErr } = await supabase
      .from("socratic_messages")
      .select("id, questions_asked, questions_answered, is_completed")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionErr || !sessionRow) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (sessionRow.is_completed) {
      return NextResponse.json(
        { error: "Session already completed" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // =========================================
    // 1) FIRST QUESTION (Start at medium = 3)
    // =========================================
    if (!userAnswer) {
      const startLevel = 3;

      const prompt = `You are a Socratic teaching bot.
Generate the FIRST question for this academic article.

Difficulty Level: ${startLevel} (1=easy, 5=hard)

Title: ${article.title}
Authors: ${article.authors?.join(", ") || "Unknown"}
Abstract: ${article.abstract || "No abstract"}
Topics: ${article.main_topics?.join(", ") || "Not available"}
Text Preview: ${article.full_text?.substring(0, 3000) || "Not available"}

Guidelines:
- Moderately challenging comprehension
- Not too basic, not too advanced
- Encourage explanation (not yes/no)

Respond ONLY with the question text.`;

      let questionText: string;
      try {
        questionText = await generateWithRetry(model, prompt, 1);
      } catch (e: any) {
        const msg = String(e?.message || "");
        if (isRateLimitError(msg)) {
          const retrySeconds = extractRetrySeconds(msg);
          return NextResponse.json(
            {
              error: "RATE_LIMIT",
              message: "Rate limit 😅 נסה שוב בעוד כמה שניות",
              retryAfterSeconds: retrySeconds,
            },
            { status: 429, headers: { "Retry-After": String(retrySeconds) } }
          );
        }
        throw e;
      }

      // נשמור DB: questions_asked = [q1], questions_answered=[]
      const askedArr = [questionText];
      const answeredArr: any[] = [];

      await supabase
        .from("socratic_messages")
        .update({
          questions_asked: JSON.stringify(askedArr),
          questions_answered: JSON.stringify(answeredArr),
          questions_asked_count: 1,
          questions_answered_count: 0,
          current_level: startLevel,
          is_completed: false,
        })
        .eq("id", sessionId)
        .eq("user_id", user.id);

      return NextResponse.json({
        question: questionText,
        level: startLevel,
        questionIndex: 1,
        isCompleted: false,
        feedback: null,
        answerScore: null,
        isCorrect: null,
        averageScore: null,
      });
    }

    // =========================================
    // 2) ANSWER FLOW (grade + update difficulty)
    // =========================================
    const qIndex = Number(questionIndex ?? 1); // 1..5
    const difficulty = clampLevel(Number(currentLevel ?? 3)); // 1..5

    if (!currentQuestion || typeof currentQuestion !== "string") {
      return NextResponse.json(
        { error: "Missing currentQuestion for grading" },
        { status: 400 }
      );
    }

    // grade
    let grading: { isCorrect: boolean; score: number; feedback: string };
    try {
      grading = await gradeAnswer(model, article, currentQuestion, String(userAnswer));
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (isRateLimitError(msg)) {
        const retrySeconds = extractRetrySeconds(msg);
        return NextResponse.json(
          {
            error: "RATE_LIMIT",
            message: "Rate limit 😅 נסה שוב בעוד כמה שניות",
            retryAfterSeconds: retrySeconds,
          },
          { status: 429, headers: { "Retry-After": String(retrySeconds) } }
        );
      }
      throw e;
    }

    const nextDifficulty = clampLevel(grading.isCorrect ? difficulty + 1 : difficulty - 1);
    const nextQuestionIndex = qIndex + 1;
    const isDone = nextQuestionIndex > 5;

    // =========================================
    // IMPORTANT FIX:
    // נשמור *כל* תשובה+ציון ב-DB כדי שהסוף לא יצא 0
    // questions_answered = [{answer, score, isCorrect, difficulty}, ...]
    // questions_asked = ["q1","q2",...]
    // =========================================
    const askedArr = safeParseJsonArray<string>(sessionRow.questions_asked);
    const answeredArr = safeParseJsonArray<any>(sessionRow.questions_answered);

    // ensure we store the current question if missing (למקרה mismatch)
    if (askedArr.length < qIndex) {
      askedArr.push(currentQuestion);
    } else if (askedArr[qIndex - 1] !== currentQuestion) {
      // אם הלקוח שלח question שונה, נעדכן את המקום הנוכחי
      askedArr[qIndex - 1] = currentQuestion;
    }

    // push answer object (only once per index)
    // אם כבר יש תשובה לאותו אינדקס, נחליף (כדי למנוע כפילויות)
    const answerObj = {
      answer: String(userAnswer),
      score: grading.score,
      isCorrect: grading.isCorrect,
      difficulty,
    };

    if (answeredArr.length >= qIndex) {
      answeredArr[qIndex - 1] = answerObj;
    } else {
      answeredArr.push(answerObj);
    }

    await supabase
      .from("socratic_messages")
      .update({
        questions_asked: JSON.stringify(askedArr),
        questions_answered: JSON.stringify(answeredArr),
        questions_asked_count: askedArr.length,
        questions_answered_count: answeredArr.length,
        current_level: nextDifficulty,
        is_completed: isDone,
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    // =========================================
// FINISH SESSION (after question 5)
// =========================================
if (isDone) {
  // ✅ 1) scores + avg
  const scores: number[] = answeredArr
    .slice(0, 5)
    .map((x: any) => (Number.isFinite(Number(x?.score)) ? Number(x.score) : 0));

  while (scores.length < 5) scores.push(0);

  const avg =
    Math.round((scores.reduce((sum, s) => sum + s, 0) / 5) * 100) / 100;

  // ✅ 2) difficultyPath
  const difficultyPath: number[] = answeredArr
    .slice(0, 5)
    .map((x: any) =>
      Number.isFinite(Number(x?.difficulty)) ? Number(x.difficulty) : 0
    );

  while (difficultyPath.length < 5) difficultyPath.push(0);

  // ✅ 3) Final feedback from Gemini (dynamic)
  const finalAnalysis = await generateFinalFeedback({
    model,
    article,
    askedArr,
    answeredArr,
    averageScore: avg,
  });

  const finalFeedback = {
    averageScore: avg,
    scores,
    difficultyPath,
    comprehensionScore: finalAnalysis.comprehensionScore,
    criticalThinkingScore: finalAnalysis.criticalThinkingScore,
    qualityScore: finalAnalysis.qualityScore,
    strengths: finalAnalysis.strengths,
    weaknesses: finalAnalysis.weaknesses,
    recommendations: finalAnalysis.recommendations,
    summaryText: finalAnalysis.summaryText,
    isFallback: finalAnalysis.isFallback,
  };

  // ✅ 4) INSERT row to student_progress
  const { error: progressError } = await supabase
    .from("student_progress")
    .insert({
      user_id: user.id,
      article_id: articleId,
      session_id: sessionId,

      final_average_score: avg,

      question_scores: JSON.stringify(scores),
      difficulty_path: JSON.stringify(difficultyPath),

      comprehension_score: finalAnalysis.comprehensionScore ?? null,
      critical_thinking_score: finalAnalysis.criticalThinkingScore ?? null,
      quality_score: finalAnalysis.qualityScore ?? null,

      strengths: JSON.stringify(finalAnalysis.strengths ?? []),
      weaknesses: JSON.stringify(finalAnalysis.weaknesses ?? []),
      recommendations: JSON.stringify(finalAnalysis.recommendations ?? []),
    });

  if (progressError) {
    console.error("❌ student_progress insert failed:", progressError);
  }

  return NextResponse.json({
    question: null,
    level: nextDifficulty,
    questionIndex: 6,
    isCompleted: true,
    feedback: finalFeedback,
    answerScore: grading.score,
    isCorrect: grading.isCorrect,
    averageScore: avg,
  });
}


    // =========================================
    // 4) NEXT QUESTION (by nextDifficulty)
    // =========================================
    const nextPrompt = `You are a Socratic teaching bot.
Generate the NEXT question (Question ${nextQuestionIndex} of 5).

Difficulty Level: ${nextDifficulty} (1=easy, 5=hard)

Article Title: ${article.title}
Topics: ${(article.main_topics || []).join(", ") || "Not available"}

Student's previous answer (for context): "${String(userAnswer)}"

Guidelines by difficulty:
- Level 1: simple comprehension
- Level 2: method/design basics
- Level 3: findings reasoning
- Level 4: implications/limitations
- Level 5: critical thinking, alternatives, future work

Respond ONLY with the question text.`;

    let nextQuestion: string;
    try {
      nextQuestion = await generateWithRetry(model, nextPrompt, 1);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (isRateLimitError(msg)) {
        const retrySeconds = extractRetrySeconds(msg);
        return NextResponse.json(
          {
            error: "RATE_LIMIT",
            message: "Rate limit 😅 נסה שוב בעוד כמה שניות",
            retryAfterSeconds: retrySeconds,
          },
          { status: 429, headers: { "Retry-After": String(retrySeconds) } }
        );
      }
      throw e;
    }

    // ✅ נשמור גם את השאלה הבאה ל-questions_asked (שלא יתפספס)
    const askedArr2 = askedArr;
    if (askedArr2.length < nextQuestionIndex) {
      askedArr2.push(nextQuestion);
      await supabase
        .from("socratic_messages")
        .update({
          questions_asked: JSON.stringify(askedArr2),
          questions_asked_count: askedArr2.length,
        })
        .eq("id", sessionId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      question: nextQuestion,
      level: nextDifficulty,
      questionIndex: nextQuestionIndex,
      isCompleted: false,
      feedback: grading.feedback, // feedback קצר על התשובה הקודמת
      answerScore: grading.score,
      isCorrect: grading.isCorrect,
      averageScore: null,
    });
  } catch (error: any) {
    const msg = String(error?.message || "");
    console.error("Socratic bot error:", error);

    if (isRateLimitError(msg)) {
      const retrySeconds = extractRetrySeconds(msg);
      return NextResponse.json(
        {
          error: "RATE_LIMIT",
          message: "Rate limit 😅 נסה שוב בעוד כמה שניות",
          retryAfterSeconds: retrySeconds,
        },
        { status: 429, headers: { "Retry-After": String(retrySeconds) } }
      );
    }

    return NextResponse.json(
      { error: "Failed to process request", details: msg || "Unknown error" },
      { status: 500 }
    );
  }
}
