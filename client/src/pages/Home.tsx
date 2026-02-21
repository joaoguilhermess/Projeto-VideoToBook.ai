/**
 * Design Philosophy: Brutalismo Digital com Swiss Design
 * - Tipografia forte e hierárquica
 * - Grid modular assimétrico
 * - Bordas grossas e espaçamento generoso
 * - Elementos interativos com feedback visual direto
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileVideo, 
  BookOpen, 
  Database, 
  Cpu, 
  Zap, 
  Code2, 
  GitBranch,
  Server,
  Globe,
  ChevronRight,
  Check
} from "lucide-react";

export default function Home() {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "Visão Geral", icon: Globe },
    { id: "architecture", label: "Arquitetura", icon: GitBranch },
    { id: "features", label: "Funcionalidades", icon: Zap },
    { id: "database", label: "Banco de Dados", icon: Database },
    { id: "api", label: "API", icon: Server },
    { id: "implementation", label: "Implementação", icon: Code2 },
  ];

  const features = [
    { title: "Upload de Vídeos", description: "Sistema de upload robusto com suporte a múltiplos formatos", icon: FileVideo },
    { title: "Extração de Áudio", description: "Processamento automático com FFmpeg", icon: Cpu },
    { title: "Transcrição IA", description: "Identificação de falantes com Google Gemini AI", icon: Zap },
    { title: "Geração de Livros", description: "Criação de capítulos estruturados e coesos", icon: BookOpen },
  ];

  const techStack = {
    backend: ["Node.js", "TypeScript", "Express.js", "SQLite", "FFmpeg", "Google Gemini AI"],
    frontend: ["React", "TypeScript", "TailwindCSS", "React Query", "Axios"],
    tools: ["JWT", "bcrypt", "multer", "better-queue"]
  };

  const apiEndpoints = [
    { method: "POST", path: "/api/auth/register", description: "Criar nova conta" },
    { method: "POST", path: "/api/auth/login", description: "Realizar login" },
    { method: "POST", path: "/api/videos/upload", description: "Upload de vídeo" },
    { method: "GET", path: "/api/videos", description: "Listar vídeos do usuário" },
    { method: "POST", path: "/api/books", description: "Criar novo livro" },
    { method: "GET", path: "/api/books/:id", description: "Obter detalhes do livro" },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-foreground bg-background sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Conversor de Vídeos em Livros</h1>
              <p className="text-sm text-muted-foreground mt-1 font-mono">Documentação Técnica v2.0</p>
            </div>
            <Badge className="brutal-border brutal-shadow bg-accent text-accent-foreground px-4 py-2 text-sm font-mono">
              PROJETO TÉCNICO
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r-4 border-foreground bg-background sticky top-[89px] h-[calc(100vh-89px)] overflow-y-auto">
          <nav className="p-6 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 border-2 ${
                    activeSection === section.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-transparent hover:border-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-12">
          <div className="max-w-4xl">
            {/* Overview Section */}
            <section id="overview" className="mb-24">
              <h2 className="text-5xl font-bold mb-6">Visão Geral do Projeto</h2>
              <div className="brutal-border brutal-shadow bg-card p-8 mb-8">
                <p className="text-lg leading-relaxed mb-6">
                  O <strong>Conversor de Vídeos em Livros</strong> é uma aplicação web que permite aos usuários fazer upload de vídeos, 
                  extrair o áudio, transcrever as falas identificando os participantes, e gerar livros estruturados a partir das transcrições. 
                  O sistema utiliza inteligência artificial (Google Gemini AI) para processar o conteúdo e criar capítulos organizados.
                </p>
                <div className="grid grid-cols-2 gap-6 mt-8">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="border-2 border-foreground p-6">
                        <Icon className="w-8 h-8 mb-3" />
                        <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="brutal-border brutal-shadow bg-muted p-8">
                <h3 className="text-2xl font-bold mb-4">Stack Tecnológico</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase tracking-wide">Backend</h4>
                    <div className="space-y-2">
                      {techStack.backend.map((tech, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-mono">{tech}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase tracking-wide">Frontend</h4>
                    <div className="space-y-2">
                      {techStack.frontend.map((tech, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-mono">{tech}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-3 text-sm uppercase tracking-wide">Ferramentas</h4>
                    <div className="space-y-2">
                      {techStack.tools.map((tech, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-mono">{tech}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Architecture Section */}
            <section id="architecture" className="mb-24">
              <h2 className="text-5xl font-bold mb-6">Arquitetura do Sistema</h2>
              <p className="text-lg mb-8 text-muted-foreground">
                A arquitetura é baseada em um modelo cliente-servidor, com separação clara de responsabilidades entre frontend e backend.
              </p>
              
              <Tabs defaultValue="diagram" className="brutal-border brutal-shadow bg-card">
                <TabsList className="w-full justify-start border-b-4 border-foreground bg-transparent p-0">
                  <TabsTrigger 
                    value="diagram" 
                    className="data-[state=active]:bg-foreground data-[state=active]:text-background border-r-4 border-foreground px-8 py-4 rounded-none"
                  >
                    Diagrama
                  </TabsTrigger>
                  <TabsTrigger 
                    value="components" 
                    className="data-[state=active]:bg-foreground data-[state=active]:text-background border-r-4 border-foreground px-8 py-4 rounded-none"
                  >
                    Componentes
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="diagram" className="p-8">
                  <img 
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663368223448/TJTjZqnnOrrhKbkG.png" 
                    alt="Arquitetura do Sistema" 
                    className="w-full border-2 border-foreground"
                  />
                </TabsContent>
                <TabsContent value="components" className="p-8">
                  <div className="space-y-6">
                    <div className="border-l-4 border-primary pl-6">
                      <h3 className="text-xl font-bold mb-2">Frontend (React)</h3>
                      <p className="text-muted-foreground">Interface do usuário, interação e visualização de dados</p>
                    </div>
                    <div className="border-l-4 border-primary pl-6">
                      <h3 className="text-xl font-bold mb-2">Backend (Node.js)</h3>
                      <p className="text-muted-foreground">Lógica de negócio, API, gerenciamento de dados e processamento em fila</p>
                    </div>
                    <div className="border-l-4 border-primary pl-6">
                      <h3 className="text-xl font-bold mb-2">Banco de Dados (SQLite)</h3>
                      <p className="text-muted-foreground">Armazenamento persistente de dados de usuários, vídeos e livros</p>
                    </div>
                    <div className="border-l-4 border-accent pl-6">
                      <h3 className="text-xl font-bold mb-2">FFmpeg</h3>
                      <p className="text-muted-foreground">Extração de faixas de áudio dos arquivos de vídeo</p>
                    </div>
                    <div className="border-l-4 border-accent pl-6">
                      <h3 className="text-xl font-bold mb-2">Google Gemini AI</h3>
                      <p className="text-muted-foreground">Transcrição de áudio e geração de conteúdo textual (capítulos)</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            {/* Features Section */}
            <section id="features" className="mb-24">
              <h2 className="text-5xl font-bold mb-6">Fluxo de Processamento</h2>
              
              <div className="space-y-8">
                <div className="brutal-border brutal-shadow bg-card p-8">
                  <h3 className="text-2xl font-bold mb-6">Processamento de Vídeo</h3>
                  <img 
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663368223448/XCXuxczMAGbIouaT.png" 
                    alt="Fluxo de Processamento de Vídeo" 
                    className="w-full border-2 border-foreground"
                  />
                </div>

                <div className="brutal-border brutal-shadow bg-card p-8">
                  <h3 className="text-2xl font-bold mb-6">Geração de Livro</h3>
                  <img 
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663368223448/WBSfpNRwLMZEXgDG.png" 
                    alt="Fluxo de Geração de Livro" 
                    className="w-full border-2 border-foreground"
                  />
                </div>
              </div>
            </section>

            {/* Database Section */}
            <section id="database" className="mb-24">
              <h2 className="text-5xl font-bold mb-6">Modelo de Dados</h2>
              <p className="text-lg mb-8 text-muted-foreground">
                O banco de dados SQLite é estruturado com cinco tabelas principais para suportar as funcionalidades da aplicação.
              </p>
              
              <div className="brutal-border brutal-shadow bg-card p-8 mb-8">
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663368223448/aoqpuLooYuPXieyZ.png" 
                  alt="Diagrama Entidade-Relacionamento" 
                  className="w-full border-2 border-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="brutal-border bg-muted p-6">
                  <h3 className="text-xl font-bold mb-3 font-mono">users</h3>
                  <p className="text-sm text-muted-foreground mb-4">Credenciais e informações do usuário</p>
                  <div className="space-y-1 text-sm font-mono">
                    <div>• id (PK)</div>
                    <div>• email (UNIQUE)</div>
                    <div>• password_hash</div>
                    <div>• name</div>
                    <div>• created_at</div>
                  </div>
                </div>

                <div className="brutal-border bg-muted p-6">
                  <h3 className="text-xl font-bold mb-3 font-mono">videos</h3>
                  <p className="text-sm text-muted-foreground mb-4">Metadados e status de processamento</p>
                  <div className="space-y-1 text-sm font-mono">
                    <div>• id (PK)</div>
                    <div>• user_id (FK)</div>
                    <div>• filename</div>
                    <div>• filepath</div>
                    <div>• status</div>
                    <div>• created_at</div>
                  </div>
                </div>

                <div className="brutal-border bg-muted p-6">
                  <h3 className="text-xl font-bold mb-3 font-mono">transcriptions</h3>
                  <p className="text-sm text-muted-foreground mb-4">Conteúdo transcrito dos vídeos</p>
                  <div className="space-y-1 text-sm font-mono">
                    <div>• id (PK)</div>
                    <div>• video_id (FK)</div>
                    <div>• content (JSON)</div>
                    <div>• created_at</div>
                  </div>
                </div>

                <div className="brutal-border bg-muted p-6">
                  <h3 className="text-xl font-bold mb-3 font-mono">books</h3>
                  <p className="text-sm text-muted-foreground mb-4">Informações dos livros gerados</p>
                  <div className="space-y-1 text-sm font-mono">
                    <div>• id (PK)</div>
                    <div>• user_id (FK)</div>
                    <div>• title</div>
                    <div>• status</div>
                    <div>• transcription_ids</div>
                    <div>• created_at</div>
                  </div>
                </div>

                <div className="brutal-border bg-muted p-6">
                  <h3 className="text-xl font-bold mb-3 font-mono">chapters</h3>
                  <p className="text-sm text-muted-foreground mb-4">Conteúdo dos capítulos dos livros</p>
                  <div className="space-y-1 text-sm font-mono">
                    <div>• id (PK)</div>
                    <div>• book_id (FK)</div>
                    <div>• chapter_number</div>
                    <div>• title</div>
                    <div>• content</div>
                  </div>
                </div>
              </div>
            </section>

            {/* API Section */}
            <section id="api" className="mb-24">
              <h2 className="text-5xl font-bold mb-6">Endpoints da API</h2>
              <p className="text-lg mb-8 text-muted-foreground">
                A API RESTful fornece endpoints para autenticação, gerenciamento de vídeos e criação de livros.
              </p>

              <div className="space-y-3">
                {apiEndpoints.map((endpoint, index) => (
                  <div key={index} className="brutal-border bg-card p-6 flex items-center justify-between hover:bg-muted transition-colors duration-150">
                    <div className="flex items-center gap-6">
                      <Badge className={`font-mono font-bold px-3 py-1 ${
                        endpoint.method === "POST" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                      }`}>
                        {endpoint.method}
                      </Badge>
                      <code className="font-mono text-sm">{endpoint.path}</code>
                    </div>
                    <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Implementation Section */}
            <section id="implementation" className="mb-24">
              <h2 className="text-5xl font-bold mb-6">Configuração e Execução</h2>
              
              <div className="brutal-border brutal-shadow bg-card p-8 mb-8">
                <h3 className="text-2xl font-bold mb-4">Pré-requisitos</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3">
                    <ChevronRight className="w-5 h-5" />
                    <span>Node.js (versão 18 ou superior)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ChevronRight className="w-5 h-5" />
                    <span>FFmpeg instalado no sistema</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ChevronRight className="w-5 h-5" />
                    <span>Chave de API do Google Gemini AI</span>
                  </li>
                </ul>
              </div>

              <div className="brutal-border brutal-shadow bg-muted p-8 mb-8">
                <h3 className="text-2xl font-bold mb-4">Backend</h3>
                <pre className="bg-foreground text-background p-6 font-mono text-sm overflow-x-auto">
{`cd backend
npm install
cp .env.example .env
# Editar .env com GEMINI_API_KEY
npm run dev`}
                </pre>
              </div>

              <div className="brutal-border brutal-shadow bg-muted p-8">
                <h3 className="text-2xl font-bold mb-4">Frontend</h3>
                <pre className="bg-foreground text-background p-6 font-mono text-sm overflow-x-auto">
{`cd frontend
npm install
npm run dev`}
                </pre>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t-4 border-foreground pt-12 mt-24">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Conversor de Vídeos em Livros</p>
                  <p className="text-sm text-muted-foreground mt-1">Documentação Técnica v2.0</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Autor: Manus AI</p>
                  <p className="text-sm text-muted-foreground">Data: 19 de fevereiro de 2026</p>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
