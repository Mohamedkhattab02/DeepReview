// src/app/api/socraticbot/route.ts
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
// Fallback feedback (אם תרצה להשאיר)
// ======================
function fallbackFinalFeedback() {
  return {
    comprehensionScore: 70,
    criticalThinkingScore: 68,
    qualityScore: 72,
    strengths: [
      "Completed the full Socratic flow",
      "Stayed engaged through all questions",
      "Provided structured answers",
      "Showed effort to explain reasoning",
    ],
    weaknesses: [
      "Some answers could include more specific details",
      "Critical evaluation could be deeper",
      "More evidence/examples would strengthen arguments",
    ],
    recommendations: [
      "Review the methodology section and summarize it in your own words",
      "Practice connecting results to real-world implications",
      "Try to question assumptions/limitations explicitly",
      "Add 1–2 concrete examples in each answer next time",
    ],
    summaryText:
      "You completed the Socratic session and demonstrated a solid baseline understanding. To improve further, focus on using specific evidence from the paper and adding deeper critical evaluation. Keep practicing structured reasoning and connecting findings to implications.",
    isFallback: true,
  };
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
  // 1. Extract scores from answeredArr
  const scores: number[] = answeredArr
    .slice(0, 5)
    .map((x: any) => (Number.isFinite(Number(x?.score)) ? Number(x.score) : 0));

  while (scores.length < 5) scores.push(0);

  // 2. Calculate average
  const avg = Math.round(((scores.reduce((sum, s) => sum + s, 0) / 5) * 100)) / 100;

  // 3. Difficulty path
  const difficultyPath: number[] = answeredArr
    .slice(0, 5)
    .map((x: any) => (Number.isFinite(Number(x?.difficulty)) ? Number(x.difficulty) : 0));

  while (difficultyPath.length < 5) difficultyPath.push(0);

  // 4. Fallback feedback
  const baseFeedback = fallbackFinalFeedback();

  const finalFeedback = {
    ...baseFeedback,
    averageScore: avg,
    scores,
    difficultyPath,
    summaryText: `Session complete. Final average score: ${avg}/100. ${baseFeedback.summaryText}`,
  };

  // 5. ✅ INSERT into student_progress (NEW ROW per session)
  const { error: progressError } = await supabase
    .from("student_progress")
    .insert({
      user_id: user.id,
      article_id: articleId,
      session_id: sessionId,

      final_average_score: avg,

      question_scores: JSON.stringify(scores),
      difficulty_path: JSON.stringify(difficultyPath),

      comprehension_score: baseFeedback.comprehensionScore ?? null,
      critical_thinking_score: baseFeedback.criticalThinkingScore ?? null,
      quality_score: baseFeedback.qualityScore ?? null,

      strengths: JSON.stringify(baseFeedback.strengths ?? []),
      weaknesses: JSON.stringify(baseFeedback.weaknesses ?? []),
      recommendations: JSON.stringify(baseFeedback.recommendations ?? []),
    });

  if (progressError) {
    console.error("❌ student_progress insert failed:", progressError);
    // Don't throw - still return success to user
  } else {
    console.log("✅ student_progress row inserted successfully");
  }

  // 6. Return response to client
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
