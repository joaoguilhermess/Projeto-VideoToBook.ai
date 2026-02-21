// Carregar variáveis de ambiente PRIMEIRO
import './env.js';

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

// Importar configurações
import { initDatabase, closeDatabase } from './config/database.js';
import { testGeminiConnection } from './config/gemini.js';

// Importar rotas
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import bookRoutes from './routes/books.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middlewares
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/books', bookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'Conversor de Vídeos em Livros API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      videos: '/api/videos',
      books: '/api/books'
    }
  });
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

// Iniciar servidor
async function startServer() {
  try {
    // Inicializar banco de dados
    console.log('📦 Inicializando banco de dados...');
    await initDatabase();

    // Testar conexão com Gemini AI
    console.log('🤖 Testando conexão com Gemini AI...');
    try {
      const geminiConnected = await testGeminiConnection();
      if (!geminiConnected) {
        console.error('⚠️  Verifique se a chave GEMINI_API_KEY está correta');
        console.error('⚠️  Ou se o modelo Gemini está disponível para sua região/conta');
        console.error('⚠️  Verifique se você atingiu o limite de cota no Google AI Studio');
        process.exit(1);
      }
    } catch (error: any) {
      console.error('⚠️  Erro ao testar Gemini AI:', error.message);
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
      console.log(`📝 Documentação: http://localhost:${PORT}`);
      console.log(`💚 Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais de encerramento
process.on('SIGINT', async () => {
  console.log('\n⏹️  Encerrando servidor...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Encerrando servidor...');
  await closeDatabase();
  process.exit(0);
});

// Iniciar
startServer().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
