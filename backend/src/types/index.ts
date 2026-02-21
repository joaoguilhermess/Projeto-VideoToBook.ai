import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}

export interface Video {
  id: number;
  user_id: number;
  filename: string;
  filepath: string;
  status: 'pendente' | 'extraindo_audio' | 'transcrevendo' | 'concluído' | 'erro';
  created_at: string;
  processed_at: string | null;
}

export interface TranscriptionContent {
  speakers: string[];
  dialogue: Array<{
    speaker: string;
    text: string;
  }>;
}

export interface Transcription {
  id: number;
  video_id: number;
  content: string; // JSON stringified
  created_at: string;
}

export interface Book {
  id: number;
  user_id: number;
  title: string;
  status: 'pendente' | 'gerando' | 'concluído' | 'erro';
  transcription_ids: string; // JSON array stringified
  created_at: string;
  completed_at: string | null;
}

export interface Chapter {
  id: number;
  book_id: number;
  chapter_number: number;
  title: string;
  content: string;
  created_at: string;
}

export interface VideoJob {
  videoId: number;
}

export interface BookGenerationJob {
  bookId: number;
  numberOfChapters: number;
}
