import { useState } from 'react';
import { videoAPI } from '../services/api';
import { Video, Transcription } from '../types/index';

interface VideoListProps {
  videos: Video[];
  onVideoDeleted: () => void;
}

export default function VideoList({ videos, onVideoDeleted }: VideoListProps) {
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluído':
        return 'bg-green-100 text-green-800';
      case 'erro':
        return 'bg-red-100 text-red-800';
      case 'transcrevendo':
      case 'extraindo_audio':
        return 'bg-yellow-100 text-yellow-800';
      case 'pendente':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluído':
        return 'Concluído';
      case 'erro':
        return 'Erro';
      case 'transcrevendo':
        return 'Transcrevendo';
      case 'extraindo_audio':
        return 'Extraindo Áudio';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  const handleDelete = async (videoId: number) => {
    if (!confirm('Tem certeza que deseja deletar este vídeo?')) return;

    try {
      setIsDeleting(true);
      await videoAPI.delete(videoId);
      onVideoDeleted();
    } catch (error) {
      console.error('Erro ao deletar vídeo:', error);
      alert('Erro ao deletar vídeo');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetails = async (videoId: number) => {
    try {
      setIsLoadingDetails(true);
      const response = await videoAPI.get(videoId);
      setSelectedVideo(response.data);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      alert('Erro ao carregar detalhes da transcrição');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (videos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">Nenhum vídeo enviado ainda.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Meus Vídeos</h2>
        <p className="text-gray-600">Total: {videos.length} vídeo(s)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Nome do Arquivo
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Data de Upload
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {video.filename}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(video.status)}`}>
                    {getStatusLabel(video.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(video.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-sm text-right space-x-4">
                  {video.status === 'concluído' && (
                    <button
                      onClick={() => handleViewDetails(video.id)}
                      disabled={isLoadingDetails}
                      className="text-blue-600 hover:text-blue-700 font-semibold disabled:text-gray-400"
                    >
                      Ver Transcrição
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(video.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 font-semibold disabled:text-gray-400"
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Transcrição */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Transcrição: {selectedVideo.filename}
              </h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              {selectedVideo.transcription ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-sm font-semibold text-gray-600">Falantes:</span>
                    {selectedVideo.transcription.content.speakers.map((speaker: string, i: number) => (
                      <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                        {speaker}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {selectedVideo.transcription.content.dialogue.map((line: any, i: number) => (
                      <div key={i} className="border-l-4 border-blue-200 pl-4 py-1">
                        <p className="text-xs font-bold text-blue-600 uppercase">{line.speaker}</p>
                        <p className="text-gray-800">{line.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-600 py-10">Transcrição não encontrada ou ainda em processamento.</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 text-right">
              <button
                onClick={() => setSelectedVideo(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
