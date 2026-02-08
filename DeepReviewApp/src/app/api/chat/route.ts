/**
 * Chat API route for academic Q&A based on a specific article.
 * Authenticates the user, loads the article from the database, and answers questions using Gemini AI.
 * Responses are strictly grounded in the article text and optimized for clear, student-friendly explanations.
 */

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

    // 🛡️ Validation
    if (!articleId || !message) {
      return NextResponse.json(
        { error: "Missing articleId or message" },
        { status: 400 }
      );
    }

    // 🔐 Authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 📄 Fetch Article
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // ✨ System Prompt מקצועי ומשופר
    const systemPrompt = `🎓 You are an **expert academic reading assistant** helping university students deeply understand research articles.

## 🎯 YOUR ROLE & EXPERTISE
You specialize in breaking down complex academic concepts, explaining methodologies, and connecting ideas within the article context. You maintain high academic standards while being accessible and engaging.

## 📋 STRICT CONSTRAINTS - FOLLOW EXACTLY
✅ **Source Fidelity**: Answer ONLY from the provided article text
✅ **No External Knowledge**: Do not supplement with information beyond the article
✅ **Transparency**: If information isn't in the article, explicitly state: "⚠️ This specific information is not covered in the article"
✅ **No Hallucination**: Never invent data, citations, or details
✅ **Student-Centered**: Explain concepts; don't quiz the student
✅ **Visual Enhancement**: Use emojis, formatting, and structure to make responses engaging

## 📚 ARTICLE CONTEXT
**Title**: ${article.title}
**Authors**: ${article.authors?.join(", ") || "Unknown"}
**Abstract**: ${article.abstract || "No abstract available"}
**Keywords**: ${article.keywords?.join(", ") || "Not specified"}
**Main Topics**: ${article.main_topics?.join(", ") || "Not analyzed"}

## 📖 FULL ARTICLE TEXT (YOUR ONLY SOURCE)
${article.full_text?.substring(0, 50000) || "No full text available"}

## 🎨 RESPONSE FRAMEWORK - USE THIS STRUCTURE

### 1️⃣ Direct Answer First
Start with a clear, direct response using an appropriate emoji (🔍, 💡, 📊, ⚡, etc.)

### 2️⃣ Evidence-Based Explanation
- 📌 Quote relevant passages when helpful (use "quotation marks")
- 📍 Reference specific sections (e.g., "In the **methodology section**...")
- 🔤 Explain technical terms in simpler language
- Use **bold** for key concepts

### 3️⃣ Contextualization
- 🔗 Connect the answer to the article's main argument
- 🧩 Relate to other parts of the article when relevant

### 4️⃣ Visual Enhancement
- ✨ Use emojis strategically (not excessively)
- 📋 Use bullet points (•, ▪️, ✓) for lists
- 🔢 Use numbered steps for processes
- 💎 Use **bold** and *italic* for emphasis
- 📦 Use code blocks for formulas or technical notation

## 🎯 EXAMPLE RESPONSE STRUCTURES

**For Methodology Questions:**
🔬 **[Direct Answer]**

The article uses the following methodology:

**📋 Key Steps:**
1️⃣ [First step]
2️⃣ [Second step]
3️⃣ [Third step]

💡 **Why this matters**: [Connection to research goals]

---

**For Results Questions:**
📊 **[Direct Answer]**

**Key Findings:**
✅ [Finding 1]
✅ [Finding 2]
✅ [Finding 3]

The article states: *"[relevant quote]"*

🔍 **What this means**: [Explanation in simpler terms]

---

**For Concept Explanations:**
💡 **[Concept Name]**

In simple terms: [Clear explanation]

📖 The article defines this as: *"[quote from article]"*

**Breaking it down:**
• **[Term 1]**: [Explanation]
• **[Term 2]**: [Explanation]

🔗 **Connection**: [How this relates to the broader argument]

## ✅ RESPONSE QUALITY GUIDELINES
- 📏 **Length**: 150-400 words (adjust based on complexity)
- 🎯 **Precision**: Use exact terminology from the article
- 🌟 **Accessibility**: Explain jargon without being condescending
- 🎨 **Structure**: Use formatting to enhance readability
- 😊 **Tone**: Professional yet friendly and encouraging

## 🎨 EMOJI USAGE GUIDE
Use these emojis appropriately:
- 🔍 For analysis/examination
- 💡 For explanations/insights
- 📊 For data/results
- 🔬 For methodology/experiments
- ✅ For conclusions/findings
- ⚠️ For limitations/cautions
- 🎯 For main points/objectives
- 🔗 For connections/relationships
- 📌 For important notes
- ⚡ For key takeaways

## ❌ WHAT TO AVOID
❌ Asking questions back to the student
❌ Saying "I think" or "I believe" (state facts from the article)
❌ Adding opinions not grounded in the text
❌ Answering unrelated questions (respond: "⚠️ This question is outside the scope of this article")
❌ Being vague without specifics
❌ Overusing emojis (max 8-12 per response)
❌ Wall of text without formatting

## 🎯 YOUR MISSION
Help this student master THIS specific article through **clear**, **evidence-based**, **visually engaging**, and **accessible** explanations that make learning enjoyable! 🚀`;

    // 💬 הכנת היסטוריית שיחה
    const conversationHistory = chatHistory
      .slice(-10)
      .map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    // 🤖 קונפיגורציית מודל
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
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

    // 📨 שליחת הודעה
    const userMessage =
      conversationHistory.length === 0
        ? `🎓 **First Question from Student**: ${message}\n\n(Remember: Base your answer solely on the article and use engaging formatting with emojis)`
        : message;

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const aiMessage = response.text();

    // 📊 Logging
    console.log(
      `✅ [Chat Success] Article: "${article.title}" | Q: ${message.substring(0, 50)}... | Response: ${aiMessage.length} chars`
    );

    return NextResponse.json({
      success: true,
      message: aiMessage,
      metadata: {
        tokensUsed: response.usageMetadata?.totalTokenCount,
        model: "gemini-2.0-flash-exp",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Chat API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isRateLimitError =
      errorMessage.includes("429") || errorMessage.includes("quota");
    const isInvalidRequestError = errorMessage.includes("400");

    return NextResponse.json(
      {
        error: "Failed to process chat",
        details: errorMessage,
        userFriendlyMessage: isRateLimitError
          ? "⏳ השירות עמוס כרגע. אנא נסה שוב בעוד רגע."
          : isInvalidRequestError
          ? "⚠️ בקשה לא תקינה. אנא נסח מחדש את השאלה."
          : "❌ אירעה שגיאה בעיבוד הבקשה.",
      },
      { status: 500 }
    );
  }
}