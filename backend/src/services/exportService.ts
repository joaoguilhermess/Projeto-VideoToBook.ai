import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
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
    doc.fontSize(16).font('Times-Bold').text('Sumário', { align: 'center' });
    doc.moveDown(2);
    book.chapters.forEach((chapter) => {
      doc.fontSize(12).font('Times-Roman').text(
        `Capítulo ${chapter.chapter_number}: ${chapter.title}`,
        { align: 'justify' }
      );
      doc.moveDown(0.5);
    });

    // --- CAPÍTULOS (LAYOUT CONTÍNUO) ---
    doc.addPage();
    
    book.chapters.forEach((chapter, index) => {
      // Verifica se há espaço suficiente para o título (aprox. 100pt)
      // Se estiver muito perto do fim da página, pula para a próxima
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      } else if (index > 0) {
        doc.moveDown(3);
      }
      
      // Título do Capítulo (Centralizado)
      doc.fontSize(16).font('Times-Bold').text(
        `Capítulo ${chapter.chapter_number}`,
        { align: 'center' }
      );
      
      doc.moveDown(1); // Linha de espaço entre capítulo e título
      
      doc.fontSize(16).font('Times-Bold').text(chapter.title, { align: 'center' });
      doc.moveDown(2);

      const paragraphs = chapter.content.split('\n');
      paragraphs.forEach(p => {
        const trimmed = p.trim();
        if (!trimmed) return;
        
        doc.fontSize(12).font('Times-Roman').text(trimmed, {
          align: 'justify',
          lineGap: 4,
          paragraphGap: 10,
          indent: 36 
        });
      });
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
      alignment: AlignmentType.CENTER,
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

  // --- CAPÍTULOS (LAYOUT CONTÍNUO) ---
  book.chapters.forEach((chapter, index) => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: index === 0 ? 0 : 800 },
        keepWithNext: true, // Mantém o número do capítulo com o próximo parágrafo (espaço)
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
        alignment: AlignmentType.CENTER,
        keepWithNext: true, // Mantém o espaço com o título
        children: [new TextRun({ text: "" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        keepWithNext: true, // Mantém o título com o primeiro parágrafo do texto
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
      const trimmed = p.trim();
      if (!trimmed) return;
      
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          spacing: { line: 360, after: 200 },
          children: [
            new TextRun({
              text: trimmed,
              size: 24, // 12pt
              font: 'Times New Roman',
            })
          ]
        })
      );
    });
  });

  const doc = new Document({
    sections: [
      {
        children: children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
