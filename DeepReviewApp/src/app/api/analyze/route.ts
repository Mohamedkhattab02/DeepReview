// app/api/analyze/route.ts
/**
 * API route that analyzes an academic article using Gemini AI.
 * It extracts structured metadata (title, authors, abstract, keywords, topics) from the article text.
 * The extracted analysis is saved back into the database and returned as a JSON response.
 */
import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { articleId } = await request.json();

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get article
    const { data: article, error: fetchError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (fetchError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!article.full_text) {
      return NextResponse.json(
        { error: "No text to analyze" },
        { status: 400 }
      );
    }

    // Analyze with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Analyze the following academic article and extract key information in JSON format.

Article Text:
${article.full_text.substring(0, 50000)}

Please provide a JSON response with the following structure (ONLY JSON, no markdown):
{
  "title": "Extracted or corrected article title",
  "authors": ["Author 1", "Author 2"],
  "abstract": "Article abstract or summary",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "publication_year": 2024,
  "main_topics": ["topic1", "topic2", "topic3"]
}

If you cannot extract certain information, use null for that field.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let analysisData;
    try {
      // Remove markdown code blocks if present
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      analysisData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      analysisData = {
        title: article.title,
        authors: [],
        abstract: null,
        keywords: [],
        publication_year: null,
        main_topics: [],
      };
    }

    // Update article with analysis
    const { error: updateError } = await supabase
      .from("articles")
      .update({
        title: analysisData.title || article.title,
        authors: analysisData.authors || [],
        abstract: analysisData.abstract,
        keywords: analysisData.keywords || [],
        publication_year: analysisData.publication_year,
        main_topics: analysisData.main_topics || [],
        analysis_completed: true,
      })
      .eq("id", articleId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save analysis" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Analysis completed",
      data: analysisData,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: "Analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}