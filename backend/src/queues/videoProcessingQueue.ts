import Queue from 'better-queue';
import { getDatabase } from '../config/database.js';
import { extractAudio } from '../services/audioExtractor.js';
import { transcribeAudio } from '../services/transcriptionService.js';
import fs from 'fs/promises';
import { VideoJob } from '../types/index.js';

export const videoQueue = new Queue<VideoJob>(
  async (job, cb) => {
    const { videoId } = job;
    const db = await getDatabase();

    try {
      // Obter informações do vídeo
      const video = await db.get('SELECT * FROM videos WHERE id = ?', videoId);

      if (!video) {
        throw new Error(`Vídeo ${videoId} não encontrado`);
      }

      console.log(`\n🎬 Processando vídeo ${videoId}: ${video.filename}`);

      // Atualizar status para extraindo_audio
      await db.run(
        'UPDATE videos SET status = ? WHERE id = ?',
        ['extraindo_audio', videoId]
      );

      // Extrair áudio
      const audioPath = await extractAudio(video.filepath);

      // Atualizar status para transcrevendo
      await db.run(
        'UPDATE videos SET status = ? WHERE id = ?',
        ['transcrevendo', videoId]
      );

      // Transcrever áudio
      const transcription = await transcribeAudio(audioPath);

      // Salvar transcrição no banco de dados
      await db.run(
        'INSERT INTO transcriptions (video_id, content) VALUES (?, ?)',
        [videoId, JSON.stringify(transcription)]
      );

      // Atualizar status para concluído
      await db.run(
        'UPDATE videos SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['concluído', videoId]
      );

      // Limpar arquivo de áudio temporário
      try {
        await fs.unlink(audioPath);
      } catch (e) {
        console.warn(`⚠️ Não foi possível deletar arquivo temporário: ${audioPath}`);
      }

      console.log(`✅ Vídeo ${videoId} processado com sucesso\n`);
      cb(null, { success: true });
    } catch (error) {
      console.error(`❌ Erro ao processar vídeo ${videoId}:`, error);

      // Atualizar status para erro
      await db.run(
        'UPDATE videos SET status = ? WHERE id = ?',
        ['erro', videoId]
      );

      cb(error as Error);
    }
  },
  {
    concurrent: 1, // Processar um vídeo por vez
    maxRetries: 2,
    retryDelay: 5000,
    autoStart: true
  }
);

// Event listeners
videoQueue.on('task_failed', (taskId, error) => {
  console.error(`❌ Falha na tarefa ${taskId}:`, error);
});

videoQueue.on('task_finish', (taskId) => {
  console.log(`✅ Tarefa ${taskId} concluída`);
});

export function addVideoToQueue(videoId: number): void {
  videoQueue.push({ videoId });
  console.log(`📋 Vídeo ${videoId} adicionado à fila de processamento`);
}

export function getQueueLength(): number {
  return videoQueue.length;
}
