import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env do diretório raiz do backend
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Validar variáveis de ambiente obrigatórias
const requiredEnvVars = ['GEMINI_API_KEY', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Variável de ambiente ${envVar} não está definida`);
  }
}

console.log('✅ Variáveis de ambiente carregadas');
