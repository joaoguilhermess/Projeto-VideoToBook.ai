import { getGeminiModel } from '../config/gemini.js';
import fs from 'fs/promises';
import { TranscriptionContent } from '../types/index.js';

export async function transcribeAudio(audioPath: string): Promise<TranscriptionContent> {
  const model = getGeminiModel();

  try {
    // Ler o arquivo de áudio
    const audioData = await fs.readFile(audioPath);
    const audioBase64 = audioData.toString('base64');

    const prompt = `Você é um assistente especializado em transcrição de áudio. 
Transcreva o áudio fornecido identificando cada falante de forma clara.
Formate a saída APENAS como JSON (sem markdown, sem explicações) com a seguinte estrutura:
{
  "speakers": ["Falante 1", "Falante 2", ...],
  "dialogue": [
    {"speaker": "Falante 1", "text": "..."},
    {"speaker": "Falante 2", "text": "..."}
  ]
}

Se houver apenas um falante, use "Narrador" como nome.
Se não conseguir identificar o falante, use "Desconhecido".
Mantenha a ordem cronológica das falas.`;

    console.log('🔄 Enviando áudio para transcrição com Gemini AI...');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'audio/mpeg',
          data: audioBase64
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    const text = response.text();

    console.log('📝 Resposta recebida do Gemini AI');

    // Extrair JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Não foi possível extrair JSON da resposta do Gemini AI');
    }

    const transcription = JSON.parse(jsonMatch[0]) as TranscriptionContent;

    // Validar estrutura
    if (!transcription.speakers || !Array.isArray(transcription.speakers)) {
      throw new Error('Estrutura inválida: falta campo "speakers"');
    }

    if (!transcription.dialogue || !Array.isArray(transcription.dialogue)) {
      throw new Error('Estrutura inválida: falta campo "dialogue"');
    }

    console.log(`✅ Transcrição concluída: ${transcription.dialogue.length} falas identificadas`);
    return transcription;
  } catch (error) {
    console.error('❌ Erro ao transcrever áudio:', error);
    throw error;
  }
}
