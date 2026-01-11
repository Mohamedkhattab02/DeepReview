"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ArticleUploader from "@/components/student/ArticleUploader";

export default function UploadPage() {
  return <ArticleUploader />;
}

