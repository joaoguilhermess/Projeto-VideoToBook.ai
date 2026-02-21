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

    const contextPrompt = `Escreva um livro técnico/didático com linguagem natural, fluida e profissional, semelhante a um livro técnico moderno publicado.
O texto deve soar humano, autoral e intelectualmente seguro.
É proibido produzir conteúdo com aparência de material escolar genérico, apostila, ou texto típico de IA.

REGRAS GERAIS DE ESCRITA:
– Priorizar clareza, precisão e densidade conceitual.
– Utilizar parágrafos curtos e legíveis.
– Evitar prolixidade e redundância.
– Evitar linguagem inflada ou excessivamente acadêmica.
– Preferir afirmações conceituais diretas e assertivas.
– Manter tom de livro técnico moderno, não de aula ou apostila.

PROIBIÇÕES DE ESTILO (CRÍTICO):
– Não usar frases genéricas típicas de IA ou didáticas.
– Proibido: “Neste capítulo veremos”, “Imagine”, “Considere”, “Suponha”.
– Evitar verbos diluidores como “refere-se”, “consiste em”, “visa apresentar”.
– Evitar definições excessivamente escolares ou acadêmicas.
– Evitar repetições de ideias entre seções.
– Evitar tom pedagógico artificial ou professoral.

DIRETRIZES DE LINGUAGEM:
– Preferir frases declarativas fortes.
– Priorizar explicações incisivas e analíticas.
– Reduzir abstrações desnecessárias.
– Manter escrita natural, segura e profissional.
– O texto deve parecer escrito por um especialista experiente.

REGRAS ESTRUTURAIS OBRIGATÓRIAS:
– Todos os capítulos devem possuir títulos específicos e informativos. Nunca utilizar títulos genéricos.
– Não repetir cabeçalhos ou estruturas redundantes.
– Separar claramente cada capítulo em seções numeradas.
– Variar naturalmente o tamanho e o ritmo das seções para evitar aparência mecânica.

ESTRUTURA OBRIGATÓRIA DE CADA CAPÍTULO:
Capítulo X – [Título Claro, Específico e Informativo]
1. Introdução: Abertura intelectualmente envolvente e direta. Evitar construções genéricas.
2. Conceito Central: Definições firmes e assertivas. Linguagem segura e não escolar.
3. Exemplo, História ou Analogia: Iniciar de forma concreta e direta. Proibido usar “Imagine”, “Considere” ou hipóteses genéricas. O exemplo deve ter função analítica clara.
4. Explicação Técnica: Aprofundamento progressivo e não redundante. Evitar repetir definições já apresentadas.
5. Implicações Práticas: Aplicações realistas e não triviais. Evitar obviedades.
6. Resumo do Capítulo: OBRIGATORIAMENTE em lista estruturada (bullet points). Frases curtas, claras e escaneáveis. Nunca em parágrafos longos.
7. Gancho para o Próximo Capítulo: Criar continuidade intelectual natural. Evitar simplesmente anunciar o próximo tema. Estimular progressão conceitual.

CONTROLE DE QUALIDADE TEXTUAL:
– O texto NÃO deve parecer gerado por IA. Evitar padrões repetitivos ou mecânicos.
– Priorizar naturalidade e autoridade conceitual.

FONTES DE CONTEÚDO:
${transcriptionTexts}

Responda apenas "PRONTO" para começar a geração capítulo por capítulo.`;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: contextPrompt }] },
        { role: 'model', parts: [{ text: 'PRONTO' }] }
      ]
    });

    for (let i = 1; i <= numberOfChapters; i++) {
      const chapterPrompt = i === 1
        ? `Gere o CAPÍTULO 1. Siga rigorosamente a estrutura e as proibições de estilo (sem "Imagine", "Neste capítulo", etc). Comece diretamente com "Capítulo 1 - [Título]".`
        : `Gere o CAPÍTULO ${i}. Mantenha a continuidade intelectual com o capítulo anterior. Siga rigorosamente a estrutura e as proibições de estilo. Comece diretamente com "Capítulo ${i} - [Título]".`;

      console.log(`📝 Gerando capítulo ${i}/${numberOfChapters} (Escrita Humana Ultra-Refinada)...`);
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
