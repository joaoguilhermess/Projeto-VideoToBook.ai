import { Response } from 'express';
import { getDatabase } from '../config/database.js';
import { generateBook } from '../services/bookGenerator.js';
import { generatePDF, generateWord } from '../services/exportService.js';
import { AuthRequest, Book, Chapter, Transcription, TranscriptionContent } from '../types/index.js';

export async function createBook(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { title, transcription_ids, numberOfChapters = 5 } = req.body;

    if (!title || !transcription_ids || !Array.isArray(transcription_ids) || transcription_ids.length === 0) {
      return res.status(400).json({ error: 'Título e lista de IDs de transcrições são obrigatórios' });
    }

    if (numberOfChapters < 1 || numberOfChapters > 20) {
      return res.status(400).json({ error: 'Número de capítulos deve estar entre 1 e 20' });
    }

    const db = await getDatabase();

    // Verificar se todas as transcrições pertencem ao usuário
    const placeholders = transcription_ids.map(() => '?').join(',');
    const transcriptions = await db.all(
      `SELECT t.id, t.content, v.user_id
       FROM transcriptions t
       JOIN videos v ON t.video_id = v.id
       WHERE t.id IN (${placeholders})`,
      transcription_ids
    ) as any[];

    if (transcriptions.length !== transcription_ids.length) {
      return res.status(404).json({ error: 'Uma ou mais transcrições não encontradas' });
    }

    // Verificar se todas pertencem ao mesmo usuário
    if (!transcriptions.every(t => t.user_id === req.userId)) {
      return res.status(403).json({ error: 'Você não tem permissão para usar essas transcrições' });
    }

    // Criar livro no banco de dados
    const result = await db.run(
      'INSERT INTO books (user_id, title, status, transcription_ids) VALUES (?, ?, ?, ?)',
      [req.userId, title, 'pendente', JSON.stringify(transcription_ids)]
    );

    const bookId = result.lastID as number;

    console.log(`📖 Novo livro criado: ${bookId} - ${title}`);

    // Iniciar geração de livro em background
    generateBook(
      bookId,
      transcriptions.map(t => JSON.parse(t.content) as TranscriptionContent),
      numberOfChapters
    ).catch(error => {
      console.error(`❌ Erro ao gerar livro ${bookId}:`, error);
    });

    res.status(201).json({
      message: 'Livro criado com sucesso',
      bookId,
      title,
      status: 'pendente',
      numberOfChapters
    });
  } catch (error) {
    console.error('❌ Erro ao criar livro:', error);
    res.status(500).json({ error: 'Erro ao criar livro' });
  }
}

export async function listBooks(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const db = await getDatabase();

    const books = await db.all(
      `SELECT id, title, status, created_at, completed_at 
       FROM books 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      req.userId
    ) as Book[];

    res.json(books);
  } catch (error) {
    console.error('❌ Erro ao listar livros:', error);
    res.status(500).json({ error: 'Erro ao listar livros' });
  }
}

export async function getBook(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const db = await getDatabase();

    const book = await db.get(
      `SELECT id, title, status, created_at, completed_at 
       FROM books 
       WHERE id = ? AND user_id = ?`,
      [id, req.userId]
    ) as Book | undefined;

    if (!book) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    // Obter capítulos
    const chapters = await db.all(
      `SELECT id, chapter_number, title, content, created_at 
       FROM chapters 
       WHERE book_id = ? 
       ORDER BY chapter_number ASC`,
      id
    ) as Chapter[];

    res.json({
      ...book,
      chapters
    });
  } catch (error) {
    console.error('❌ Erro ao obter livro:', error);
    res.status(500).json({ error: 'Erro ao obter livro' });
  }
}

export async function deleteBook(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const db = await getDatabase();

    // Verificar se o livro pertence ao usuário
    const book = await db.get(
      'SELECT id FROM books WHERE id = ? AND user_id = ?',
      [id, req.userId]
    ) as any;

    if (!book) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    // Deletar do banco de dados (cascata deleta capítulos)
    await db.run('DELETE FROM books WHERE id = ?', id);

    console.log(`🗑️ Livro ${id} deletado`);

    res.json({ message: 'Livro deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar livro:', error);
    res.status(500).json({ error: 'Erro ao deletar livro' });
  }
}

export async function getBookStats(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const db = await getDatabase();

    const stats = await db.get(
      `SELECT 
        COUNT(DISTINCT v.id) as total_videos,
        COUNT(DISTINCT CASE WHEN v.status = 'concluído' THEN v.id END) as completed_videos,
        COUNT(DISTINCT b.id) as total_books,
        COUNT(DISTINCT CASE WHEN b.status = 'concluído' THEN b.id END) as completed_books,
        COUNT(DISTINCT c.id) as total_chapters
       FROM users u
       LEFT JOIN videos v ON u.id = v.user_id
       LEFT JOIN books b ON u.id = b.user_id
       LEFT JOIN chapters c ON b.id = c.book_id
       WHERE u.id = ?`,
      req.userId
    ) as any;

    res.json(stats || {
      total_videos: 0,
      completed_videos: 0,
      total_books: 0,
      completed_books: 0,
      total_chapters: 0
    });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
}

export async function exportBookPDF(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
    const { id } = req.params;
    const db = await getDatabase();

    const book = await db.get(
      `SELECT b.*, u.name as author_name 
       FROM books b 
       JOIN users u ON b.user_id = u.id 
       WHERE b.id = ? AND b.user_id = ?`, 
      [id, req.userId]
    );
    if (!book) return res.status(404).json({ error: 'Livro não encontrado' });

    const chapters = await db.all('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC', id);
    const pdfBuffer = await generatePDF({ ...book, chapters });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${book.title}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Erro ao exportar PDF:', error);
    res.status(500).json({ error: 'Erro ao exportar PDF' });
  }
}

export async function exportBookWord(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Não autenticado' });
    const { id } = req.params;
    const db = await getDatabase();

    const book = await db.get(
      `SELECT b.*, u.name as author_name 
       FROM books b 
       JOIN users u ON b.user_id = u.id 
       WHERE b.id = ? AND b.user_id = ?`, 
      [id, req.userId]
    );
    if (!book) return res.status(404).json({ error: 'Livro não encontrado' });

    const chapters = await db.all('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC', id);
    const wordBuffer = await generateWord({ ...book, chapters });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${book.title}.docx"`);
    res.send(wordBuffer);
  } catch (error) {
    console.error('❌ Erro ao exportar Word:', error);
    res.status(500).json({ error: 'Erro ao exportar Word' });
  }
}
