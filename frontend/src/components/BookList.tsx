import { useState } from 'react';
import { bookAPI } from '../services/api';
import { Book } from '../types/index';
import BookViewer from './BookViewer';

interface BookListProps {
  books: Book[];
  onBookDeleted: () => void;
}

export default function BookList({ books, onBookDeleted }: BookListProps) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluído':
        return 'bg-green-100 text-green-800';
      case 'erro':
        return 'bg-red-100 text-red-800';
      case 'gerando':
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
      case 'gerando':
        return 'Gerando';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  const handleDelete = async (bookId: number) => {
    if (!confirm('Tem certeza que deseja deletar este livro?')) return;

    try {
      setIsDeleting(true);
      await bookAPI.delete(bookId);
      onBookDeleted();
    } catch (error) {
      console.error('Erro ao deletar livro:', error);
      alert('Erro ao deletar livro');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewBook = async (bookId: number) => {
    try {
      const response = await bookAPI.get(bookId);
      setSelectedBook(response.data);
    } catch (error) {
      console.error('Erro ao carregar livro:', error);
      alert('Erro ao carregar livro');
    }
  };

  if (selectedBook) {
    return <BookViewer book={selectedBook} onClose={() => setSelectedBook(null)} />;
  }

  if (books.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">Nenhum livro criado ainda.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Meus Livros</h2>
        <p className="text-gray-600">Total: {books.length} livro(s)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Título
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Data de Criação
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {books.map((book) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {book.title}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(book.status)}`}>
                    {getStatusLabel(book.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(book.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-sm text-right space-x-2">
                  {book.status === 'concluído' && (
                    <button
                      onClick={() => handleViewBook(book.id)}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Ver Livro
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(book.id)}
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
