# Guia de Desenvolvimento

## Estrutura do Projeto

```
conversor-videos-livros/
├── backend/                 # Servidor Node.js + TypeScript
│   ├── src/
│   │   ├── config/         # Configurações (database, gemini)
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── middleware/     # Middlewares (auth, upload)
│   │   ├── routes/         # Definição de rotas
│   │   ├── services/       # Serviços (audioExtractor, transcription, bookGenerator)
│   │   ├── queues/         # Fila de processamento
│   │   ├── types/          # Tipos TypeScript
│   │   └── server.ts       # Entrada da aplicação
│   ├── uploads/            # Diretório de uploads
│   ├── database.sqlite     # Banco de dados (criado automaticamente)
│   ├── .env                # Variáveis de ambiente
│   └── package.json
├── frontend/               # Aplicação React + TypeScript
│   ├── src/
│   │   ├── components/     # Componentes React reutilizáveis
│   │   ├── pages/          # Páginas (Login, Register, Dashboard)
│   │   ├── services/       # Serviço de API
│   │   ├── store/          # Estado global (Zustand)
│   │   ├── types/          # Tipos TypeScript
│   │   ├── App.tsx         # Componente raiz
│   │   ├── main.tsx        # Entrada da aplicação
│   │   └── index.css       # Estilos globais
│   ├── index.html          # HTML principal
│   ├── .env                # Variáveis de ambiente
│   └── package.json
├── README.md               # Documentação principal
├── SETUP.md                # Guia de instalação
└── DEVELOPMENT.md          # Este arquivo
```

## Fluxo de Dados

### Upload de Vídeo
```
Frontend (VideoUpload)
    ↓
API POST /api/videos/upload (multipart/form-data)
    ↓
Backend (videoController.uploadVideo)
    ↓
Salva arquivo no disco
    ↓
Insere registro no banco de dados
    ↓
Adiciona à fila de processamento
    ↓
Retorna resposta ao frontend
```

### Processamento de Vídeo (Background)
```
Fila de Processamento (better-queue)
    ↓
Worker pega vídeo da fila
    ↓
FFmpeg extrai áudio
    ↓
Áudio enviado para Google Gemini AI
    ↓
Gemini retorna transcrição
    ↓
Transcrição salva no banco de dados
    ↓
Status do vídeo atualizado para "concluído"
```

### Criação de Livro
```
Frontend (BookCreator)
    ↓
API POST /api/books (com IDs de transcrições)
    ↓
Backend (bookController.createBook)
    ↓
Livro criado com status "pendente"
    ↓
Inicia geração em background
    ↓
Para cada capítulo:
   - Envia contexto + prompt para Gemini
   - Recebe conteúdo do capítulo
   - Salva no banco de dados
    ↓
Status do livro atualizado para "concluído"
```

## Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter dados do usuário autenticado

### Vídeos
- `POST /api/videos/upload` - Upload de vídeo
- `GET /api/videos` - Listar vídeos do usuário
- `GET /api/videos/:id` - Obter detalhes de um vídeo
- `DELETE /api/videos/:id` - Deletar vídeo

### Livros
- `POST /api/books` - Criar novo livro
- `GET /api/books` - Listar livros do usuário
- `GET /api/books/:id` - Obter detalhes de um livro
- `GET /api/books/stats` - Obter estatísticas
- `DELETE /api/books/:id` - Deletar livro

## Adicionando Novas Features

### 1. Adicionar Novo Endpoint

**Backend:**
1. Criar função no controller (`backend/src/controllers/`)
2. Adicionar rota no arquivo de rotas (`backend/src/routes/`)
3. Adicionar tipos em `backend/src/types/index.ts` se necessário

**Frontend:**
1. Adicionar função no serviço de API (`frontend/src/services/api.ts`)
2. Criar componente ou página (`frontend/src/components/` ou `frontend/src/pages/`)
3. Integrar com o store Zustand se necessário

### 2. Adicionar Nova Tabela no Banco de Dados

1. Editar `backend/src/config/database.ts`
2. Adicionar `CREATE TABLE` na função `initDatabase()`
3. Criar tipos em `backend/src/types/index.ts`

### 3. Integrar Novo Serviço Externo

1. Criar arquivo de configuração em `backend/src/config/`
2. Criar serviço em `backend/src/services/`
3. Usar no controller apropriado

## Variáveis de Ambiente

### Backend (.env)
```
PORT=3000
NODE_ENV=development
JWT_SECRET=seu_secret_aqui
GEMINI_API_KEY=sua_chave_aqui
DATABASE_PATH=./database.sqlite
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=524288000
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3000/api
```

## Scripts Úteis

### Backend
```bash
npm run dev         # Executar em desenvolvimento
npm run build       # Compilar TypeScript
npm run start       # Executar versão compilada
npm run typecheck   # Verificar tipos TypeScript
```

### Frontend
```bash
npm run dev         # Executar em desenvolvimento
npm run build       # Build para produção
npm run preview     # Preview do build
npm run typecheck   # Verificar tipos TypeScript
```

## Debugging

### Backend
- Logs aparecem no console
- Use `console.log()` para debug
- Verifique `database.sqlite` para dados

### Frontend
- Use React DevTools (extensão do navegador)
- Abra Developer Tools (F12)
- Verifique Network tab para requisições
- Verifique Application tab para localStorage

## Testes Manuais

### 1. Testar Registro e Login
1. Abra http://localhost:5173
2. Clique em "Registre-se"
3. Preencha formulário
4. Clique em "Registrar"
5. Faça login com as credenciais

### 2. Testar Upload de Vídeo
1. No dashboard, vá para "Vídeos"
2. Arraste um arquivo de vídeo
3. Aguarde o processamento
4. Verifique o status

### 3. Testar Geração de Livro
1. Aguarde um vídeo ser processado
2. Vá para "Criar Livro"
3. Selecione o vídeo processado
4. Defina título e número de capítulos
5. Clique em "Criar Livro"
6. Aguarde a geração

## Performance

### Otimizações Implementadas
- Fila de processamento sequencial (evita sobrecarga)
- Índices no banco de dados
- Compressão de áudio (128kbps)
- Lazy loading no frontend
- Caching com Zustand

### Possíveis Melhorias
- Implementar paginação na listagem de vídeos/livros
- Cache de transcrições no frontend
- Compressão de imagens
- Minificação de assets
- CDN para assets estáticos

## Segurança

### Implementado
- Hash de senhas com bcrypt
- JWT para autenticação
- Validação de tipos de arquivo
- Limite de tamanho de arquivo
- CORS configurado
- SQL prepared statements

### Recomendações
- Usar HTTPS em produção
- Implementar rate limiting
- Adicionar validação de entrada mais rigorosa
- Implementar logging de auditoria
- Usar secrets manager para credenciais

## Deployment

### Preparação
1. Build backend: `npm run build`
2. Build frontend: `npm run build`
3. Configurar variáveis de ambiente em produção
4. Usar banco de dados persistente (não SQLite)

### Opções de Hosting
- Backend: Heroku, Railway, Render, AWS
- Frontend: Vercel, Netlify, AWS S3 + CloudFront
- Banco de dados: PostgreSQL em RDS, MongoDB Atlas

---

**Última atualização**: 19 de fevereiro de 2026
