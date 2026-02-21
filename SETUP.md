# Guia de Instalação e Configuração

## 🚀 Quick Start

Siga os passos abaixo para configurar e executar o projeto localmente.

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd conversor-videos-livros
```

### 2. Instalar FFmpeg

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
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

Verifique a instalação:
```bash
ffmpeg -version
```

### 3. Obter Chave da API Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Clique em "Create API Key"
3. Copie a chave gerada (você usará na próxima etapa)

### 4. Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env

# Editar .env com suas credenciais
# Abra o arquivo .env e adicione:
# - JWT_SECRET: uma string aleatória de pelo menos 32 caracteres
# - GEMINI_API_KEY: a chave que você copiou no passo anterior
```

**Exemplo de .env preenchido:**
```
PORT=3000
NODE_ENV=development
JWT_SECRET=seu_secret_super_seguro_aqui_minimo_32_caracteres_aleatorios
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_PATH=./database.sqlite
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=524288000
CORS_ORIGIN=http://localhost:5173
```

### 5. Configurar Frontend

```bash
cd ../frontend

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env

# O arquivo .env já está pré-configurado, mas você pode editá-lo se necessário
```

### 6. Executar o Projeto

**Opção A: Em Terminais Separados (Recomendado)**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Você verá:
```
🚀 Servidor rodando em http://localhost:3000
📝 Documentação: http://localhost:3000
💚 Health check: http://localhost:3000/health
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Você verá:
```
VITE v5.0.8  ready in 123 ms

➜  Local:   http://localhost:5173/
```

Abra http://localhost:5173 no navegador!

**Opção B: Com um Único Comando**

Na raiz do projeto (se configurado com workspace):
```bash
npm run dev
```

## 📝 Primeiro Acesso

1. Abra http://localhost:5173
2. Clique em "Registre-se"
3. Crie uma conta com email e senha
4. Faça login
5. Você será redirecionado para o dashboard

## 🎬 Primeiro Uso

### Upload de Vídeo
1. No dashboard, vá para a aba "Vídeos"
2. Arraste um vídeo ou clique para selecionar
3. O vídeo será processado automaticamente

### Acompanhar Processamento
1. Na lista de vídeos, você verá o status:
   - **Pendente**: Aguardando processamento
   - **Extraindo Áudio**: FFmpeg está extraindo o áudio
   - **Transcrevendo**: Gemini AI está transcrevendo
   - **Concluído**: Pronto para usar

### Criar um Livro
1. Vá para a aba "Criar Livro"
2. Selecione um título
3. Escolha as transcrições (vídeos processados)
4. Defina o número de capítulos (1-20)
5. Clique em "Criar Livro"
6. Aguarde a geração (pode levar alguns minutos)

### Ler um Livro
1. Vá para a aba "Livros"
2. Quando o livro estiver "Concluído", clique em "Ver Livro"
3. Navegue pelos capítulos
4. Baixe capítulos em TXT se desejar

## 🔧 Troubleshooting

### Erro: "FFmpeg não encontrado"
```bash
# Verifique se FFmpeg está instalado
ffmpeg -version

# Se não estiver, instale conforme descrito acima
```

### Erro: "Gemini API Key inválida"
1. Verifique se a chave está correta em `backend/.env`
2. Acesse https://aistudio.google.com/app/apikey
3. Gere uma nova chave se necessário
4. Reinicie o backend

### Erro: "Conexão recusada"
1. Verifique se o backend está rodando em http://localhost:3000
2. Verifique se o frontend está rodando em http://localhost:5173
3. Verifique o arquivo `frontend/.env` e confirme `VITE_API_BASE_URL`

### Banco de dados corrompido
```bash
cd backend
rm database.sqlite
npm run dev
```

### Porta 3000 ou 5173 já em uso
```bash
# Mude a porta no arquivo de configuração ou use:
# Backend
PORT=3001 npm run dev

# Frontend (edite vite.config.ts)
```

## 📦 Dependências Principais

### Backend
- **Express.js**: Framework web
- **TypeScript**: Tipagem estática
- **SQLite**: Banco de dados
- **Google Generative AI**: Transcrição e geração
- **FFmpeg**: Extração de áudio
- **bcrypt**: Hash de senhas
- **JWT**: Autenticação

### Frontend
- **React**: Interface do usuário
- **TypeScript**: Tipagem estática
- **React Router**: Navegação
- **Axios**: Requisições HTTP
- **Zustand**: Gerenciamento de estado
- **Tailwind CSS**: Estilização

## 🚀 Deployment

Para fazer deploy em produção:

1. **Build Backend:**
```bash
cd backend
npm run build
npm start
```

2. **Build Frontend:**
```bash
cd frontend
npm run build
```

3. Configure variáveis de ambiente em produção
4. Use um servidor web (Nginx, Apache) para servir o frontend
5. Considere usar um serviço de hospedagem (Heroku, Railway, Render, etc.)

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do backend e frontend
2. Consulte a documentação da API em `docs/API.md`
3. Verifique a arquitetura em `docs/ARCHITECTURE.md`
4. Abra uma issue no repositório

---

**Última atualização**: 19 de fevereiro de 2026
