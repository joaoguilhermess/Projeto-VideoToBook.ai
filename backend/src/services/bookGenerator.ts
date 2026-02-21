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
      return `--- Transcrição ${index + 1} ---\n${dialogue}`;
    }).join('\n\n');

    const contextPrompt = `Você é um escritor profissional especializado em transformar transcrições em livros bem estruturados.

Com base nas seguintes transcrições de vídeos, você irá criar um livro bem estruturado e envolvente com ${numberOfChapters} capítulos.

Transcrições:
${transcriptionTexts}

Instruções:
1. Crie um livro coeso que flua naturalmente de um capítulo para o próximo
2. Cada capítulo deve ter aproximadamente 500-800 palavras
3. Mantenha a voz e o tom consistentes ao longo do livro
4. Use as informações das transcrições para criar conteúdo autêntico
5. Estruture cada capítulo com uma introdução, desenvolvimento e conclusão
6. Crie títulos descritivos para cada capítulo

Vamos criar este livro capítulo por capítulo. Começaremos com o capítulo 1.`;

    console.log('🔄 Inicializando conversa com Gemini AI...');

    // Iniciar chat com contexto
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: contextPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'Entendido! Vou criar um livro bem estruturado baseado nas transcrições fornecidas. Estou pronto para começar com o capítulo 1. Qual é o tema principal que você gostaria de explorar neste capítulo?' }]
        }
      ]
    });

    // Gerar cada capítulo
    for (let i = 1; i <= numberOfChapters; i++) {
      try {
        const chapterPrompt = i === 1
          ? `Crie o PRIMEIRO capítulo do livro com o título apropriado. Este capítulo deve estabelecer o contexto, apresentar os temas principais e engajar o leitor. Comece diretamente com o conteúdo do capítulo, sem prefácios.`
          : `Crie o CAPÍTULO ${i} do livro com um título apropriado. Mantenha a coerência com os capítulos anteriores e desenvolva os temas de forma progressiva e interessante. Comece diretamente com o conteúdo do capítulo.`;

        console.log(`📝 Gerando capítulo ${i}/${numberOfChapters}...`);

        const result = await chat.sendMessage(chapterPrompt);
        const chapterContent = result.response.text();

        // Extrair título e conteúdo (se o Gemini incluir título no formato "# Título\n\nConteúdo")
        let chapterTitle = `Capítulo ${i}`;
        let content = chapterContent;

        const titleMatch = chapterContent.match(/^#\s+(.+?)[\n\r]/);
        if (titleMatch) {
          chapterTitle = titleMatch[1].trim();
          content = chapterContent.replace(/^#\s+.+?[\n\r]/, '').trim();
        }

        // Salvar capítulo no banco de dados
        await db.run(
          'INSERT INTO chapters (book_id, chapter_number, title, content) VALUES (?, ?, ?, ?)',
          [bookId, i, chapterTitle, content]
        );

        console.log(`✅ Capítulo ${i} gerado e salvo com sucesso`);

        // Pequeno delay entre requisições para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
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

    console.log(`✅ Livro ${bookId} finalizado com sucesso com ${numberOfChapters} capítulos`);
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
