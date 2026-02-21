# Conversor de Vídeos em Livros

Uma aplicação web completa que permite aos usuários fazer upload de vídeos, extrair o áudio, transcrever as falas identificando os participantes, e gerar livros estruturados a partir das transcrições usando inteligência artificial.

## 🚀 Características

- ✅ **Autenticação Local**: Sistema de login e registro com JWT
- ✅ **Upload de Vídeos**: Interface para envio de múltiplos vídeos
- ✅ **Extração de Áudio**: Processamento automático com FFmpeg
- ✅ **Transcrição com IA**: Identificação de falantes com Google Gemini AI
- ✅ **Geração de Livros**: Criação de capítulos estruturados e coesos
- ✅ **Dashboard**: Monitoramento de status de processamento
- ✅ **Fila de Processamento**: Pipeline robusto para processar vídeos sequencialmente

## 📋 Pré-requisitos

- **Node.js** (v18 ou superior)
- **npm** ou **pnpm**
- **FFmpeg** instalado no sistema
- **Chave de API do Google Gemini AI**
- **SQLite** (incluído no projeto)

### Instalação do FFmpeg

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Baixe em https://ffmpeg.org/download.html ou use:
```bash
choco install ffmpeg
```

## 🔧 Configuração

### 1. Obter Chave da API Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Clique em "Create API Key"
3. Copie a chave gerada

### 2. Clonar e Instalar Dependências

```bash
git clone <url-do-repositorio>
cd conversor-videos-livros

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 3. Configurar Variáveis de Ambiente

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` e adicione:
```
PORT=3000
JWT_SECRET=seu_secret_super_seguro_aqui_minimo_32_caracteres
GEMINI_API_KEY=sua_chave_api_gemini_aqui
DATABASE_PATH=./database.sqlite
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=524288000
NODE_ENV=development
```

**Frontend (.env):**
```bash
cd ../frontend
cp .env.example .env
```

Edite o arquivo `.env` e adicione:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

## 🏃 Execução

### Opção 1: Executar em Terminais Separados (Recomendado para Desenvolvimento)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### Opção 2: Executar Ambos com um Comando

```bash
# Na raiz do projeto
npm run dev
```

(Requer script configurado no package.json raiz)

## 📁 Estrutura do Projeto

```
conversor-videos-livros/
├── backend/
│   ├── src/
│   │   ├── config/          # Configurações (database, gemini)
│   │   ├── controllers/      # Controllers (auth, videos, books)
│   │   ├── middleware/       # Middlewares (auth, upload)
│   │   ├── models/           # Modelos de dados
│   │   ├── routes/           # Rotas da API
│   │   ├── services/         # Serviços (audioExtractor, transcription, bookGenerator)
│   │   ├── queues/           # Fila de processamento
│   │   ├── types/            # Tipos TypeScript
│   │   └── server.ts         # Entrada da aplicação
│   ├── uploads/              # Diretório de uploads
│   ├── .env.example          # Exemplo de variáveis de ambiente
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/            # Páginas
│   │   ├── services/         # Serviços (API)
│   │   ├── contexts/         # Contextos React
│   │   ├── types/            # Tipos TypeScript
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🔌 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Criar nova conta
- `POST /api/auth/login` - Realizar login
- `GET /api/auth/me` - Obter dados do usuário autenticado

### Vídeos
- `POST /api/videos/upload` - Fazer upload de vídeo
- `GET /api/videos` - Listar vídeos do usuário
- `GET /api/videos/:id` - Obter detalhes de um vídeo
- `DELETE /api/videos/:id` - Deletar vídeo

### Livros
- `POST /api/books` - Criar novo livro a partir de transcrições
- `GET /api/books` - Listar livros do usuário
- `GET /api/books/:id` - Obter detalhes de um livro (incluindo capítulos)
- `DELETE /api/books/:id` - Deletar livro

## 🗄️ Banco de Dados

O projeto utiliza SQLite com as seguintes tabelas:

- **users**: Dados de usuários
- **videos**: Metadados dos vídeos
- **transcriptions**: Transcrições dos vídeos
- **books**: Informações dos livros
- **chapters**: Capítulos dos livros

O banco de dados é criado automaticamente na primeira execução.

## 🔄 Fluxo de Processamento

### 1. Upload de Vídeo
```
Usuário faz upload → Vídeo salvo localmente → Registrado no BD (status: pendente) → Entra na fila
```

### 2. Processamento de Vídeo
```
Worker pega vídeo da fila → Extrai áudio com FFmpeg → Envia para Gemini AI → Salva transcrição
```

### 3. Geração de Livro
```
Usuário seleciona transcrições → Livro criado (status: pendente) → Gemini gera capítulos → Livro finalizado
```

## 🛠️ Desenvolvimento

### Adicionar Novas Dependências

```bash
# Backend
cd backend
npm install <package-name>

# Frontend
cd ../frontend
npm install <package-name>
```

### Build para Produção

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 📝 Variáveis de Ambiente

### Backend

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| PORT | Porta do servidor | 3000 |
| JWT_SECRET | Secret para JWT (mínimo 32 caracteres) | - |
| GEMINI_API_KEY | Chave da API do Google Gemini | - |
| DATABASE_PATH | Caminho do banco de dados SQLite | ./database.sqlite |
| UPLOAD_PATH | Diretório para uploads | ./uploads |
| MAX_FILE_SIZE | Tamanho máximo de arquivo em bytes | 524288000 (500MB) |
| NODE_ENV | Ambiente (development/production) | development |

### Frontend

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| VITE_API_BASE_URL | URL base da API | http://localhost:3000/api |

## 🐛 Troubleshooting

### FFmpeg não encontrado
```bash
# Verifique se FFmpeg está instalado
ffmpeg -version

# Se não estiver, instale conforme descrito em "Pré-requisitos"
```

### Erro de conexão com API
- Verifique se o backend está rodando em `http://localhost:3000`
- Verifique se a variável `VITE_API_BASE_URL` está correta no frontend

### Erro de autenticação Gemini
- Verifique se a chave da API está correta em `.env`
- Verifique se a chave tem permissões para usar a API Generative AI

### Banco de dados corrompido
```bash
# Remova o banco de dados e deixe ser recriado
cd backend
rm database.sqlite
npm run dev
```

## 📚 Documentação Adicional

Para mais informações sobre a arquitetura e especificações técnicas, consulte:
- `docs/ARCHITECTURE.md` - Arquitetura detalhada
- `docs/API.md` - Documentação completa da API
- `docs/DATABASE.md` - Modelo de dados

## 📄 Licença

MIT

## 👨‍💻 Autor

Manus AI

---

**Última atualização**: 19 de fevereiro de 2026
