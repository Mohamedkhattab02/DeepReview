/**
 * Article upload page for students.
 * Renders the ArticleUploader component to handle PDF uploads and submission.
 * Acts as a client-side entry point within the student dashboard.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ArticleUploader from "@/components/student/ArticleUploader";

export default function UploadPage() {
  return <ArticleUploader />;
}

