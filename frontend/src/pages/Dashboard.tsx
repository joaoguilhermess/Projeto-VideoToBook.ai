import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { videoAPI, bookAPI } from '../services/api';
import { Video, Book, BookStats } from '../types/index';
import VideoUpload from '../components/VideoUpload';
import VideoList from '../components/VideoList';
import BookList from '../components/BookList';
import BookCreator from '../components/BookCreator';

type Tab = 'videos' | 'books' | 'create-book';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('videos');
  const [videos, setVideos] = useState<Video[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<BookStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
      await checkAuth();
      if (!user) {
        navigate('/login');
        return;
      }
      await loadData();
    };
    initDashboard();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [videosRes, booksRes, statsRes] = await Promise.all([
        videoAPI.list(),
        bookAPI.list(),
        bookAPI.getStats(),
      ]);
      setVideos(videosRes.data);
      setBooks(booksRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoUploaded = async () => {
    await loadData();
  };

  const handleVideoDeleted = async () => {
    await loadData();
  };

  const handleBookCreated = async () => {
    await loadData();
    setActiveTab('books');
  };

  const handleBookDeleted = async () => {
    await loadData();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">VideoToBook.ai</h1>
            <p className="text-gray-600">Bem-vindo, {user?.name}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total de Vídeos</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total_videos}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Vídeos Processados</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed_videos}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total de Livros</p>
              <p className="text-3xl font-bold text-purple-600">{stats.total_books}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Livros Concluídos</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.completed_books}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total de Capítulos</p>
              <p className="text-3xl font-bold text-orange-600">{stats.total_chapters}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'videos'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Vídeos
          </button>
          <button
            onClick={() => setActiveTab('books')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'books'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Livros
          </button>
          <button
            onClick={() => setActiveTab('create-book')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'create-book'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Criar Livro
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'videos' && (
            <div className="space-y-6">
              <VideoUpload onUploadSuccess={handleVideoUploaded} />
              <VideoList videos={videos} onVideoDeleted={handleVideoDeleted} />
            </div>
          )}

          {activeTab === 'books' && (
            <BookList books={books} onBookDeleted={handleBookDeleted} />
          )}

          {activeTab === 'create-book' && (
            <BookCreator
              videos={videos}
              onBookCreated={handleBookCreated}
            />
          )}
        </div>
      </div>
    </div>
  );
}
