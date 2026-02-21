import { getGeminiModel } from '../config/gemini.js';
import { getDatabase } from '../config/database.js';
import { TranscriptionContent } from '../types/index.js';

export async function generateBook(
  bookId: number,
  transcriptions: TranscriptionContent[],
  numberOfChapters: number = 5
): Promise<void> {
  const model = getGeminiModel();
  const db = await getDatabase();

  try {
    await db.run('UPDATE books SET status = ? WHERE id = ?', ['gerando', bookId]);

    const transcriptionTexts = transcriptions.map((t, index) => {
      const dialogue = t.dialogue.map((d) => `${d.speaker}: ${d.text}`).join('\n');
      return `--- FONTE DE CONTEÚDO ${index + 1} ---\n${dialogue}`;
    }).join('\n\n');

    const contextPrompt = `Você é um autor de livros técnicos renomado, conhecido por uma escrita natural, humana e intelectualmente segura. Seu objetivo é transformar transcrições brutas em um livro de alta autoridade.

DIRETRIZES DE ESCRITA (CRÍTICO):
– Escreva como um humano especialista, NÃO como uma IA.
– Evite frases genéricas de introdução (ex: "Neste capítulo", "Exploraremos").
– Evite tom excessivamente pedagógico, artificial ou de apostila escolar.
– Priorize clareza, precisão e autoridade. Use parágrafos curtos e fluidos.
– Varie o tamanho das seções para evitar uma aparência mecânica.
– Proibido redundâncias, prolixidade ou linguagem inflada.

ESTRUTURA OBRIGATÓRIA DE CADA CAPÍTULO:
Capítulo X – [Título Específico e Informativo]
1. Introdução: Envolvente, direta e sem clichês.
2. Conceito Central: Definições firmes e claras.
3. Exemplo, História ou Analogia: Função analítica real, nada de exemplos óbvios.
4. Explicação Técnica: Aprofundamento progressivo e não redundante.
5. Implicações Práticas: Aplicações reais e não triviais.
6. Resumo do Capítulo: OBRIGATORIAMENTE em lista estruturada (bullet points).
7. Gancho para o Próximo Capítulo: Continuidade intelectual natural, sem apenas anunciar o tema.

FONTES DE CONTEÚDO:
${transcriptionTexts}

Responda apenas "PRONTO" para começar.`;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: contextPrompt }] },
        { role: 'model', parts: [{ text: 'PRONTO' }] }
      ]
    });

    for (let i = 1; i <= numberOfChapters; i++) {
      const chapterPrompt = i === 1
        ? `Gere o CAPÍTULO 1. Siga rigorosamente a estrutura e as diretrizes de escrita humana. Comece com "Capítulo 1 - [Título]".`
        : `Gere o CAPÍTULO ${i}. Use o conteúdo dos capítulos anteriores para garantir uma progressão intelectual fluida. Mantenha o tom de autoridade e a estrutura obrigatória. Comece com "Capítulo ${i} - [Título]".`;

      console.log(`📝 Gerando capítulo ${i}/${numberOfChapters} (Escrita Humana)...`);
      const result = await chat.sendMessage(chapterPrompt);
      const chapterContent = result.response.text();

      let chapterTitle = `Capítulo ${i}`;
      let content = chapterContent;

      const lines = chapterContent.split('\n');
      const firstLine = lines[0].trim();
      const titleRegex = /^(?:Capítulo\s+\d+\s*[:\-–—]\s*)(.+)$/i;
      const match = firstLine.match(titleRegex);
      
      if (match) {
        chapterTitle = match[1].trim();
        content = lines.slice(1).join('\n').trim();
      }

      await db.run(
        'INSERT INTO chapters (book_id, chapter_number, title, content) VALUES (?, ?, ?, ?)',
        [bookId, i, chapterTitle, content]
      );

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await db.run(
      'UPDATE books SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['concluído', bookId]
    );
  } catch (error) {
    console.error(`❌ Erro:`, error);
    await db.run('UPDATE books SET status = ? WHERE id = ?', ['erro', bookId]);
    throw error;
  }
}
