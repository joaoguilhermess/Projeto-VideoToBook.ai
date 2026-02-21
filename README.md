# VideoToBook AI

Uma plataforma web completa que converte vídeos em livros estruturados automaticamente usando inteligência artificial.

## Visão Geral

VideoToBook AI permite que usuários façam upload de vídeos em múltiplos formatos (MP4, MOV, AVI, WebM) e gera automaticamente livros bem estruturados com:

- Transcrição automática do áudio usando Whisper API
- Geração de estrutura de livro com Gemini Pro
- Visualização e edição do conteúdo gerado
- Exportação em PDF e DOCX
- Dashboard para gerenciar conversões

## Stack Tecnológico

### Backend
- **Node.js + Express** - Servidor web
- **tRPC** - API type-safe
- **MySQL** - Banco de dados
- **Drizzle ORM** - Gerenciamento de banco de dados
- **AWS S3** - Armazenamento de vídeos e arquivos
- **Whisper API** - Transcrição de áudio
- **Gemini Pro** - Geração de conteúdo com IA

### Frontend
- **React 19** - Framework UI
- **TailwindCSS 4** - Estilização
- **shadcn/ui** - Componentes reutilizáveis
- **Wouter** - Roteamento
- **Sonner** - Notificações toast

## Instalação e Setup

### Pré-requisitos
- Node.js 22+
- pnpm 10+
- Conta na Manus (para OAuth e APIs)

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd videotobook-ai
```

2. **Instale as dependências**
```bash
pnpm install
```

3. **Configure as variáveis de ambiente**

O projeto já vem com as seguintes variáveis de ambiente pré-configuradas pelo Manus:
- `DATABASE_URL` - Conexão com MySQL
- `JWT_SECRET` - Chave para sessões
- `VITE_APP_ID` - ID da aplicação OAuth
- `OAUTH_SERVER_URL` - URL do servidor OAuth
- `VITE_OAUTH_PORTAL_URL` - URL do portal de login
- `BUILT_IN_FORGE_API_URL` - URL das APIs internas
- `BUILT_IN_FORGE_API_KEY` - Chave de autenticação das APIs
- `VITE_FRONTEND_FORGE_API_URL` - URL das APIs para o frontend
- `VITE_FRONTEND_FORGE_API_KEY` - Chave de autenticação do frontend

4. **Execute as migrações do banco de dados**
```bash
pnpm db:push
```

5. **Inicie o servidor de desenvolvimento**
```bash
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
videotobook-ai/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas (Home, Dashboard)
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── lib/              # Utilitários (tRPC client)
│   │   └── App.tsx           # Componente raiz
│   └── index.html
├── server/                    # Backend Express + tRPC
│   ├── routers/              # Procedimentos tRPC
│   │   ├── videos.ts         # APIs de vídeo
│   │   └── books.ts          # APIs de livro
│   ├── db.ts                 # Query helpers
│   ├── processing.ts         # Lógica de processamento
│   ├── export.ts             # Exportação PDF/DOCX
│   ├── storage.ts            # Integração S3
│   └── routers.ts            # Router principal
├── drizzle/
│   ├── schema.ts             # Definição de tabelas
│   └── migrations/           # Histórico de migrações
├── shared/                   # Código compartilhado
└── package.json
```

## Funcionalidades Principais

### 1. Upload de Vídeo
- Suporte para MP4, MOV, AVI, WebM
- Limite de 500MB por arquivo
- Validação de formato no frontend e backend
- Armazenamento seguro no S3
- Indicador de progresso em tempo real

### 2. Processamento Automático
- Transcrição de áudio via Whisper API
- Geração de estrutura de livro com Gemini Pro
- Rastreamento de status em tempo real
- Tratamento de erros robusto

### 3. Visualização e Edição
- Visualização formatada de capítulos
- Edição de título e subtítulo
- Preview de markdown
- Modal de visualização completa

### 4. Exportação
- Exportação em PDF com formatação profissional
- Exportação em DOCX para edição posterior
- Armazenamento de arquivos exportados no S3

### 5. Dashboard
- Lista de vídeos enviados
- Lista de livros gerados
- Status de processamento
- Ações de gerenciamento (visualizar, editar, deletar)

## APIs tRPC

### Videos Router

#### `videos.upload`
Faz upload de um vídeo para processamento.

```typescript
trpc.videos.upload.useMutation({
  filename: string;
  fileData: string; // Base64
  mimeType: string;
  fileSize: number;
})
```

#### `videos.list`
Lista todos os vídeos do usuário autenticado.

```typescript
const { data: videos } = trpc.videos.list.useQuery();
```

#### `videos.get`
Obtém detalhes de um vídeo específico.

```typescript
const { data: video } = trpc.videos.get.useQuery({ id: number });
```

#### `videos.delete`
Deleta um vídeo.

```typescript
trpc.videos.delete.useMutation({ id: number })
```

### Books Router

#### `books.create`
Cria um novo livro a partir de um vídeo.

```typescript
trpc.books.create.useMutation({ videoId: number })
```

#### `books.list`
Lista todos os livros do usuário.

```typescript
const { data: books } = trpc.books.list.useQuery();
```

#### `books.get`
Obtém detalhes de um livro.

```typescript
const { data: book } = trpc.books.get.useQuery({ id: number });
```

#### `books.update`
Atualiza o conteúdo de um livro.

```typescript
trpc.books.update.useMutation({
  id: number;
  title?: string;
  subtitle?: string;
  structuredContent?: string;
})
```

#### `books.status`
Obtém o status de processamento de um livro.

```typescript
const { data: status } = trpc.books.status.useQuery({ id: number });
```

#### `books.export`
Exporta um livro em PDF ou DOCX.

```typescript
trpc.books.export.useMutation({
  id: number;
  format: 'pdf' | 'docx';
})
```

#### `books.delete`
Deleta um livro.

```typescript
trpc.books.delete.useMutation({ id: number })
```

## Fluxo de Processamento

1. **Upload** → Usuário faz upload de um vídeo
2. **Armazenamento** → Vídeo é armazenado no S3
3. **Transcrição** → Áudio é transcrito via Whisper API
4. **Geração** → Livro é gerado via Gemini Pro
5. **Armazenamento** → Conteúdo é salvo no banco de dados
6. **Visualização** → Usuário pode visualizar e editar
7. **Exportação** → Usuário pode exportar em PDF/DOCX

## Banco de Dados

### Tabelas Principais

#### `users`
Armazena informações de usuários autenticados.

#### `videos`
Armazena metadados de vídeos enviados.

```sql
CREATE TABLE videos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  fileKey VARCHAR(512) NOT NULL,
  fileUrl TEXT NOT NULL,
  fileSize INT NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  status ENUM('uploaded', 'processing', 'completed', 'failed'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `books`
Armazena livros gerados.

```sql
CREATE TABLE books (
  id INT PRIMARY KEY AUTO_INCREMENT,
  videoId INT NOT NULL,
  userId INT NOT NULL,
  title VARCHAR(255),
  subtitle VARCHAR(255),
  transcription LONGTEXT,
  structuredContent LONGTEXT,
  status ENUM('pending', 'processing', 'completed', 'failed'),
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `processingJobs`
Rastreia o status de cada etapa do processamento.

```sql
CREATE TABLE processingJobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bookId INT NOT NULL,
  stage ENUM('extraction', 'transcription', 'generation', 'export'),
  status ENUM('pending', 'processing', 'completed', 'failed'),
  progress INT DEFAULT 0,
  errorMessage TEXT,
  metadata JSON,
  startedAt TIMESTAMP,
  completedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Testes

Execute os testes unitários com:

```bash
pnpm test
```

Os testes cobrem:
- Validação de entrada de vídeos
- Autenticação e autorização
- Operações CRUD de livros
- Tratamento de erros

## Build para Produção

```bash
pnpm build
pnpm start
```

## Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão MySQL |
| `JWT_SECRET` | Chave para assinar tokens JWT |
| `VITE_APP_ID` | ID da aplicação OAuth |
| `OAUTH_SERVER_URL` | URL do servidor OAuth |
| `BUILT_IN_FORGE_API_URL` | URL das APIs internas |
| `BUILT_IN_FORGE_API_KEY` | Chave de autenticação das APIs |

## Limitações Conhecidas

1. **Processamento Assíncrono** - Atualmente o processamento é síncrono. Para produção, implementar sistema de filas (Bull, RabbitMQ)
2. **Extração de Áudio** - Requer FFmpeg instalado no servidor
3. **Tamanho de Arquivo** - Limite de 500MB por vídeo
4. **Timeout** - Processamento de vídeos muito longos pode exceder timeout

## Próximas Melhorias

- [ ] Sistema de filas para processamento assíncrono
- [ ] Suporte a múltiplos idiomas
- [ ] Temas customizáveis para livros
- [ ] Integração com Google Drive/Dropbox
- [ ] API pública para integração
- [ ] Sistema de créditos/pagamento
- [ ] Geração de capa com IA
- [ ] Histórico de versões de livros

## Suporte e Contribuição

Para reportar bugs ou sugerir melhorias, abra uma issue no repositório.

## Licença

MIT

## Contato

Para dúvidas ou sugestões, entre em contato através do email de suporte.
