export interface User {
  id: number;
  email: string;
  name: string;
  created_at?: string;
}

export interface Video {
  id: number;
  filename: string;
  status: 'pendente' | 'extraindo_audio' | 'transcrevendo' | 'concluído' | 'erro';
  created_at: string;
  processed_at: string | null;
  transcription_count?: number;
  transcription?: Transcription;
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
  content: TranscriptionContent;
  created_at: string;
}

export interface Book {
  id: number;
  title: string;
  status: 'pendente' | 'gerando' | 'concluído' | 'erro';
  created_at: string;
  completed_at: string | null;
  chapters?: Chapter[];
}

export interface Chapter {
  id: number;
  chapter_number: number;
  title: string;
  content: string;
  created_at: string;
}

export interface BookStats {
  total_videos: number;
  completed_videos: number;
  total_books: number;
  completed_books: number;
  total_chapters: number;
}
