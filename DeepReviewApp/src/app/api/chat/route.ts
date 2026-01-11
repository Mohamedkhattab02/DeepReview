
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
    const systemPrompt = `You are an academic reading assistant.

ROLE:
Answer the question using ONLY the information from the provided documents to help student to understand it.

STRICT RULES:
1. Answer ONLY based on the article text below
2. Do NOT use external knowledge
3. Do NOT add information that does not appear in the article
4. Do NOT ask the student questions
5. If the information is not in the documents, clearly state that
6. Be concise but comprehensive.

Article Information:
Title: ${article.title}
Authors: ${article.authors?.join(", ") || "Unknown"}
Abstract: ${article.abstract || "No abstract available"}
Main Topics: ${article.main_topics?.join(", ") || "Not analyzed yet"}
Keywords: ${article.keywords?.join(", ") || "Not analyzed yet"}

FULL ARTICLE TEXT (ONLY SOURCE OF TRUTH):
${article.full_text?.substring(0, 30000) || "No full text available"}

Answering Rules:
- Respond clearly and directly
- Base every answer on the article text
- You may quote or paraphrase from th e text
- Keep answers concise and focused
- No opinions, no assumptions
- DO NOT answer questions that are not related to the article


MISSION:
Help the student understand THIS article only.`;


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
