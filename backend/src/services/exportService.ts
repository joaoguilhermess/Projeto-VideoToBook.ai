import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageNumber, NumberFormat } from 'docx';
import { Book, Chapter } from '../types/index.js';

export async function generatePDF(book: Book & { chapters: Chapter[] }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: book.title,
        Author: 'Conversor de Vídeos em Livros',
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // --- CAPA ---
    doc.moveDown(10);
    doc.fontSize(32).font('Helvetica-Bold').text(book.title, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica').text('Gerado por Conversor de Vídeos em Livros', { align: 'center' });
    doc.moveDown(15);
    doc.fontSize(12).text(new Date().toLocaleDateString('pt-BR'), { align: 'center' });

    // --- SUMÁRIO ---
    doc.addPage();
    doc.fontSize(24).font('Helvetica-Bold').text('Sumário', { align: 'left' });
    doc.moveDown(1);
    
    book.chapters.forEach((chapter) => {
      doc.fontSize(14).font('Helvetica').text(
        `Capítulo ${chapter.chapter_number}: ${chapter.title}`,
        { indent: 20 }
      );
      doc.moveDown(0.5);
    });

    // --- CAPÍTULOS ---
    book.chapters.forEach((chapter) => {
      doc.addPage();
      
      // Título do Capítulo
      doc.fontSize(20).font('Helvetica-Bold').text(
        `Capítulo ${chapter.chapter_number}`,
        { align: 'left' }
      );
      doc.fontSize(24).text(chapter.title, { align: 'left' });
      doc.moveDown(1.5);

      // Conteúdo
      doc.fontSize(12).font('Helvetica').text(chapter.content, {
        align: 'justify',
        lineGap: 5,
        paragraphGap: 10
      });

      // Rodapé com número de página (simplificado para PDFKit)
      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        if (i > 0) { // Não mostrar na capa
          doc.fontSize(10).text(
            `Página ${i + 1}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }
      }
    });

    doc.end();
  });
}

export async function generateWord(book: Book & { chapters: Chapter[] }): Promise<Buffer> {
  const sections = [];

  // --- CAPA ---
  sections.push({
    properties: {},
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000 },
        children: [
          new TextRun({
            text: book.title,
            bold: true,
            size: 64, // 32pt
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [
          new TextRun({
            text: 'Gerado por Conversor de Vídeos em Livros',
            size: 32, // 16pt
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 4000 },
        children: [
          new TextRun({
            text: new Date().toLocaleDateString('pt-BR'),
            size: 24, // 12pt
          }),
        ],
      }),
    ],
  });

  // --- SUMÁRIO E CAPÍTULOS ---
  const chapterChildren: any[] = [
    new Paragraph({
      text: 'Sumário',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 400 },
    }),
  ];

  book.chapters.forEach((chapter) => {
    chapterChildren.push(
      new Paragraph({
        text: `Capítulo ${chapter.chapter_number}: ${chapter.title}`,
        spacing: { before: 200 },
      })
    );
  });

  // Adicionar quebra de página após sumário
  chapterChildren.push(new Paragraph({ text: '', pageBreakBefore: true }));

  book.chapters.forEach((chapter) => {
    chapterChildren.push(
      new Paragraph({
        text: `Capítulo ${chapter.chapter_number}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400 },
      }),
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: chapter.content,
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 200 }, // 1.5 line spacing
      }),
      new Paragraph({ text: '', pageBreakBefore: true })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections[0].children,
      },
      {
        properties: {
          page: {
            pageNumber: {
              start: 1,
              format: NumberFormat.DECIMAL,
            },
          },
        },
        children: chapterChildren,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
