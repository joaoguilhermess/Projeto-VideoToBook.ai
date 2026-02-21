import { useState } from 'react';
import { bookAPI } from '../services/api';
import { Video } from '../types/index';

interface BookCreatorProps {
  videos: Video[];
  onBookCreated: () => void;
}

export default function BookCreator({ videos, onBookCreated }: BookCreatorProps) {
  const [title, setTitle] = useState('');
  const [selectedTranscriptions, setSelectedTranscriptions] = useState<number[]>([]);
  const [numberOfChapters, setNumberOfChapters] = useState(5);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtrar apenas vídeos com transcrições concluídas
  const completedVideos = videos.filter(v => v.status === 'concluído' && v.transcription_count && v.transcription_count > 0);

  const handleToggleTranscription = (videoId: number) => {
    setSelectedTranscriptions(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newArray = [...selectedTranscriptions];
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
      setSelectedTranscriptions(newArray);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < selectedTranscriptions.length - 1) {
      const newArray = [...selectedTranscriptions];
      [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
      setSelectedTranscriptions(newArray);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Título do livro é obrigatório');
      return;
    }

    if (selectedTranscriptions.length === 0) {
      setError('Selecione pelo menos uma transcrição');
      return;
    }

    if (numberOfChapters < 1 || numberOfChapters > 20) {
      setError('Número de capítulos deve estar entre 1 e 20');
      return;
    }

    try {
      setIsCreating(true);
      await bookAPI.create(title, selectedTranscriptions, numberOfChapters);
      setSuccess('Livro criado com sucesso! Começando a gerar capítulos...');
      
      // Limpar formulário
      setTitle('');
      setSelectedTranscriptions([]);
      setNumberOfChapters(5);

      // Chamar callback após 2 segundos
      setTimeout(() => {
        onBookCreated();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar livro');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Criar Novo Livro</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleCreateBook} className="space-y-6">
        {/* Título */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Título do Livro
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Meu Livro Incrível"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Número de Capítulos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Número de Capítulos
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              max="20"
              value={numberOfChapters}
              onChange={(e) => setNumberOfChapters(parseInt(e.target.value))}
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <span className="text-gray-600 text-sm">Entre 1 e 20 capítulos</span>
          </div>
        </div>

        {/* Seleção de Transcrições */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Selecione as Transcrições
          </label>
          <p className="text-gray-600 text-sm mb-4">
            {completedVideos.length} vídeo(s) com transcrição disponível(is)
          </p>

          {completedVideos.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
              Nenhum vídeo com transcrição disponível. Faça upload de vídeos e aguarde o processamento.
            </div>
          ) : (
            <div className="space-y-3">
              {completedVideos.map((video) => (
                <div key={video.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={`video-${video.id}`}
                    checked={selectedTranscriptions.includes(video.id)}
                    onChange={() => handleToggleTranscription(video.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor={`video-${video.id}`} className="flex-1 cursor-pointer">
                    <p className="font-semibold text-gray-900">{video.filename}</p>
                    <p className="text-sm text-gray-600">
                      Enviado em {new Date(video.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ordem das Transcrições */}
        {selectedTranscriptions.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ordem das Transcrições
            </label>
            <p className="text-gray-600 text-sm mb-4">
              Você selecionou {selectedTranscriptions.length} transcrição(ções)
            </p>
            <div className="space-y-2">
              {selectedTranscriptions.map((videoId, index) => {
                const video = completedVideos.find(v => v.id === videoId);
                return (
                  <div key={videoId} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm font-semibold text-gray-900">
                      {index + 1}. {video?.filename}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 font-semibold"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === selectedTranscriptions.length - 1}
                        className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 font-semibold"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botão de Criação */}
        <button
          type="submit"
          disabled={isCreating || selectedTranscriptions.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          {isCreating ? 'Criando Livro...' : 'Criar Livro'}
        </button>
      </form>
    </div>
  );
}
