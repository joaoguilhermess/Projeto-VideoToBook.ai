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
    
    // Limpar capítulos existentes caso seja uma regeração
    await db.run('DELETE FROM chapters WHERE book_id = ?', [bookId]);

    const transcriptionTexts = transcriptions.map((t, index) => {
      const dialogue = t.dialogue.map((d) => `${d.speaker}: ${d.text}`).join('\n');
      return `--- FONTE DE CONTEÚDO ${index + 1} ---\n${dialogue}`;
    }).join('\n\n');

    const prompt = `Gere o conteúdo de um livro utilizando exclusivamente as transcrições fornecidas como base.
O texto final deve ser completamente reescrito em linguagem típica de livro publicado, sem qualquer traço de oralidade, palestra ou apresentação.

A saída deve seguir RIGOROSAMENTE o formato abaixo.
NÃO adicione, remova ou altere qualquer elemento estrutural.

FORMATO OBRIGATÓRIO DA SAÍDA:
[Título do Livro]
[Nome do Autor]
Sumário
Capítulo 1
Título do Capítulo 1
Texto do capítulo em parágrafos corridos e contínuos.
Capítulo 2
Título do Capítulo 2
Texto do capítulo em parágrafos corridos e contínuos.
(Repetir exatamente o mesmo padrão para todos os ${numberOfChapters} capítulos.)

REGRAS ESTRUTURAIS (OBRIGATÓRIAS):
– A saída deve conter apenas os elementos do formato definido.
– Não inserir qualquer texto antes do título.
– Não inserir qualquer texto após o último capítulo.
– Não adicionar prefácio, introdução ou notas.
– Não criar seções internas dentro dos capítulos.
– Não usar listas, marcadores ou numeração.
– Não usar subtítulos adicionais.
– Não inserir separadores visuais.

REGRAS DE SUMÁRIO:
– A palavra "Sumário" deve aparecer isoladamente.
– Não listar capítulos manualmente.
– Não inserir numeração de páginas.
– Não criar índice manual.

REGRAS DE CAPÍTULOS:
– Utilizar exatamente o padrão "Capítulo X".
– Utilizar exatamente o padrão "Título do Capítulo X".
– Cada capítulo deve conter apenas texto corrido.
– Cada capítulo deve possuir no MÍNIMO 2 e no MÁXIMO 4 parágrafos.
– Não usar rótulos como Introdução, Resumo ou Conclusão.

TRATAMENTO DO CONTEÚDO:
– Remover completamente marcas de oralidade.
– Eliminar repetições e redundâncias.
– Reorganizar ideias para leitura linear.
– Unificar conceitos sobrepostos.
– Garantir progressão lógica entre capítulos.

DIRETRIZES DE ESTILO:
– Prosa editorial fluida e natural.
– Tom de livro publicado, não didático.
– Escrita segura, confiante e autoral.
– Evitar frases genéricas ou artificiais.
– Evitar linguagem instrucional ou acadêmica.
– Evitar qualquer construção típica de material educacional.

PROIBIÇÕES ABSOLUTAS:
– Não mencionar palestras, transcrições ou contexto de origem.
– Não escrever em tom conversacional.
– Não explicar decisões de escrita.
– Não comentar a estrutura.
– Não utilizar linguagem de aula ou treinamento.

O texto deve soar como obra escrita por um autor humano experiente.

FONTES DE CONTEÚDO:
${transcriptionTexts}

Gere o livro completo agora com ${numberOfChapters} capítulos.`;

    console.log(`📝 Gerando livro completo ${bookId} em uma única requisição...`);
    
    const result = await model.generateContent(prompt);
    const fullText = result.response.text();

    // PARSER DO LIVRO COMPLETO
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    // Título e Autor (primeiras duas linhas)
    const bookTitle = lines[0] || 'Livro sem Título';
    const authorName = lines[1] || 'Autor Desconhecido';

    // Atualizar título do livro no banco
    await db.run('UPDATE books SET title = ? WHERE id = ?', [bookTitle, bookId]);

    // Identificar capítulos
    const chaptersData: { number: number, title: string, content: string[] }[] = [];
    let currentChapter: any = null;

    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      
      // Ignorar a palavra "Sumário" isolada
      if (line.toLowerCase() === 'sumário') continue;

      // Detectar "Capítulo X"
      const chapterMatch = line.match(/^Capítulo\s+(\d+)$/i);
      if (chapterMatch) {
        if (currentChapter) chaptersData.push(currentChapter);
        currentChapter = {
          number: parseInt(chapterMatch[1]),
          title: lines[i + 1] || `Capítulo ${chapterMatch[1]}`,
          content: []
        };
        i++; // Pular a linha do título que já pegamos
        continue;
      }

      if (currentChapter) {
        currentChapter.content.push(line);
      }
    }
    if (currentChapter) chaptersData.push(currentChapter);

    // Salvar capítulos no banco de forma única
    for (const chap of chaptersData) {
      await db.run(
        'INSERT INTO chapters (book_id, chapter_number, title, content) VALUES (?, ?, ?, ?)',
        [bookId, chap.number, chap.title, chap.content.join('\n\n')]
      );
    }

    await db.run(
      'UPDATE books SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['concluído', bookId]
    );

    console.log(`✅ Livro ${bookId} ("${bookTitle}") gerado com sucesso em lote.`);
  } catch (error) {
    console.error(`❌ Erro na geração em lote:`, error);
    await db.run('UPDATE books SET status = ? WHERE id = ?', ['erro', bookId]);
    throw error;
  }
}
