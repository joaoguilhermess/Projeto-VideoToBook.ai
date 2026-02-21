import { Response } from 'express';
import { getDatabase } from '../config/database.js';
import { addVideoToQueue } from '../queues/videoProcessingQueue.js';
import { AuthRequest, Video, Transcription, TranscriptionContent } from '../types/index.js';
import fs from 'fs/promises';

export async function uploadVideo(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    // Corrigir encoding do nome do arquivo (latin1 para utf8)
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    const db = await getDatabase();

    // Inserir vídeo no banco de dados
    const result = await db.run(
      'INSERT INTO videos (user_id, filename, filepath, status) VALUES (?, ?, ?, ?)',
      [req.userId, originalName, req.file.path, 'pendente']
    );

    const videoId = result.lastID as number;

    console.log(`📹 Vídeo ${videoId} enviado por usuário ${req.userId}: ${originalName}`);

    // Adicionar à fila de processamento
    addVideoToQueue(videoId);

    res.status(201).json({
      message: 'Vídeo enviado com sucesso',
      videoId,
      filename: originalName,
      size: req.file.size,
      status: 'pendente'
    });
  } catch (error) {
    console.error('❌ Erro ao fazer upload de vídeo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload de vídeo' });
  }
}

export async function listVideos(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const db = await getDatabase();

    const videos = await db.all(
      `SELECT id, filename, status, created_at, processed_at 
       FROM videos 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      req.userId
    ) as Video[];

    res.json(videos);
  } catch (error) {
    console.error('❌ Erro ao listar vídeos:', error);
    res.status(500).json({ error: 'Erro ao listar vídeos' });
  }
}

export async function getVideo(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const db = await getDatabase();

    const video = await db.get(
      `SELECT v.id, v.filename, v.status, v.created_at, v.processed_at,
              COUNT(t.id) as transcription_count
       FROM videos v
       LEFT JOIN transcriptions t ON v.id = t.video_id
       WHERE v.id = ? AND v.user_id = ?
       GROUP BY v.id`,
      [id, req.userId]
    ) as any;

    if (!video) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    // Obter transcrição se existir
    let transcription = null;
    if (video.transcription_count > 0) {
      const trans = await db.get(
        'SELECT id, content, created_at FROM transcriptions WHERE video_id = ?',
        id
      ) as Transcription | undefined;
      if (trans) {
        transcription = {
          ...trans,
          content: JSON.parse(trans.content)
        };
      }
    }

    res.json({
      ...video,
      transcription
    });
  } catch (error) {
    console.error('❌ Erro ao obter vídeo:', error);
    res.status(500).json({ error: 'Erro ao obter vídeo' });
  }
}

export async function deleteVideo(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const db = await getDatabase();

    // Verificar se o vídeo pertence ao usuário
    const video = await db.get(
      'SELECT filepath FROM videos WHERE id = ? AND user_id = ?',
      [id, req.userId]
    ) as any;

    if (!video) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    // Deletar arquivo
    try {
      await fs.unlink(video.filepath);
    } catch (e) {
      console.warn(`⚠️ Não foi possível deletar arquivo: ${video.filepath}`);
    }

    // Deletar do banco de dados (cascata deleta transcrições)
    await db.run('DELETE FROM videos WHERE id = ?', id);

    console.log(`🗑️ Vídeo ${id} deletado`);

    res.json({ message: 'Vídeo deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar vídeo:', error);
    res.status(500).json({ error: 'Erro ao deletar vídeo' });
  }
}
