// src/app/api/socraticbot/route.ts
import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractRetrySeconds(msg: string) {
  const retryMatch = msg.match(/retry in\s+([\d.]+)s/i);
  return retryMatch ? Math.ceil(Number(retryMatch[1])) : 60;
}

function isRateLimitError(msg: string) {
  const m = msg.toLowerCase();
  return (
    m.includes("429") || m.includes("quota") || m.includes("too many requests")
  );
}

async function generateWithRetry(
  model: any,
  prompt: string,
  maxRetries = 1
): Promise<string> {
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

// feedback fallback אם אין מכסה
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

function clampLevel(level: number) {
  return Math.max(1, Math.min(5, level));
}

// הערכת תשובה: נכון/לא נכון + score
async function gradeAnswer(
  model: any,
  article: any,
  question: string,
  answer: string
): Promise<{ isCorrect: boolean; score: number; feedback: string }> {
  const prompt = `You are an educational grader.
Given the academic article context, the question, and the student's answer:
- Decide if the answer is correct enough to be considered "correct".
- If NOT correct: score must be 0.
- If correct: give score 1-100 based on accuracy, completeness, and clarity.
Return ONLY valid JSON:
{
  "isCorrect": true,
  "score": 85,
  "feedback": "1-2 short sentences feedback"
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
    score = Math.max(0, Math.min(100, isCorrect ? score : 0));

    const feedback = typeof parsed.feedback === "string" ? parsed.feedback : "";
    return { isCorrect, score, feedback };
  } catch {
    return {
      isCorrect: false,
      score: 0,
      feedback:
        "Could not evaluate your answer reliably. Please try to be more specific.",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ קוראים JSON פעם אחת בלבד!
    const body = await request.json();
    const {
      articleId,
      sessionId,
      userAnswer,
      currentLevel,
      questionIndex,
      currentQuestion, // ✅ מגיע מהלקוח
    } = body;

    if (!articleId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
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

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ==================================================
    // התחלה: שאלה ראשונה ברמת קושי בינונית (3)
    // ==================================================
    if (!userAnswer) {
      const startLevel = 3;
      const prompt = `You are a Socratic teaching bot. Generate the FIRST question for this academic article.
Difficulty Level: ${startLevel} (1=easy, 5=hard)

Title: ${article.title}
Authors: ${article.authors?.join(", ") || "Unknown"}
Abstract: ${article.abstract || "No abstract"}
Topics: ${article.main_topics?.join(", ") || "Not available"}
Text Preview: ${article.full_text?.substring(0, 3000) || "Not available"}

Guidelines for difficulty ${startLevel}:
- Ask a moderately challenging comprehension question
- Not too basic, not too advanced
- Encourage explanation, not yes/no

Respond ONLY with the question text.`;

      const question = await generateWithRetry(model, prompt, 1);

      return NextResponse.json({
        question,
        level: startLevel,
        questionIndex: 1,
        isCompleted: false,
        feedback: null,
        answerScore: null,
        isCorrect: null,
        averageScore: null,
      });
    }

    // ==================================================
    // אחרי תשובה: ציון + מעלים/מורידים קושי
    // ==================================================
    const qIndex = Number(questionIndex ?? 1); // 1..5
    const difficulty = clampLevel(Number(currentLevel ?? 3)); // 1..5

    // ✅ חייבים לקבל את השאלה הנוכחית מהלקוח כדי לדרג
    if (!currentQuestion || typeof currentQuestion !== "string") {
      return NextResponse.json(
        { error: "Missing currentQuestion for grading" },
        { status: 400 }
      );
    }

    const grading = await gradeAnswer(model, article, currentQuestion, userAnswer);

    const nextDifficulty = clampLevel(
      grading.isCorrect ? difficulty + 1 : difficulty - 1
    );

    const nextQuestionIndex = qIndex + 1;
    const isDone = nextQuestionIndex > 5;

    // ==================================================
    // סיום: averageScore ממוצע 5 ציונים
    // ==================================================
    if (isDone) {
      const { data: sessionData } = await supabase
        .from("socratic_messages")
        .select("questions_answered")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      let scores: number[] = [];

      try {
        if (sessionData?.questions_answered) {
          const parsed = JSON.parse(sessionData.questions_answered);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (typeof item === "object" && item && "score" in item) {
                scores.push(Number((item as any).score) || 0);
              }
            }
          }
        }
      } catch {
        // ignore
      }

      scores.push(grading.score);

      while (scores.length < 5) scores.push(0);
      scores = scores.slice(0, 5);

      const avg =
        Math.round((scores.reduce((a, b) => a + b, 0) / 5) * 100) / 100;

      const finalFeedback = {
        ...fallbackFinalFeedback(),
        averageScore: avg,
        scores,
        summaryText: `Session complete. Final average score: ${avg}/100. ${fallbackFinalFeedback().summaryText}`,
      };

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

    // ==================================================
    // שאלה הבאה לפי nextDifficulty
    // ==================================================
    const prompt = `You are a Socratic teaching bot. Generate the NEXT question.
Difficulty Level: ${nextDifficulty} (1=easy, 5=hard)

Article: ${article.title}
Topics: ${(article.main_topics || []).join(", ") || "Not available"}

Student's previous answer (for context): "${userAnswer}"

Guidelines for difficulty ${nextDifficulty}:
- Level 1: simple comprehension
- Level 2: method/design basics
- Level 3: findings reasoning
- Level 4: implications/limitations
- Level 5: critical thinking, alternatives, future work

Respond ONLY with the question text.`;

    const nextQuestion = await generateWithRetry(model, prompt, 1);

    return NextResponse.json({
      question: nextQuestion,
      level: nextDifficulty,
      questionIndex: nextQuestionIndex,
      isCompleted: false,
      feedback: grading.feedback,
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
        {
          status: 429,
          headers: { "Retry-After": String(retrySeconds) },
        }
      );
    }

    return NextResponse.json(
      { error: "Failed to process request", details: msg || "Unknown error" },
      { status: 500 }
    );
  }
}
