import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(/\.[^/.]+$/, '.mp3');

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .audioChannels(2)
      .audioFrequency(44100)
      .on('end', () => {
        console.log(`✅ Áudio extraído com sucesso: ${audioPath}`);
        resolve(audioPath);
      })
      .on('error', (err) => {
        console.error('❌ Erro ao extrair áudio:', err);
        reject(new Error(`Erro ao extrair áudio: ${err.message}`));
      })
      .run();
  });
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Erro ao obter duração do vídeo: ${err.message}`));
      } else {
        const duration = metadata.format.duration || 0;
        resolve(duration);
      }
    });
  });
}
