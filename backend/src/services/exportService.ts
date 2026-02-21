import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, NumberFormat } from 'docx';
import { Book, Chapter } from '../types/index.js';

export async function generatePDF(book: Book & { chapters: Chapter[], author_name?: string }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 72, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const author = book.author_name || 'Autor';

    // --- CAPA ---
    doc.moveDown(10);
    doc.fontSize(24).font('Times-Bold').text(book.title, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(16).font('Times-Roman').text(author, { align: 'center' });
    doc.moveDown(15);
    doc.fontSize(12).font('Times-Roman').text('VideoToBook.ai', { align: 'center' });

    // --- SUMÁRIO ---
    doc.addPage();
    doc.fontSize(16).font('Times-Bold').text('Sumário', { align: 'justify' });
    doc.moveDown(2);
    book.chapters.forEach((chapter) => {
      doc.fontSize(12).font('Times-Roman').text(
        `Capítulo ${chapter.chapter_number}: ${chapter.title}`,
        { align: 'justify' }
      );
      doc.moveDown(0.5);
    });

    // --- CAPÍTULOS ---
    book.chapters.forEach((chapter) => {
      doc.addPage();
      
      // Título do Capítulo
      doc.fontSize(16).font('Times-Bold').text(
        `Capítulo ${chapter.chapter_number}`,
        { align: 'justify' }
      );
      doc.fontSize(16).font('Times-Bold').text(chapter.title, { align: 'justify' });
      doc.moveDown(2);

      // Conteúdo com recuo (tab) no início de cada parágrafo
      const paragraphs = chapter.content.split('\n');
      paragraphs.forEach(p => {
        if (!p.trim()) return;
        
        // Simula um TAB com espaços no início do parágrafo
        doc.fontSize(12).font('Times-Roman').text(`      ${p.trim()}`, {
          align: 'justify',
          lineGap: 4,
          paragraphGap: 10
        });
      });

      // Numeração de página
      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        if (i > 0) {
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

export async function generateWord(book: Book & { chapters: Chapter[], author_name?: string }): Promise<Buffer> {
  const children: any[] = [];
  const author = book.author_name || 'Autor';

  // --- CAPA ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400 },
      children: [
        new TextRun({
          text: book.title,
          bold: true,
          size: 48, // 24pt
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: author,
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
          text: 'VideoToBook.ai',
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
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: 'Sumário', bold: true, size: 32, font: 'Times New Roman' })
      ]
    })
  );

  book.chapters.forEach((chapter) => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
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
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 400 },
        children: [
          new TextRun({
            text: `Capítulo ${chapter.chapter_number}`,
            bold: true,
            size: 32, // 16pt
            font: 'Times New Roman',
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600 },
        children: [
          new TextRun({
            text: chapter.title,
            bold: true,
            size: 32, // 16pt
            font: 'Times New Roman',
          })
        ]
      })
    );

    const paragraphs = chapter.content.split('\n');
    paragraphs.forEach(p => {
      if (!p.trim()) return;
      
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 }, // 720 twips = 0.5 inch (aproximadamente um TAB)
          spacing: { line: 360, after: 200 },
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
