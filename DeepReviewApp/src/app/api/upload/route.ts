import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "module";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  console.log("✅ HIT /api/upload");

  try {
    // ✅ Load pdf-parse safely (avoid running its demo code)
    const require = createRequire(import.meta.url);
    const pdfParse = require("pdf-parse/lib/pdf-parse.js"); // <-- important

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file || !title?.trim()) {
      return NextResponse.json(
        { error: "Missing file or title" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let fullText = "";
    let pageCount = 0;

    try {
      const parsed = await pdfParse(buffer);
      fullText = parsed?.text || "";
      pageCount = parsed?.numpages || 0;
    } catch (err: any) {
      console.error("PDF parse error:", err);
      fullText = "Text extraction failed";
      pageCount = 0;
    }

    // ✅ Make sure this bucket exists in Supabase Storage
    const bucketName = "articles"; // change if your bucket name is different
    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: article, error: dbError } = await supabase
      .from("articles")
      .insert({
        user_id: user.id,
        title: title.trim(),
        full_text: fullText,
        pages: pageCount,
        analysis_completed: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // (optional) trigger analyze
    fetch(`${request.nextUrl.origin}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: article.id }),
    }).catch((err) => console.error("Analysis trigger failed:", err));

    return NextResponse.json({
      success: true,
      article,
      message: "Article uploaded successfully. Analysis in progress...",
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    // ✅ Always return JSON even on crash
    return NextResponse.json(
      { error: "Internal server error", details: error?.message || "Unknown" },
      { status: 500 }
    );
  }
}
