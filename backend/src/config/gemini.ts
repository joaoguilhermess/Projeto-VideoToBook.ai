import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY não está definida nas variáveis de ambiente');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Atualizado para gemini-2.5-flash conforme solicitado pelo usuário
export function getGeminiModel() {
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    systemInstruction: 'Você é um assistente especializado em processamento de texto e geração de conteúdo. Sempre forneça respostas em JSON quando solicitado, sem markdown ou explicações adicionais.'
  });
}

export function getGeminiProModel() {
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    systemInstruction: 'Você é um assistente especializado em processamento de texto e geração de conteúdo. Sempre forneça respostas em JSON quando solicitado, sem markdown ou explicações adicionais.'
  });
}

// Função para testar a conexão com a API
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent('Teste de conexão');
    const response = await result.response;
    console.log('✅ Conexão com Gemini AI estabelecida com sucesso (gemini-2.5-flash)');
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao conectar com Gemini AI:', error.message);
    
    if (error.message.includes('429')) {
      console.error('⚠️  ERRO DE COTA: Você atingiu o limite de requisições da API Gemini.');
      console.error('⚠️  Aguarde alguns minutos ou verifique seu plano no Google AI Studio.');
    }
    
    return false;
  }
}

export { genAI };
