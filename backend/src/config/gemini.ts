import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY não está definida nas variáveis de ambiente');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Usar gemini-2.0-flash (melhor que 1.5-flash)
// Se não estiver disponível, fallback para gemini-1.5-flash
export function getGeminiModel() {
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    systemInstruction: 'Você é um assistente especializado em processamento de texto e geração de conteúdo. Sempre forneça respostas em JSON quando solicitado, sem markdown ou explicações adicionais.'
  });
}

export function getGeminiProModel() {
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    systemInstruction: 'Você é um assistente especializado em processamento de texto e geração de conteúdo. Sempre forneça respostas em JSON quando solicitado, sem markdown ou explicações adicionais.'
  });
}

// Função para testar a conexão com a API
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent('Teste de conexão');
    const response = await result.response;
    console.log('✅ Conexão com Gemini AI estabelecida com sucesso');
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao conectar com Gemini AI:', error.message);
    
    // Se o modelo 2.0 não estiver disponível, tenta com 1.5
    if (error.message.includes('not found') || error.message.includes('not supported')) {
      console.log('⚠️  Modelo gemini-2.0-flash não disponível, tentando com gemini-1.5-flash...');
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await fallbackModel.generateContent('Teste de conexão');
        await result.response;
        console.log('✅ Conexão com Gemini AI (1.5-flash) estabelecida com sucesso');
        return true;
      } catch (fallbackError: any) {
        console.error('❌ Erro ao conectar com Gemini AI (fallback):', fallbackError.message);
        return false;
      }
    }
    
    return false;
  }
}

export { genAI };
