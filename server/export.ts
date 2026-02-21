/**
 * Book export utilities
 * Handles PDF and DOCX export functionality
 */

import { Document, Packer, Paragraph, HeadingLevel, convertInchesToTwip } from "docx";
import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import fetch from "node-fetch";

/**
 * Parse book structure from JSON string or object
 */
function parseBookStructure(content: string): {
  title: string;
  subtitle: string;
  chapters: Array<{
    number: number;
    title: string;
    content: string;
  }>;
  references: string[];
} {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content);
    if (parsed.chapters && Array.isArray(parsed.chapters)) {
      return {
        title: parsed.title || "Untitled",
        subtitle: parsed.subtitle || "",
        chapters: parsed.chapters,
        references: parsed.references || [],
      };
    }
  } catch {
    // Not JSON, treat as markdown
  }

  // Fallback to empty structure
  return {
    title: "Untitled",
    subtitle: "",
    chapters: [],
    references: [],
  };
}

/**
 * Export book to DOCX format
 */
export async function exportToDOCX(
  title: string,
  subtitle: string,
  content: string
): Promise<Buffer> {
  const bookStructure = parseBookStructure(content);

  const paragraphs: Paragraph[] = [];

  // Add title
  paragraphs.push(
    new Paragraph({
      text: bookStructure.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  // Add subtitle
  if (bookStructure.subtitle) {
    paragraphs.push(
      new Paragraph({
        text: bookStructure.subtitle,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 400 },
      })
    );
  }

  // Add chapters
  for (const chapter of bookStructure.chapters) {
    paragraphs.push(
      new Paragraph({
        text: `Capítulo ${chapter.number}: ${chapter.title}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    paragraphs.push(
      new Paragraph({
        text: chapter.content,
        spacing: { after: 200 },
      })
    );
  }

  // Add references
  if (bookStructure.references && bookStructure.references.length > 0) {
    paragraphs.push(
      new Paragraph({
        text: "Referências",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    for (const reference of bookStructure.references) {
      paragraphs.push(
        new Paragraph({
          text: reference,
          spacing: { after: 100 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Export book to PDF format
 */
export async function exportToPDF(
  title: string,
  subtitle: string,
  content: string,
  references?: string[] | null
): Promise<Buffer> {
  const bookStructure = parseBookStructure(content);

  const pdfDoc = await PDFDocument.create();

  // Set page size to A4
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  const contentWidth = pageWidth - 2 * margin;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  const lineHeight = 14;
  const maxLinesPerPage = Math.floor((pageHeight - 2 * margin) / lineHeight);
  let linesOnCurrentPage = 0;

  // Helper function to add text with wrapping
  const addText = (text: string, fontSize: number, isBold: boolean = false) => {
    if (linesOnCurrentPage >= maxLinesPerPage - 2) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
      linesOnCurrentPage = 0;
    }

    // Simple text wrapping
    const words = text.split(" ");
    let line = "";
    const avgCharWidth = fontSize * 0.5;
    const maxCharsPerLine = Math.floor(contentWidth / avgCharWidth);

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;

      if (testLine.length > maxCharsPerLine && line) {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
        linesOnCurrentPage++;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
      linesOnCurrentPage++;
    }
  };

  // Add title
  addText(bookStructure.title, 24, true);
  yPosition -= 20;
  linesOnCurrentPage += 2;

  // Add subtitle
  if (bookStructure.subtitle) {
    addText(bookStructure.subtitle, 14);
    yPosition -= 30;
    linesOnCurrentPage += 3;
  }

  // Add chapters
  for (const chapter of bookStructure.chapters) {
    // Add chapter heading
    addText(`Capítulo ${chapter.number}: ${chapter.title}`, 16, true);
    yPosition -= 8;
    linesOnCurrentPage += 1;

    // Add chapter content
    const contentLines = chapter.content
      .split("\n")
      .filter((line) => line.trim());

    for (const contentLine of contentLines) {
      addText(contentLine, 11);
      yPosition -= 5;
      linesOnCurrentPage += 1;
    }

    yPosition -= 10;
    linesOnCurrentPage += 1;
  }

  // Add references section if available
  const referencesToAdd = bookStructure.references || references || [];
  if (referencesToAdd && referencesToAdd.length > 0) {
    // Add page break if needed
    if (linesOnCurrentPage > maxLinesPerPage - 10) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
      linesOnCurrentPage = 0;
    }

    // Add references title
    addText("Referências", 16, true);
    yPosition -= 15;
    linesOnCurrentPage += 1;

    // Add each reference
    for (const reference of referencesToAdd) {
      addText(reference, 10);
      yPosition -= 8;
      linesOnCurrentPage += 1;
    }
  }

  // Convert PDF to buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
