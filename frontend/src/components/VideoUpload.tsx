import { useState } from 'react';
import { videoAPI } from '../services/api';

interface VideoUploadProps {
  onUploadSuccess: () => void;
}

export default function VideoUpload({ onUploadSuccess }: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setError('');
    setSuccess('');
    setIsUploading(true);

    try {
      // Validar tipo de arquivo
      const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Use MP4, MOV, AVI, MKV ou WebM.');
      }

      // Validar tamanho (500MB)
      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo 500MB.');
      }

      const response = await videoAPI.upload(file);
      setSuccess(`Vídeo "${response.data.filename}" enviado com sucesso! Processamento iniciado.`);
      onUploadSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload de Vídeo</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-8-12v12m0 0l-3-3m3 3l3-3"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="text-lg font-semibold text-gray-900 mb-1">
          Arraste um vídeo aqui
        </p>
        <p className="text-gray-600 mb-4">ou</p>

        <label className="inline-block">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
          <span className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg cursor-pointer inline-block transition">
            {isUploading ? 'Enviando...' : 'Selecionar Arquivo'}
          </span>
        </label>

        <p className="text-sm text-gray-500 mt-4">
          Formatos suportados: MP4, MOV, AVI, MKV, WebM (máximo 500MB)
        </p>
      </div>
    </div>
  );
}
