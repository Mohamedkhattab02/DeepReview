
// src/app/api/chat/route.ts
import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { articleId, message, chatHistory } = await request.json();

    if (!articleId || !message) {
      return NextResponse.json(
        { error: "Missing articleId or message" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // בדיקת אימות
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

    // בניית הקונטקסט לבוט
    const systemPrompt = `You are a Socratic research assistant. Your role is to help students deeply understand academic articles through thoughtful questions and guided discussion.

Article Information:
Title: ${article.title}
Authors: ${article.authors?.join(", ") || "Unknown"}
Abstract: ${article.abstract || "No abstract available"}
Main Topics: ${article.main_topics?.join(", ") || "Not analyzed yet"}
Keywords: ${article.keywords?.join(", ") || "Not analyzed yet"}

Full Article Text (for reference):
${article.full_text?.substring(0, 30000) || "No full text available"}

Guidelines for your responses:
1. Use the Socratic method: Ask probing questions rather than giving direct answers
2. Guide students to discover insights themselves
3. When students struggle, provide hints or break down complex concepts
4. Encourage critical thinking about methodology, results, and implications
5. Connect ideas within the article and to broader research contexts
6. Be supportive and encouraging
7. If asked direct questions, provide answers but follow up with thought-provoking questions
8. Keep responses concise and focused (2-3 paragraphs max)

Remember: Your goal is to deepen understanding, not just provide information.`;

    // הכנת היסטוריית השיחה ל-Gemini
    const conversationHistory = chatHistory.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // שליחה ל-Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(
      conversationHistory.length === 0
        ? `${systemPrompt}\n\nStudent's first question: ${message}`
        : message
    );

    const response = await result.response;
    const aiMessage = response.text();

    return NextResponse.json({
      success: true,
      message: aiMessage,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
