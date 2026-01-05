// src/app/api/socraticbot/route.ts
import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { articleId, sessionId, userAnswer, currentLevel } =
      await request.json();

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

    // קבלת המאמר
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // אם זו השאלה הראשונה - צור שאלה התחלתית
    if (!userAnswer) {
      const prompt = `You are a Socratic teaching bot. Generate the FIRST question (Level 1 of 5) for this academic article.

Article Information:
Title: ${article.title}
Authors: ${article.authors?.join(", ") || "Unknown"}
Abstract: ${article.abstract || "No abstract"}
Main Topics: ${article.main_topics?.join(", ") || "Not available"}
Full Text Preview: ${article.full_text?.substring(0, 3000) || "Not available"}

Guidelines for Level 1 Question:
- Start with a basic comprehension question about the main idea or purpose
- Keep it simple and foundational
- Encourage the student to identify the core research question or goal
- Example: "What is the main research question this paper aims to answer?"

Respond ONLY with the question text, nothing else.`;

      const result = await model.generateContent(prompt);
      const question = (await result.response).text().trim();

      return NextResponse.json({
        question,
        level: 1,
        isCompleted: false,
        feedback: null,
      });
    }

    // אחרת - הערך את התשובה וצור שאלה הבאה
    const nextLevel = currentLevel + 1;
    const isLastQuestion = nextLevel > 5;

    if (isLastQuestion) {
      // זו תשובה לשאלה האחרונה - צור משוב סופי
      const feedbackPrompt = `You are a Socratic teaching bot. The student has completed all 5 questions about this article.

Article: ${article.title}

Provide a comprehensive final feedback that includes:
1. Overall comprehension assessment (score 1-100)
2. Critical thinking evaluation (score 1-100)
3. Answer quality score (score 1-100)
4. Key strengths (3-4 points)
5. Areas for improvement (2-3 points)
6. Specific recommendations for deeper learning (3-4 actionable items)

Format your response as JSON:
{
  "comprehensionScore": 85,
  "criticalThinkingScore": 78,
  "qualityScore": 82,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "summaryText": "A detailed paragraph summarizing the student's performance and growth areas"
}`;

      const result = await model.generateContent(feedbackPrompt);
      const feedbackText = (await result.response).text().trim();

      let feedback;
      try {
        const cleanText = feedbackText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        feedback = JSON.parse(cleanText);
      } catch {
        feedback = {
          comprehensionScore: 75,
          criticalThinkingScore: 75,
          qualityScore: 75,
          strengths: ["Engaged with the material", "Completed all questions"],
          weaknesses: ["Could provide more detailed answers"],
          recommendations: ["Review the methodology section", "Practice critical analysis"],
          summaryText: "Good effort in completing the Socratic discussion.",
        };
      }

      return NextResponse.json({
        question: null,
        level: 6,
        isCompleted: true,
        feedback,
      });
    }

    // צור שאלה הבאה על בסיס התשובה
    const prompt = `You are a Socratic teaching bot. Based on the student's answer, generate the NEXT question (Level ${nextLevel} of 5).

Article: ${article.title}
Current Level: ${nextLevel}

Student's Previous Answer: "${userAnswer}"

Guidelines for Level ${nextLevel}:
${
  nextLevel === 2
    ? "- Focus on methodology and research design\n- Ask about how the research was conducted"
    : nextLevel === 3
    ? "- Dive into findings and results\n- Ask about key discoveries and their significance"
    : nextLevel === 4
    ? "- Explore implications and applications\n- Ask about real-world impact and limitations"
    : "- Challenge critical thinking\n- Ask about alternative interpretations or future directions"
}

First, provide brief feedback on their answer (1-2 sentences), then ask the next question.

Format:
Feedback: [Your feedback here]
Question: [Your next question here]`;

    const result = await model.generateContent(prompt);
    const responseText = (await result.response).text().trim();

    // פרסור התשובה
  const feedbackMatch = responseText.match(
  /Feedback:\s*([\s\S]+?)(?=Question:|$)/
);

const questionMatch = responseText.match(
  /Question:\s*([\s\S]+)$/
);


    const feedback = feedbackMatch ? feedbackMatch[1].trim() : null;
    const question = questionMatch
      ? questionMatch[1].trim()
      : responseText.split("\n").pop() || "Please tell me more about your understanding.";

    return NextResponse.json({
      question,
      level: nextLevel,
      isCompleted: false,
      feedback,
    });
  } catch (error) {
    console.error("Socratic bot error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}