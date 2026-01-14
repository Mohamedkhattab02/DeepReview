// src/lib/export.ts
"use client";

import jsPDF from "jspdf";
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from "docx";
import { saveAs } from "file-saver";

// ==============================
// Helpers
// ==============================
function safeArr(value: any): string[] {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function safeText(value: any, fallback = "N/A"): string {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s.length ? s : fallback;
}

function fileSafeName(name: string): string {
  return name
    .trim()
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

// ==============================
// Export Abstract to PDF
// ==============================
export async function exportAbstractToPDF(
  title: string,
  authors: string[],
  abstract: string
) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Title
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(title, maxWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 8 + 10;

  // Authors
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "italic");
  const authorsText = (authors || []).join(", ");
  const authorLines = pdf.splitTextToSize(authorsText || "Not specified", maxWidth);
  pdf.text(authorLines, margin, yPosition);
  yPosition += authorLines.length * 6 + 10;

  // Line separator
  pdf.setDrawColor(200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Abstract
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  const abstractLines = pdf.splitTextToSize(abstract || "Not available", maxWidth);

  abstractLines.forEach((line: string) => {
    if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.text(line, margin, yPosition);
    yPosition += 6;
  });

  pdf.save(`${fileSafeName(title.substring(0, 50))}_abstract.pdf`);
}

// ==============================
// Export Abstract to Word
// ==============================
export async function exportAbstractToWord(
  title: string,
  authors: string[],
  abstract: string
) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: (authors || []).length ? authors.join(", ") : "Not specified",
                italics: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: "Abstract",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({
            text: abstract || "Not available",
            spacing: { line: 360 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileSafeName(title.substring(0, 50))}_abstract.docx`);
}

// ==============================
// Types for Comparison Export (MATCH YOUR UI)
// ==============================
type ExportArticle = {
  title: string;
  authors?: string[];
  year?: string;
  pages?: string;
  abstract?: string;
};

type ExportComparisonData = {
  similarityScore?: number;
  similarityLabel?: string;

  sharedTopics?: string[];
  uniqueTopics1?: string[];
  uniqueTopics2?: string[];

  sharedKeywords?: string[];
  uniqueKeywords1?: string[];
  uniqueKeywords2?: string[];
};

// ==============================
// Export Comparison to PDF
// ==============================
export async function exportComparisonToPDF(
  article1: ExportArticle,
  article2: ExportArticle,
  comparisonData: ExportComparisonData
) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  const ensureSpace = (needed = 10) => {
    if (yPosition > pageHeight - margin - needed) {
      pdf.addPage();
      yPosition = 20;
    }
  };

  const addText = (text: string, fontSize: number, style: "normal" | "italic" | "bold" = "normal") => {
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", style);
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      ensureSpace(fontSize + 6);
      pdf.text(line, margin, yPosition);
      yPosition += fontSize * 0.5 + 3;
    });
    yPosition += 4;
  };

  const addSectionTitle = (text: string) => {
    addText(text, 14, "bold");
  };

  const addList = (items: string[]) => {
    const arr = safeArr(items);
    if (!arr.length) {
      addText("• None", 11, "normal");
      return;
    }
    arr.forEach((item, idx) => addText(`${idx + 1}. ${item}`, 11, "normal"));
  };

  // Header
  addText("Article Comparison Report", 18, "bold");

  // Similarity summary
  const score = typeof comparisonData?.similarityScore === "number" ? comparisonData.similarityScore : 0;
  const label = safeText(comparisonData?.similarityLabel, "N/A");
  addSectionTitle("Similarity");
  addText(`${label} (${score}%)`, 12, "normal");

  // Article 1
  addSectionTitle("Article 1");
  addText(`Title: ${safeText(article1?.title)}`, 12, "normal");
  addText(`Authors: ${safeArr(article1?.authors).join(", ") || "Not specified"}`, 11, "italic");
  addText(`Year: ${safeText(article1?.year)}   |   Pages: ${safeText(article1?.pages)}`, 11, "normal");
  addText(`Abstract: ${safeText(article1?.abstract, "Not available")}`, 10, "normal");

  // Article 2
  addSectionTitle("Article 2");
  addText(`Title: ${safeText(article2?.title)}`, 12, "normal");
  addText(`Authors: ${safeArr(article2?.authors).join(", ") || "Not specified"}`, 11, "italic");
  addText(`Year: ${safeText(article2?.year)}   |   Pages: ${safeText(article2?.pages)}`, 11, "normal");
  addText(`Abstract: ${safeText(article2?.abstract, "Not available")}`, 10, "normal");

  // Topics
  addSectionTitle("Topics");
  addText("Shared Topics:", 12, "bold");
  addList(comparisonData?.sharedTopics ?? []);

  addText("Unique Topics (Article 1):", 12, "bold");
  addList(comparisonData?.uniqueTopics1 ?? []);

  addText("Unique Topics (Article 2):", 12, "bold");
  addList(comparisonData?.uniqueTopics2 ?? []);

  // Keywords
  addSectionTitle("Keywords");
  addText("Shared Keywords:", 12, "bold");
  addList(comparisonData?.sharedKeywords ?? []);

  addText("Unique Keywords (Article 1):", 12, "bold");
  addList(comparisonData?.uniqueKeywords1 ?? []);

  addText("Unique Keywords (Article 2):", 12, "bold");
  addList(comparisonData?.uniqueKeywords2 ?? []);

  const name = fileSafeName(
    `comparison_${safeText(article1?.title, "article1")}_VS_${safeText(article2?.title, "article2")}`
  );

  pdf.save(`${name}.pdf`);
}

// ==============================
// Export Comparison to Word
// ==============================
export async function exportComparisonToWord(
  article1: ExportArticle,
  article2: ExportArticle,
  comparisonData: ExportComparisonData
) {
  const score = typeof comparisonData?.similarityScore === "number" ? comparisonData.similarityScore : 0;
  const label = safeText(comparisonData?.similarityLabel, "N/A");

  const listToParagraphs = (items: string[]) => {
    const arr = safeArr(items);
    if (!arr.length) {
      return [new Paragraph({ text: "• None", spacing: { after: 100 } })];
    }
    return arr.map(
      (item, idx) =>
        new Paragraph({
          text: `${idx + 1}. ${item}`,
          spacing: { after: 100 },
        })
    );
  };

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Article Comparison Report",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Similarity
          new Paragraph({
            text: "Similarity",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: `${label} (${score}%)`,
            spacing: { after: 300 },
          }),

          // Article 1
          new Paragraph({
            text: "Article 1",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({ text: `Title: ${safeText(article1?.title)}`, spacing: { after: 100 } }),
          new Paragraph({
            children: [
              new TextRun({ text: `Authors: ${safeArr(article1?.authors).join(", ") || "Not specified"}`, italics: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Year: ${safeText(article1?.year)}   |   Pages: ${safeText(article1?.pages)}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Abstract: ${safeText(article1?.abstract, "Not available")}`,
            spacing: { after: 300 },
          }),

          // Article 2
          new Paragraph({
            text: "Article 2",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({ text: `Title: ${safeText(article2?.title)}`, spacing: { after: 100 } }),
          new Paragraph({
            children: [
              new TextRun({ text: `Authors: ${safeArr(article2?.authors).join(", ") || "Not specified"}`, italics: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Year: ${safeText(article2?.year)}   |   Pages: ${safeText(article2?.pages)}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Abstract: ${safeText(article2?.abstract, "Not available")}`,
            spacing: { after: 400 },
          }),

          // Topics
          new Paragraph({
            text: "Topics",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({ text: "Shared Topics", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }),
          ...listToParagraphs(comparisonData?.sharedTopics ?? []),

          new Paragraph({ text: "Unique Topics (Article 1)", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
          ...listToParagraphs(comparisonData?.uniqueTopics1 ?? []),

          new Paragraph({ text: "Unique Topics (Article 2)", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
          ...listToParagraphs(comparisonData?.uniqueTopics2 ?? []),

          // Keywords
          new Paragraph({
            text: "Keywords",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({ text: "Shared Keywords", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }),
          ...listToParagraphs(comparisonData?.sharedKeywords ?? []),

          new Paragraph({ text: "Unique Keywords (Article 1)", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
          ...listToParagraphs(comparisonData?.uniqueKeywords1 ?? []),

          new Paragraph({ text: "Unique Keywords (Article 2)", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
          ...listToParagraphs(comparisonData?.uniqueKeywords2 ?? []),
        ],
      },
    ],
  });

  const name = fileSafeName(
    `comparison_${safeText(article1?.title, "article1")}_VS_${safeText(article2?.title, "article2")}`
  );

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${name}.docx`);
}
