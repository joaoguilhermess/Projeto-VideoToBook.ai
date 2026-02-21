import { useState } from 'react';
import { videoAPI } from '../services/api';
import { Video } from '../types/index';

interface VideoListProps {
  videos: Video[];
  onVideoDeleted: () => void;
}

export default function VideoList({ videos, onVideoDeleted }: VideoListProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const response = await videoAPI.get(videoId);
      setSelectedVideoId(videoId);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
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
                <td className="px-6 py-4 text-sm text-right space-x-2">
                  {video.status === 'concluído' && (
                    <button
                      onClick={() => handleViewDetails(video.id)}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
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
    </div>
  );
}
