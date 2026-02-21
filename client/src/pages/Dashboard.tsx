import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { BookOpen, Trash2, Eye, Download, Plus, Loader2, Combine } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [pollingBookId, setPollingBookId] = useState<number | null>(null);
  const [bookProgress, setBookProgress] = useState<{ [key: number]: number }>({});
  const [selectedVideos, setSelectedVideos] = useState<Set<number>>(new Set());
  const [multiVideoTitle, setMultiVideoTitle] = useState("");
  const [showMultiVideoDialog, setShowMultiVideoDialog] = useState(false);

  const videosQuery = trpc.videos.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const booksQuery = trpc.books.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Polling para atualizar status do livro
  useEffect(() => {
    if (!pollingBookId) return;

    const interval = setInterval(() => {
      booksQuery.refetch();
    }, 2000); // Atualiza a cada 2 segundos

    return () => clearInterval(interval);
  }, [pollingBookId, booksQuery]);

  // Parar polling quando livro estiver completo
  useEffect(() => {
    if (pollingBookId && booksQuery.data) {
      const book = booksQuery.data.find((b) => b.id === pollingBookId);
      if (book && book.status === "completed") {
        setPollingBookId(null);
        setBookProgress((prev) => ({ ...prev, [pollingBookId]: 100 }));
        toast.success("Livro gerado com sucesso!");
      } else if (book && book.status === "failed") {
        setPollingBookId(null);
        toast.error("Erro ao gerar livro");
      }
    }
  }, [booksQuery.data, pollingBookId]);

  const deleteVideoMutation = trpc.videos.delete.useMutation({
    onSuccess: () => {
      toast.success("Vídeo deletado com sucesso");
      videosQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar vídeo");
    },
  });

  const deleteBookMutation = trpc.books.delete.useMutation({
    onSuccess: () => {
      toast.success("Livro deletado com sucesso");
      booksQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar livro");
    },
  });

  const createBookMutation = trpc.books.create.useMutation({
    onSuccess: (data) => {
      toast.success("Livro criado! Processamento iniciado...");
      setPollingBookId(data.id);
      setBookProgress((prev) => ({ ...prev, [data.id]: 10 }));
      booksQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar livro");
    },
  });

  const createMultiBookMutation = trpc.books.createMulti.useMutation({
    onSuccess: (data) => {
      toast.success(`Livro criado com ${data.videoIds.length} vídeos! Processamento iniciado...`);
      setPollingBookId(data.id);
      setBookProgress((prev) => ({ ...prev, [data.id]: 10 }));
      setSelectedVideos(new Set());
      setMultiVideoTitle("");
      setShowMultiVideoDialog(false);
      booksQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar livro multi-vídeo");
    },
  });

  const exportBookMutation = trpc.books.export.useMutation({
    onSuccess: (data) => {
      toast.success(`Livro exportado em ${data.format.toUpperCase()}!`);
      // Convert base64 to blob and trigger download
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao exportar livro");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const handleCreateBook = (videoId: number) => {
    createBookMutation.mutate({ videoId });
  };

  const handleToggleVideoSelection = (videoId: number) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const handleCreateMultiBook = () => {
    if (selectedVideos.size === 0) {
      toast.error("Selecione pelo menos um vídeo");
      return;
    }
    createMultiBookMutation.mutate({
      videoIds: Array.from(selectedVideos),
      title: multiVideoTitle || undefined,
    });
  };

  const getProgressPercentage = (book: any) => {
    if (book.status === "completed") return 100;
    if (book.status === "failed") return 0;
    if (book.status === "pending") return 10;
    if (book.status === "processing") return bookProgress[book.id] || 50;
    return 0;
  };

  const getProgressLabel = (book: any) => {
    if (book.status === "completed") return "Concluído";
    if (book.status === "failed") return "Falha";
    if (book.status === "pending") return "Pendente";
    if (book.status === "processing") {
      const progress = bookProgress[book.id] || 50;
      return `Processando (${progress}%)`;
    }
    return book.status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Gerenciar seus vídeos e livros</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/", { replace: true })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Vídeo
            </Button>
            {selectedVideos.size > 0 && (
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowMultiVideoDialog(true)}
              >
                <Combine className="w-4 h-4 mr-2" />
                Combinar {selectedVideos.size} Vídeos
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Vídeos */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vídeos</h2>
            {videosQuery.isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : videosQuery.data && videosQuery.data.length > 0 ? (
              <div className="space-y-4">
                {videosQuery.data.map((video) => (
                  <Card key={video.id} className={selectedVideos.has(video.id) ? "border-purple-500 bg-purple-50" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={selectedVideos.has(video.id)}
                            onCheckedChange={() => handleToggleVideoSelection(video.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <CardTitle className="text-lg">{video.filename}</CardTitle>
                            <CardDescription>
                              {(video.fileSize / 1024 / 1024).toFixed(2)}MB •{" "}
                              {formatDistanceToNow(new Date(video.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </CardDescription>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            video.status === "uploaded"
                              ? "bg-blue-100 text-blue-800"
                              : video.status === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {video.status === "uploaded"
                            ? "Enviado"
                            : video.status === "processing"
                              ? "Processando"
                              : "Concluído"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateBook(video.id)}
                          disabled={createBookMutation.isPending}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Gerar Livro
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteVideoMutation.mutate({ id: video.id })}
                          disabled={deleteVideoMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">Nenhum vídeo enviado ainda</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Livros */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Livros Gerados</h2>
            {booksQuery.isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : booksQuery.data && booksQuery.data.length > 0 ? (
              <div className="space-y-4">
                {booksQuery.data.map((book) => (
                  <Card key={book.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{book.title || "Sem título"}</CardTitle>
                          <CardDescription>
                            {book.subtitle || "Sem subtítulo"} •{" "}
                            {formatDistanceToNow(new Date(book.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </CardDescription>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            book.status === "pending"
                              ? "bg-gray-100 text-gray-800"
                              : book.status === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : book.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {getProgressLabel(book)}
                        </span>
                      </div>

                      {/* Barra de progresso */}
                      {book.status === "processing" && (
                        <div className="mt-4">
                          <Progress value={getProgressPercentage(book)} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {getProgressPercentage(book)}% concluído
                          </p>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBook(book.id)}
                          disabled={book.status !== "completed"}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportBookMutation.mutate({ id: book.id, format: "pdf" })}
                          disabled={book.status !== "completed" || exportBookMutation.isPending}
                        >
                          {exportBookMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          {exportBookMutation.isPending ? "Exportando..." : "PDF"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteBookMutation.mutate({ id: book.id })}
                          disabled={deleteBookMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">Nenhum livro gerado ainda</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal de visualização */}
      <Dialog open={selectedBook !== null} onOpenChange={() => setSelectedBook(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {booksQuery.data?.find((b) => b.id === selectedBook)?.title || "Livro"}
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            {booksQuery.data?.find((b) => b.id === selectedBook)?.structuredContent ? (
              <pre className="whitespace-pre-wrap text-sm">
                {booksQuery.data.find((b) => b.id === selectedBook)?.structuredContent}
              </pre>
            ) : (
              <p>Conteúdo não disponível</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para criar livro multi-vídeo */}
      <Dialog open={showMultiVideoDialog} onOpenChange={setShowMultiVideoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Livro com {selectedVideos.size} Vídeos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Livro (opcional)
              </label>
              <input
                type="text"
                value={multiVideoTitle}
                onChange={(e) => setMultiVideoTitle(e.target.value)}
                placeholder="Ex: Curso Completo de Python"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-900">
                Vídeos selecionados: <strong>{selectedVideos.size}</strong>
              </p>
              <p className="text-xs text-blue-800 mt-1">
                Todos os vídeos serão processados sequencialmente e consolidados em um único livro.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMultiVideoDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateMultiBook}
                disabled={createMultiBookMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {createMultiBookMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Combine className="w-4 h-4 mr-2" />
                    Criar Livro
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
