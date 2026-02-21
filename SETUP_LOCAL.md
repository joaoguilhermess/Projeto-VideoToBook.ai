# Setup Local - VideoToBook AI

Guia completo para rodar o projeto localmente na sua máquina.

## Pré-requisitos

- **Node.js** 18+ (recomendado 20+)
- **pnpm** 10+ (gerenciador de pacotes)
- **MySQL** 8.0+ ou **MariaDB** 10.5+
- **Git**

### Instalação de Pré-requisitos

#### macOS
```bash
# Instalar Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node

# Instalar pnpm
npm install -g pnpm

# Instalar MySQL
brew install mysql
brew services start mysql
```

#### Ubuntu/Debian
```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

#### Windows
1. Baixar e instalar [Node.js](https://nodejs.org/) (LTS)
2. Instalar pnpm: `npm install -g pnpm`
3. Baixar e instalar [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

---

## Configuração do Banco de Dados

### 1. Criar banco de dados

```bash
# Conectar ao MySQL
mysql -u root -p

# Executar no MySQL
CREATE DATABASE videotobook_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'videotobook'@'localhost' IDENTIFIED BY 'sua_senha_segura';
GRANT ALL PRIVILEGES ON videotobook_ai.* TO 'videotobook'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Obter a connection string

```
mysql://videotobook:sua_senha_segura@localhost:3306/videotobook_ai
```

---

## Configuração do Projeto

### 1. Clonar o repositório

```bash
git clone <seu-repositorio>
cd videotobook-ai
```

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Criar arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# ===== DATABASE =====
DATABASE_URL=mysql://videotobook:sua_senha_segura@localhost:3306/videotobook_ai

# ===== AUTHENTICATION =====
JWT_SECRET=sua_chave_secreta_com_mais_de_32_caracteres_aleatorios

# ===== GEMINI API =====
GEMINI_API_KEY=sua_chave_de_api_do_gemini

# ===== APP CONFIG =====
VITE_APP_TITLE=VideoToBook AI
VITE_APP_LOGO=/logo.svg
NODE_ENV=development

# ===== OPTIONAL (não necessário para desenvolvimento local) =====
# VITE_APP_ID=seu_app_id
# OAUTH_SERVER_URL=https://api.manus.im
# VITE_OAUTH_PORTAL_URL=https://manus.im/login
# OWNER_NAME=Seu Nome
# OWNER_OPEN_ID=seu_open_id
# BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
# BUILT_IN_FORGE_API_KEY=sua_chave_api
# VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
# VITE_FRONTEND_FORGE_API_KEY=sua_chave_api_frontend
# VITE_ANALYTICS_WEBSITE_ID=seu_website_id
# VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
```

### 4. Gerar chave JWT segura

```bash
# No terminal (macOS/Linux)
openssl rand -base64 32

# No PowerShell (Windows)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 126) }) -join ''))
```

### 5. Obter chave Gemini API

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Clique em "Create API Key"
3. Copie a chave e adicione ao `.env` como `GEMINI_API_KEY`

### 6. Executar migrações do banco de dados

```bash
pnpm db:push
```

Isso criará todas as tabelas necessárias no banco de dados.

---

## Iniciar o Projeto

### Modo Desenvolvimento

```bash
pnpm dev
```

O servidor iniciará em `http://localhost:3000`

### Modo Produção

```bash
# Build
pnpm build

# Start
pnpm start
```

---

## Estrutura de Pastas

```
videotobook-ai/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas (Home, Login, Register, Dashboard)
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── lib/           # Utilitários (tRPC client)
│   │   └── App.tsx        # Roteamento principal
│   └── public/            # Arquivos estáticos
│
├── server/                 # Backend Express + tRPC
│   ├── _core/            # Núcleo (autenticação, OAuth, contexto)
│   ├── routers/          # Procedimentos tRPC
│   ├── db.ts             # Funções de banco de dados
│   └── processing.ts     # Processamento de vídeos/livros
│
├── drizzle/              # Migrações e schema do banco
│   └── schema.ts         # Definição das tabelas
│
├── shared/               # Código compartilhado
│   └── const.ts          # Constantes
│
└── .env                  # Variáveis de ambiente (criar)
```

---

## Fluxo de Autenticação Local

O projeto usa autenticação local com email/senha (sem OAuth do Manus):

### Registro
1. Usuário acessa `/register`
2. Preenche nome, email, senha
3. Senha é hasheada com bcrypt
4. Usuário é criado no banco de dados
5. JWT é gerado e salvo em cookie

### Login
1. Usuário acessa `/login`
2. Preenche email e senha
3. Senha é verificada contra hash no banco
4. JWT é gerado e salvo em cookie
5. Usuário é redirecionado para home

### Logout
1. Cookie de sessão é removido
2. Usuário é redirecionado para `/login`

---

## Comandos Úteis

```bash
# Instalar dependências
pnpm install

# Iniciar desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Iniciar servidor de produção
pnpm start

# Executar testes
pnpm test

# Executar testes com watch
pnpm test:watch

# Migração do banco de dados
pnpm db:push

# Gerar tipos do banco
pnpm db:generate

# Lint do código
pnpm lint

# Format do código
pnpm format
```

---

## Troubleshooting

### Erro: "Cannot find module 'bcrypt'"
```bash
pnpm install bcrypt @types/bcrypt
```

### Erro: "Connection refused" (banco de dados)
- Verificar se MySQL está rodando: `mysql -u root -p`
- Verificar `DATABASE_URL` no `.env`
- Verificar credenciais do banco

### Erro: "GEMINI_API_KEY is not set"
- Obter chave em [Google AI Studio](https://makersuite.google.com/app/apikey)
- Adicionar ao `.env`

### Porta 3000 já em uso
```bash
# Usar porta diferente
PORT=3001 pnpm dev
```

### Limpar cache e reinstalar
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm db:push
```

---

## Próximos Passos

1. ✅ Setup local completo
2. Criar primeira conta em `/register`
3. Fazer login em `/login`
4. Upload de vídeo na home
5. Acompanhar processamento no dashboard
6. Exportar livro em PDF

---

## Suporte

Para dúvidas ou problemas:
1. Verificar logs no terminal
2. Consultar `.manus-logs/` para logs detalhados
3. Verificar variáveis de ambiente em `.env`

---

## Licença

Propriedade privada. Todos os direitos reservados.
