import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Upload, BookOpen, Zap } from "lucide-react";
import { toast } from "sonner";


export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.videos.upload.useMutation({
    onSuccess: () => {
      toast.success("Vídeo enviado com sucesso!");
      setUploadProgress(0);
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      navigate("/dashboard", { replace: true });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer upload do vídeo");
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];

    if (file.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo: 500MB");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato não suportado. Aceitos: MP4, MOV, AVI, WebM");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(Math.min(percentComplete * 0.9, 90));
        }
      };

      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        setUploadProgress(95);

        await uploadMutation.mutateAsync({
          filename: file.name,
          fileData: base64,
          mimeType: file.type,
          fileSize: file.size,
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao processar arquivo");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <BookOpen className="w-10 h-10 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">VideoToBook AI</h1>
              </div>
              <p className="text-xl text-gray-600">Converta seus vídeos em livros estruturados com IA</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <Upload className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle>Upload Simples</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Envie seus vídeos em MP4, MOV, AVI ou WebM com até 500MB</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle>Processamento Automático</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Transcrição e geração de livro estruturado com IA avançada</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle>Exportação Flexível</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Baixe seus livros em PDF, DOCX ou visualize em markdown</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Comece agora</h2>
              <p className="text-gray-600 mb-6">Faça login para começar a converter seus vídeos em livros</p>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                window.location.href = "/login";
              }}
              >
                Fazer Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Converter Vídeo em Livro</h1>
            <p className="text-gray-600">Faça upload de um vídeo e deixe a IA gerar um livro estruturado</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Upload de Vídeo</CardTitle>
              <CardDescription>Formatos suportados: MP4, MOV, AVI, WebM (máximo 500MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                />

                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Clique para selecionar ou arraste um vídeo</h3>
                <p className="text-gray-600">Tamanho máximo: 500MB</p>
              </div>

              {isUploading && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Enviando vídeo...</span>
                    <span className="text-sm font-medium text-gray-700">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {!isUploading && (
                <Button
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate("/dashboard", { replace: true })}
                >
                  Ir para Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
