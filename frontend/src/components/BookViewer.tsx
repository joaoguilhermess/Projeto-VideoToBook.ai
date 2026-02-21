import { useState } from 'react';
import { Book } from '../types/index';
import api from '../services/api';

interface BookViewerProps {
  book: Book;
  onClose: () => void;
}

export default function BookViewer({ book, onClose }: BookViewerProps) {
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  if (!book.chapters || book.chapters.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={onClose}
          className="text-blue-600 hover:text-blue-700 font-semibold mb-4"
        >
          ← Voltar
        </button>
        <p className="text-gray-600">Nenhum capítulo disponível.</p>
      </div>
    );
  }

  const currentChapter = book.chapters[selectedChapter];

  const handleExport = async (format: 'pdf' | 'word') => {
    try {
      setIsExporting(true);
      const response = await api.get(`/books/${book.id}/export/${format}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${book.title}.${format === 'pdf' ? 'pdf' : 'docx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Erro ao exportar ${format}:`, error);
      alert(`Erro ao exportar livro para ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Índice */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6 sticky top-6">
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-700 font-semibold mb-4 block"
          >
            ← Voltar
          </button>

          <h3 className="text-lg font-bold text-gray-900 mb-4">Índice</h3>
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto mb-6">
            {book.chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => setSelectedChapter(index)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  selectedChapter === index
                    ? 'bg-blue-100 text-blue-900 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm">{chapter.title}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <p className="text-sm font-bold text-gray-700 mb-2">Exportar Livro Completo:</p>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <span>📄</span> {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </button>
            <button
              onClick={() => handleExport('word')}
              disabled={isExporting}
              className="w-full bg-blue-800 hover:bg-blue-900 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <span>doc</span> {isExporting ? 'Exportando...' : 'Exportar Word'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{book.title}</h1>
            <p className="text-gray-600">
              Capítulo {currentChapter.chapter_number} de {book.chapters.length}
            </p>
          </div>

          <div className="border-b-2 border-gray-200 pb-6 mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{currentChapter.title}</h2>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {currentChapter.content}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-200">
            <button
              onClick={() => setSelectedChapter(Math.max(0, selectedChapter - 1))}
              disabled={selectedChapter === 0}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              ← Capítulo Anterior
            </button>

            <span className="text-gray-600">
              {selectedChapter + 1} / {book.chapters.length}
            </span>

            <button
              onClick={() => setSelectedChapter(Math.min(book.chapters!.length - 1, selectedChapter + 1))}
              disabled={selectedChapter === book.chapters!.length - 1}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Próximo Capítulo →
            </button>
          </div>

          {/* Download Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                const text = `${book.title}\n\n${currentChapter.title}\n\n${currentChapter.content}`;
                const element = document.createElement('a');
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                element.setAttribute('download', `${book.title} - ${currentChapter.title}.txt`);
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              ⬇️ Baixar Capítulo Atual (TXT)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
