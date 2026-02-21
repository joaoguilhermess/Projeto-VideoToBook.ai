import { useState, useEffect } from 'react';
import { bookAPI, videoAPI } from '../services/api';
import { Video } from '../types/index';

interface BookCreatorProps {
  videos: Video[];
  onBookCreated: () => void;
}

export default function BookCreator({ videos, onBookCreated }: BookCreatorProps) {
  const [title, setTitle] = useState('');
  const [selectedVideoIds, setSelectedVideoIds] = useState<number[]>([]);
  const [videoDetails, setVideoDetails] = useState<Record<number, any>>({});
  const [numberOfChapters, setNumberOfChapters] = useState(5);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtrar apenas vídeos com status concluído
  const completedVideos = videos.filter(v => v.status === 'concluído');

  // Carregar detalhes dos vídeos concluídos para obter os IDs das transcrições
  useEffect(() => {
    const loadDetails = async () => {
      const details: Record<number, any> = {};
      for (const video of completedVideos) {
        try {
          const response = await videoAPI.get(video.id);
          details[video.id] = response.data;
        } catch (err) {
          console.error(`Erro ao carregar detalhes do vídeo ${video.id}:`, err);
        }
      }
      setVideoDetails(details);
    };

    if (completedVideos.length > 0) {
      loadDetails();
    }
  }, [videos]);

  const handleToggleVideo = (videoId: number) => {
    setSelectedVideoIds(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newArray = [...selectedVideoIds];
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
      setSelectedVideoIds(newArray);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < selectedVideoIds.length - 1) {
      const newArray = [...selectedVideoIds];
      [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
      setSelectedVideoIds(newArray);
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

    if (selectedVideoIds.length === 0) {
      setError('Selecione pelo menos um vídeo');
      return;
    }

    // Mapear IDs de vídeos para IDs de transcrições
    const transcriptionIds = selectedVideoIds
      .map(videoId => videoDetails[videoId]?.transcription?.id)
      .filter(id => id !== undefined);

    if (transcriptionIds.length === 0) {
      setError('Não foi possível encontrar as transcrições dos vídeos selecionados');
      return;
    }

    try {
      setIsCreating(true);
      await bookAPI.create(title, transcriptionIds, numberOfChapters);
      setSuccess('Livro criado com sucesso! Começando a gerar capítulos...');
      
      // Limpar formulário
      setTitle('');
      setSelectedVideoIds([]);
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

        {/* Seleção de Vídeos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Selecione os Vídeos para o Livro
          </label>
          <p className="text-gray-600 text-sm mb-4">
            {completedVideos.length} vídeo(s) processado(s) disponível(is)
          </p>

          {completedVideos.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
              Nenhum vídeo processado disponível. Faça upload de vídeos e aguarde a conclusão da transcrição.
            </div>
          ) : (
            <div className="space-y-3">
              {completedVideos.map((video) => {
                const hasTranscription = !!videoDetails[video.id]?.transcription;
                return (
                  <div key={video.id} className={`flex items-center gap-3 p-4 border rounded-lg ${hasTranscription ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                    <input
                      type="checkbox"
                      id={`video-${video.id}`}
                      checked={selectedVideoIds.includes(video.id)}
                      onChange={() => handleToggleVideo(video.id)}
                      disabled={!hasTranscription}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor={`video-${video.id}`} className={`flex-1 ${hasTranscription ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                      <p className="font-semibold text-gray-900">{video.filename}</p>
                      <p className="text-sm text-gray-600">
                        {hasTranscription ? 'Transcrição pronta' : 'Carregando transcrição...'}
                      </p>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ordem das Transcrições */}
        {selectedVideoIds.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ordem dos Capítulos (baseado nos vídeos)
            </label>
            <p className="text-gray-600 text-sm mb-4">
              Você selecionou {selectedVideoIds.length} vídeo(s)
            </p>
            <div className="space-y-2">
              {selectedVideoIds.map((videoId, index) => {
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
                        className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 font-semibold px-2"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === selectedVideoIds.length - 1}
                        className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 font-semibold px-2"
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
          disabled={isCreating || selectedVideoIds.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          {isCreating ? 'Criando Livro...' : 'Criar Livro'}
        </button>
      </form>
    </div>
  );
}
