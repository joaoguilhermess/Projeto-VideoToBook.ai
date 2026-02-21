import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, NumberFormat } from 'docx';
import { Book, Chapter } from '../types/index.js';

// Função auxiliar para processar texto com negrito simples (**) no PDFKit
function writeFormattedText(doc: any, text: string, baseSize: number) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  parts.forEach(part => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const cleanPart = part.slice(2, -2);
      doc.font('Helvetica-Bold').fontSize(baseSize).text(cleanPart, { continued: true });
    } else {
      doc.font('Helvetica').fontSize(baseSize).text(part, { continued: true });
    }
  });
  doc.text('', { continued: false }); // Finaliza a linha
}

export async function generatePDF(book: Book & { chapters: Chapter[] }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // CAPA
    doc.moveDown(10);
    doc.fontSize(32).font('Helvetica-Bold').text(book.title, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica').text('Autor Profissional', { align: 'center' });
    doc.moveDown(15);
    doc.fontSize(12).text(new Date().toLocaleDateString('pt-BR'), { align: 'center' });

    // SUMÁRIO
    doc.addPage();
    doc.fontSize(24).font('Helvetica-Bold').text('Sumário', { align: 'left' });
    doc.moveDown(1);
    book.chapters.forEach((chapter) => {
      doc.fontSize(14).font('Helvetica').text(`Capítulo ${chapter.chapter_number}: ${chapter.title}`, { indent: 20 });
      doc.moveDown(0.5);
    });

    // CAPÍTULOS
    book.chapters.forEach((chapter) => {
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text(`Capítulo ${chapter.chapter_number}`, { align: 'left', color: '#444444' });
      doc.fontSize(26).font('Helvetica-Bold').text(chapter.title, { align: 'left' });
      doc.moveDown(2);

      const paragraphs = chapter.content.split('\n');
      paragraphs.forEach(p => {
        if (!p.trim()) {
          doc.moveDown(0.5);
          return;
        }
        
        // Se for um título de seção (ex: "1. Introdução")
        if (/^\d+\./.test(p.trim())) {
          doc.moveDown(0.5);
          doc.fontSize(16).font('Helvetica-Bold').text(p.trim(), { align: 'left' });
          doc.moveDown(0.5);
        } else {
          // Processa negritos no parágrafo
          writeFormattedText(doc, p.trim(), 12);
          doc.moveDown(0.8);
        }
      });

      // Numeração de página
      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        if (i > 0) {
          doc.fontSize(10).font('Helvetica').text(`Página ${i + 1}`, 50, doc.page.height - 50, { align: 'center' });
        }
      }
    });

    doc.end();
  });
}

export async function generateWord(book: Book & { chapters: Chapter[] }): Promise<Buffer> {
  const children: any[] = [];

  // CAPA
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2000 }, children: [new TextRun({ text: book.title, bold: true, size: 64 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: 'Autor Profissional', size: 32 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 4000, after: 1000 }, children: [new TextRun({ text: new Date().toLocaleDateString('pt-BR'), size: 24 })], pageBreakAfter: true })
  );

  // SUMÁRIO
  children.push(new Paragraph({ text: 'Sumário', heading: HeadingLevel.HEADING_1, spacing: { after: 400 } }));
  book.chapters.forEach(c => {
    children.push(new Paragraph({ text: `Capítulo ${c.chapter_number}: ${c.title}`, spacing: { before: 120 } }));
  });
  children.push(new Paragraph({ text: '', pageBreakBefore: true }));

  // CAPÍTULOS
  book.chapters.forEach(chapter => {
    children.push(
      new Paragraph({ text: `Capítulo ${chapter.chapter_number}`, heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
      new Paragraph({ text: chapter.title, heading: HeadingLevel.HEADING_1, spacing: { after: 600 } })
    );

    const paragraphs = chapter.content.split('\n');
    paragraphs.forEach(p => {
      if (!p.trim()) return;

      if (/^\d+\./.test(p.trim())) {
        children.push(new Paragraph({ text: p.trim(), heading: HeadingLevel.HEADING_3, spacing: { before: 300, after: 200 } }));
      } else {
        // Processa negritos no Word
        const textRuns: TextRun[] = [];
        const parts = p.trim().split(/(\*\*.*?\*\*)/g);
        
        parts.forEach(part => {
          if (part.startsWith('**') && part.endsWith('**')) {
            textRuns.push(new TextRun({ text: part.slice(2, -2), bold: true }));
          } else {
            textRuns.push(new TextRun({ text: part }));
          }
        });

        children.push(new Paragraph({ children: textRuns, alignment: AlignmentType.JUSTIFIED, spacing: { line: 360, after: 200 } }));
      }
    });
    children.push(new Paragraph({ text: '', pageBreakBefore: true }));
  });

  const doc = new Document({ sections: [{ properties: { page: { pageNumber: { start: 1, format: NumberFormat.DECIMAL } } }, children }] });
  return await Packer.toBuffer(doc);
}
