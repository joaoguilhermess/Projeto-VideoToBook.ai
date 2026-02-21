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
    // Atualizar status do livro
    await db.run(
      'UPDATE books SET status = ? WHERE id = ?',
      ['gerando', bookId]
    );

    console.log(`📖 Iniciando geração do livro ${bookId} com ${numberOfChapters} capítulos...`);

    // Preparar contexto inicial com todas as transcrições
    const transcriptionTexts = transcriptions.map((t, index) => {
      const dialogue = t.dialogue
        .map((d) => `${d.speaker}: ${d.text}`)
        .join('\n');
      return `--- Transcrição da Fonte ${index + 1} ---\n${dialogue}`;
    }).join('\n\n');

    const contextPrompt = `Você é um escritor profissional de elite, especializado em transformar transcrições brutas em livros técnicos e didáticos de alta qualidade.

OBJETIVO:
Gere um livro completo, bem organizado, com escrita profissional, didática e fluida baseado nas transcrições fornecidas abaixo.
O livro deve seguir uma estrutura rigorosa e consistente em todos os capítulos.

REGRAS OBRIGATÓRIAS DE FORMATAÇÃO E ORGANIZAÇÃO:
• Cada capítulo deve possuir um título claro, específico e informativo (nunca usar títulos genéricos como “Capítulo 1”).
• Não repetir títulos ou cabeçalhos.
• Separar explicitamente cada capítulo em seções numeradas.
• Evitar blocos longos de texto – priorizar legibilidade.
• Destacar conceitos importantes usando subtítulos e listas quando apropriado.
• Manter tom profissional, coerente e de livro técnico/didático.
• Evitar introduções excessivamente pessoais ou coloquiais.

ESTRUTURA OBRIGATÓRIA DE TODOS OS CAPÍTULOS:
Capítulo X – [Título Claro e Objetivo]
1. Introdução
2. Conceito Central
3. Exemplo, História ou Analogia
4. Explicação Técnica
5. Implicações Práticas
6. Resumo do Capítulo
7. Gancho para o Próximo Capítulo

REQUISITOS DE ESCRITA:
• Texto claro, inteligente e bem conectado.
• Explicações progressivas (do simples ao técnico).
• Conceitos bem destacados.
• Linguagem natural, sem parecer texto artificial.
• Evitar redundância e repetições.

CONTEÚDO DAS TRANSCRIÇÕES:
${transcriptionTexts}

Você irá gerar o livro capítulo por capítulo. Eu solicitarei cada capítulo individualmente para garantir a máxima qualidade e conexão entre eles.
Responda apenas "ENTENDIDO" se você compreendeu todas as regras e está pronto para começar o Capítulo 1.`;

    console.log('🔄 Inicializando conversa com Gemini AI com novo prompt estruturado...');

    // Iniciar chat com contexto
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: contextPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'ENTENDIDO' }]
        }
      ]
    });

    // Gerar cada capítulo
    for (let i = 1; i <= numberOfChapters; i++) {
      try {
        const chapterPrompt = i === 1
          ? `Gere agora o CAPÍTULO 1 do livro. Lembre-se de seguir rigorosamente a estrutura definida (Introdução, Conceito Central, Exemplo/História, Explicação Técnica, Implicações Práticas, Resumo e Gancho). O título deve ser específico e informativo. Comece diretamente com "Capítulo 1 - [Título]".`
          : `Gere agora o CAPÍTULO ${i} do livro. Mantenha a conexão fluida com o capítulo anterior e siga a mesma estrutura rigorosa. O título deve ser específico e informativo. Comece diretamente com "Capítulo ${i} - [Título]".`;

        console.log(`📝 Gerando capítulo ${i}/${numberOfChapters} com estrutura profissional...`);

        const result = await chat.sendMessage(chapterPrompt);
        const chapterContent = result.response.text();

        // Extrair título e conteúdo
        // O Gemini deve começar com "Capítulo X - Título"
        let chapterTitle = `Capítulo ${i}`;
        let content = chapterContent;

        // Tentar capturar o título na primeira linha
        const lines = chapterContent.split('\n');
        const firstLine = lines[0].trim();
        
        // Regex para capturar "Capítulo X - Título" ou "Capítulo X: Título" ou apenas o título se começar com #
        const titleRegex = /^(?:Capítulo\s+\d+\s*[:\-–—]\s*)(.+)$/i;
        const match = firstLine.match(titleRegex);
        
        if (match) {
          chapterTitle = match[1].trim();
          content = lines.slice(1).join('\n').trim();
        } else if (firstLine.startsWith('#')) {
          chapterTitle = firstLine.replace(/^#+\s*/, '').trim();
          content = lines.slice(1).join('\n').trim();
        }

        // Salvar capítulo no banco de dados
        await db.run(
          'INSERT INTO chapters (book_id, chapter_number, title, content) VALUES (?, ?, ?, ?)',
          [bookId, i, chapterTitle, content]
        );

        console.log(`✅ Capítulo ${i} ("${chapterTitle}") gerado e salvo com sucesso`);

        // Pequeno delay entre requisições para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Erro ao gerar capítulo ${i}:`, error);
        throw error;
      }
    }

    // Atualizar status do livro para concluído
    await db.run(
      'UPDATE books SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['concluído', bookId]
    );

    console.log(`✅ Livro ${bookId} finalizado com sucesso com ${numberOfChapters} capítulos estruturados`);
  } catch (error) {
    console.error(`❌ Erro ao gerar livro ${bookId}:`, error);
    
    // Atualizar status para erro
    await db.run(
      'UPDATE books SET status = ? WHERE id = ?',
      ['erro', bookId]
    );

    throw error;
  }
}
