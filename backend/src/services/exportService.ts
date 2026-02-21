import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, NumberFormat } from 'docx';
import { Book, Chapter } from '../types/index.js';

export async function generatePDF(book: Book & { chapters: Chapter[] }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Times-Roman é uma das fontes padrão do PDFKit (Standard 14 fonts)
    const doc = new PDFDocument({ margin: 72, size: 'A4' }); // 72pt = 1 inch margin
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // --- CAPA ---
    doc.moveDown(10);
    doc.fontSize(32).font('Times-Bold').text(book.title, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(16).font('Times-Roman').text('Autor Profissional', { align: 'center' });
    doc.moveDown(15);
    doc.fontSize(12).text(new Date().toLocaleDateString('pt-BR'), { align: 'center' });

    // --- SUMÁRIO ---
    doc.addPage();
    doc.fontSize(24).font('Times-Bold').text('Sumário', { align: 'left' });
    doc.moveDown(2);
    book.chapters.forEach((chapter) => {
      doc.fontSize(12).font('Times-Roman').text(
        `Capítulo ${chapter.chapter_number}: ${chapter.title}`,
        { indent: 20 }
      );
      doc.moveDown(0.5);
    });

    // --- CAPÍTULOS ---
    book.chapters.forEach((chapter) => {
      doc.addPage();
      
      // Título do Capítulo
      doc.fontSize(18).font('Times-Bold').text(
        `Capítulo ${chapter.chapter_number}`,
        { align: 'left' }
      );
      doc.fontSize(24).font('Times-Bold').text(chapter.title, { align: 'left' });
      doc.moveDown(2);

      // Conteúdo em Prosa Corrida
      // No PDFKit, o espaçamento entre linhas é controlado por lineGap
      doc.fontSize(12).font('Times-Roman').text(chapter.content, {
        align: 'justify',
        lineGap: 4, // Aproximadamente 1.5 de espaçamento
        paragraphGap: 12
      });

      // Numeração de página no rodapé
      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        if (i > 0) { // Não mostrar na capa
          doc.fontSize(10).font('Times-Roman').text(
            `${i + 1}`,
            0,
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
  const children: any[] = [];

  // --- CAPA ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400 },
      children: [
        new TextRun({
          text: book.title,
          bold: true,
          size: 64, // 32pt
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: 'Autor Profissional',
          size: 32, // 16pt
          font: 'Times New Roman',
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
          font: 'Times New Roman',
        }),
      ],
      pageBreakAfter: true
    })
  );

  // --- SUMÁRIO ---
  children.push(
    new Paragraph({
      text: 'Sumário',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: 'Sumário', bold: true, size: 48, font: 'Times New Roman' })
      ]
    })
  );

  book.chapters.forEach((chapter) => {
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: `Capítulo ${chapter.chapter_number}: ${chapter.title}`,
            size: 24, // 12pt
            font: 'Times New Roman',
          })
        ]
      })
    );
  });

  children.push(new Paragraph({ text: '', pageBreakBefore: true }));

  // --- CAPÍTULOS ---
  book.chapters.forEach((chapter) => {
    children.push(
      new Paragraph({
        spacing: { before: 400 },
        children: [
          new TextRun({
            text: `Capítulo ${chapter.chapter_number}`,
            bold: true,
            size: 36, // 18pt
            font: 'Times New Roman',
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 600 },
        children: [
          new TextRun({
            text: chapter.title,
            bold: true,
            size: 48, // 24pt
            font: 'Times New Roman',
          })
        ]
      })
    );

    // O conteúdo é prosa corrida, então tratamos como parágrafos
    const paragraphs = chapter.content.split('\n');
    paragraphs.forEach(p => {
      if (!p.trim()) return;
      
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 200 }, // 1.5 line spacing
          children: [
            new TextRun({
              text: p.trim(),
              size: 24, // 12pt
              font: 'Times New Roman',
            })
          ]
        })
      );
    });

    children.push(new Paragraph({ text: '', pageBreakBefore: true }));
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            pageNumber: {
              start: 1,
              format: NumberFormat.DECIMAL,
            },
          },
        },
        children: children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
