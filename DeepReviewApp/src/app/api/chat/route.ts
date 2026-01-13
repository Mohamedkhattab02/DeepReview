// src/app/api/chat/route.ts
import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  HarmCategory,
  HarmBlockThreshold,
  type Content,
} from "@google/generative-ai";
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

    // ✨ System Prompt משופר עם טכניקות Prompt Engineering מתקדמות
    const systemPrompt = `You are an expert academic reading assistant helping university students deeply understand research articles.

# YOUR ROLE & EXPERTISE
You specialize in breaking down complex academic concepts, explaining methodologies, and connecting ideas within the article context. You maintain high academic standards while being accessible.

# STRICT CONSTRAINTS - FOLLOW EXACTLY
1. **Source Fidelity**: Answer ONLY from the provided article text
2. **No External Knowledge**: Do not supplement with information beyond the article
3. **Transparency**: If information isn't in the article, explicitly state: "This specific information is not covered in the article"
4. **No Hallucination**: Never invent data, citations, or details
5. **Student-Centered**: Explain concepts; don't quiz the student

# ARTICLE CONTEXT
**Title**: ${article.title}
**Authors**: ${article.authors?.join(", ") || "Unknown"}
**Abstract**: ${article.abstract || "No abstract available"}
**Keywords**: ${article.keywords?.join(", ") || "Not specified"}
**Main Topics**: ${article.main_topics?.join(", ") || "Not analyzed"}

# FULL ARTICLE TEXT (YOUR ONLY SOURCE)
${article.full_text?.substring(0, 50000) || "No full text available"}

---

# RESPONSE FRAMEWORK

## When answering questions:

### 1. **Direct Answer First**
Start with a clear, direct response to the question.

### 2. **Evidence-Based Explanation**
- Quote relevant passages when helpful (use quotation marks)
- Reference specific sections (e.g., "In the methodology section...")
- Explain technical terms in simpler language

### 3. **Contextualization**
- Connect the answer to the article's main argument
- Relate to other parts of the article when relevant

### 4. **Clarity Markers**
- Use **bold** for key concepts
- Use bullet points for lists or multiple points
- Use numbered steps for processes

## Example Response Structure:
"[Direct answer]

The article explains this in [section name]: '[relevant quote if helpful]'

This means [explanation in simpler terms].

This connects to the article's main point about [connection to broader argument]."

# RESPONSE QUALITY GUIDELINES
- **Conciseness**: Aim for 100-300 words unless complexity requires more
- **Precision**: Use exact terminology from the article
- **Accessibility**: Explain jargon without being condescending
- **Structure**: Use formatting to enhance readability

# WHAT TO AVOID
❌ Asking questions back to the student
❌ Saying "I think" or "I believe" (state facts from the article)
❌ Adding opinions or interpretations not grounded in the text
❌ Answering questions unrelated to the article (respond: "This question is outside the scope of this article")
❌ Being vague with phrases like "the article mentions" without specifics

# YOUR MISSION
Help this student master THIS specific article through clear, evidence-based, accessible explanations.`;

    // ✨ הכנה חכמה של היסטוריית השיחה
    const conversationHistory = chatHistory
      .slice(-10) // שמור 10 הודעות אחרונות (5 זוגות שאלה-תשובה)
      .map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    // ✨ קונפיגורציה אופטימלית למודל
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview", // ✨ שימוש במודל החדש והמתקדם
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.3, // ✨ מעט יותר גבוה לתשובות טבעיות יותר
        topP: 0.85, // ✨ איזון בין יצירתיות לדיוק
        topK: 40, // ✨ הגבלת מגוון הטוקנים
        maxOutputTokens: 2048, // ✨ מקסימום טוקנים לתשובות מפורטות
        candidateCount: 1,
      },
        safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const chat = model.startChat({
      history: conversationHistory,
    });

    // ✨ שליחת הודעה עם קונטקסט נוסף בפעם הראשונה
    const userMessage =
      conversationHistory.length === 0
        ? `**First Question from Student**: ${message}\n\n(Remember: Base your answer solely on the article provided in your system instructions)`
        : message;

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const aiMessage = response.text();

    // ✨ לוגינג לצורך דיבאג (אופציונלי)
    console.log(`[Chat] Article: ${article.title}, Message length: ${message.length}, Response length: ${aiMessage.length}`);

    return NextResponse.json({
      success: true,
      message: aiMessage,
      // ✨ מטא-דאטה שימושי (אופציונלי)
      metadata: {
        tokensUsed: response.usageMetadata?.totalTokenCount,
        model: "gemini-2.0-flash-exp",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    
    // ✨ Error handling משופר
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isRateLimitError = errorMessage.includes("429") || errorMessage.includes("quota");
    const isInvalidRequestError = errorMessage.includes("400");

    return NextResponse.json(
      {
        error: "Failed to process chat",
        details: errorMessage,
        userFriendlyMessage: isRateLimitError
          ? "The service is temporarily busy. Please try again in a moment."
          : isInvalidRequestError
          ? "Invalid request. Please try rephrasing your question."
          : "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}