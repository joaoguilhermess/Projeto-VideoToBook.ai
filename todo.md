# VideoToBook AI - TODO

## Backend - Database & Schema
- [x] Criar tabela `videos` (id, userId, filename, fileKey, fileUrl, status, uploadedAt)
- [x] Criar tabela `books` (id, videoId, userId, title, subtitle, transcription, structuredContent, status, createdAt, updatedAt)
- [x] Criar tabela `processingJobs` (id, bookId, stage, status, progress, errorMessage, startedAt, completedAt)
- [x] Criar índices para queries otimizadas
- [x] Implementar migrations com Drizzle

## Backend - Core APIs
- [x] POST /api/trpc/videos.upload - Upload de vídeo com validação
- [x] GET /api/trpc/videos.list - Listar vídeos do usuário
- [x] DELETE /api/trpc/videos.delete - Deletar vídeo
- [x] POST /api/trpc/books.create - Criar livro a partir de vídeo
- [x] GET /api/trpc/books.get - Obter detalhes do livro
- [x] GET /api/trpc/books.list - Listar livros do usuário
- [x] PUT /api/trpc/books.update - Atualizar conteúdo do livro
- [x] DELETE /api/trpc/books.delete - Deletar livro
- [x] GET /api/trpc/books.status - Status do processamento
- [x] POST /api/trpc/books.export - Exportar em PDF/DOCX

## Backend - Processing Pipeline
- [x] Integração com Whisper API para transcrição de áudio
- [x] Integração com Gemini Pro para geração de estrutura de livro
- [x] Sistema de filas para processamento assíncrono (async/await)
- [x] Tratamento de erros e notificação
- [x] Notificação ao proprietário (sucesso/falha)
- [ ] Extração de áudio do vídeo (FFmpeg)

## Frontend - Pages & Components
- [x] Página inicial com CTA para upload
- [x] Componente de upload de vídeo com drag-and-drop
- [x] Indicador de progresso de upload
- [x] Dashboard com lista de conversões
- [x] Página de visualização de livro
- [ ] Editor de livro (markdown)
- [ ] Componentes de exportação (PDF, DOCX)
- [ ] Página de detalhes do processamento

## Frontend - Features
- [x] Autenticação e proteção de rotas
- [x] Validação de formato e tamanho de vídeo no frontend
- [ ] Indicadores visuais de progresso (upload, transcrição, geração)
- [x] Visualização formatada de capítulos
- [ ] Edição inline de título/subtítulo
- [ ] Preview de markdown em tempo real
- [ ] Botões de download com feedback visual

## Integrações & Utilitários
- [ ] Configuração de variáveis de ambiente (.env)
- [ ] Integração com S3 para armazenamento de vídeos
- [ ] Integração com Whisper API
- [ ] Integração com Gemini Pro
- [ ] Sistema de notificações ao proprietário
- [ ] Tratamento de CORS e segurança

## Testes & Qualidade
- [x] Testes unitários para procedimentos tRPC
- [ ] Testes de integração para pipeline de processamento
- [x] Validação de segurança (JWT, CORS, validação de entrada)
- [ ] Testes de upload e armazenamento S3

## Documentação & Deploy
- [x] README com instruções de setup
- [x] Documentação de API
- [x] Guia de configuração de variáveis de ambiente
- [x] Instruções de deploy

## Funcionalidades Adicionais - Seleção Múltipla de Vídeos
- [x] Criar tabela de relacionamento videos_books para suportar múltiplos vídeos por livro
- [x] Implementar API de criação de livro com múltiplos vídeos
- [x] Atualizar frontend com interface de seleção múltipla e checkbox
- [x] Implementar processamento sequencial de múltiplos vídeos
- [x] Consolidar transcrições de múltiplos vídeos em um único livro

## Correções Solicitadas
- [x] Implementar download funcional de PDF/DOCX no botão de exportar
- [x] Atualizar prompt do Gemini com regras rigorosas de escrita profissional
- [x] Remover introduções e explicações do processo
- [x] Garantir formatação de livro profissional (sumário, capítulos numerados, etc)
- [x] Melhorar qualidade narrativa e coesão do conteúdo

## Correções Adicionais
- [x] Corrigir bloqueio de download de PDF pelo Chrome (implementar download via blob)

## Debug - Erro de Geração de Arquivo
- [x] Investigar erro na geração de PDF/DOCX
- [x] Corrigir função de exportação

## Melhorias de Prompt
- [x] Atualizar prompt do Gemini com instruções profissionais detalhadas

## Geração de Imagens por Capítulo (Nova Funcionalidade)
- [x] Criar função de extração de capítulos do livro estruturado
- [x] Implementar geração de prompts descritivos para cada capítulo
- [x] Implementar geração de imagens com Gemini Pro (1024x1024 mínimo)
- [x] Armazenar imagens geradas no S3
- [x] Atualizar função de exportação de PDF para incluir imagens
- [x] Integrar geração de imagens ao pipeline de processamento
- [x] Implementar tratamento de erros com logging
- [ ] Testar fluxo completo: vídeo → transcrição → livro → imagens → PDF

## Correções de Geração de Livro
- [x] Remover trechos de página de direitos autorais do prompt do Gemini
- [x] Remover marcadores "[ILUSTRAÇÃO DO CAPÍTULO: ...]" do texto gerado
- [x] Garantir que imagens sejam geradas apenas para capítulos, não sumário

## Melhorias - Geração de Imagens Opcional
- [x] Implementar API para gerar imagens sob demanda após livro estar pronto
- [x] Integrar geração de imagens ao procedimento de export
- [x] Corrigir sobreposição de título em PDFs com duas linhas
- [x] Testar fluxo completo com geração de imagens

## Referências em Formato ABNT
- [x] Implementar função de extração de referências do conteúdo transcrito
- [x] Gerar referências em formato ABNT automaticamente com Gemini
- [x] Integrar referências ao prompt de geração de livro
- [x] Adicionar seção de Referências no final do PDF
- [x] Escrever testes unitários para validar extração
- [x] Testar fluxo completo com referências
