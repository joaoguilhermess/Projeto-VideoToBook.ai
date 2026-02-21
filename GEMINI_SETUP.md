# Guia de Configuração do Google Gemini AI

## 🔑 Obter Chave da API

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada
5. Adicione ao arquivo `.env` do backend:
   ```
   GEMINI_API_KEY=sua_chave_aqui
   ```

## 🤖 Modelos Disponíveis

### Modelos Recomendados (em ordem de preferência)

1. **gemini-2.0-flash** (Recomendado)
   - Modelo mais recente e rápido
   - Melhor qualidade de resposta
   - Suporta multimodal (texto, imagem, áudio)
   - Disponível em regiões selecionadas

2. **gemini-1.5-flash**
   - Alternativa confiável
   - Bom desempenho
   - Amplamente disponível

3. **gemini-1.5-pro**
   - Modelo mais poderoso
   - Mais lento e caro
   - Use apenas se necessário

## ⚠️ Erros Comuns e Soluções

### Erro: "models/gemini-2.0-flash is not found"

**Causa**: O modelo não está disponível na sua região ou conta.

**Solução**:
1. O código tenta automaticamente usar `gemini-1.5-flash` como fallback
2. Se ainda não funcionar, edite `backend/src/config/gemini.ts` e mude:
   ```typescript
   export function getGeminiModel() {
     return genAI.getGenerativeModel({ 
       model: 'gemini-1.5-flash'  // Mude para este modelo
     });
   }
   ```

### Erro: "API key not valid"

**Causa**: Chave da API inválida ou expirada.

**Solução**:
1. Verifique se a chave foi copiada corretamente (sem espaços)
2. Gere uma nova chave em https://aistudio.google.com/app/apikey
3. Atualize o arquivo `.env`

### Erro: "Permission denied" ou "Quota exceeded"

**Causa**: Limite de requisições atingido ou permissões insuficientes.

**Solução**:
1. Aguarde alguns minutos antes de tentar novamente
2. Verifique seu plano no Google AI Studio
3. Considere usar um modelo mais rápido (flash ao invés de pro)

### Erro: "Resource not found"

**Causa**: Modelo não existe ou foi descontinuado.

**Solução**:
1. Verifique a lista de modelos disponíveis em https://aistudio.google.com/app/apikey
2. Use um modelo que está listado como disponível
3. Atualize a biblioteca `@google/generative-ai`:
   ```bash
   npm install --save @google/generative-ai@latest
   ```

## 🔄 Fallback Automático

O código implementa fallback automático:

```typescript
// Tenta primeiro com gemini-2.0-flash
// Se falhar, tenta com gemini-1.5-flash
// Se ambos falharem, exibe erro
```

## 📊 Limites de Taxa (Rate Limits)

- **Requisições por minuto**: 60 (free tier)
- **Tokens por minuto**: 4.000 (free tier)
- **Requisições por dia**: 1.500 (free tier)

Para aumentar esses limites, considere fazer upgrade para um plano pago.

## 🧪 Testar a Conexão

O servidor testa automaticamente a conexão ao iniciar:

```bash
npm run dev
```

Se ver `✅ Conexão com Gemini AI estabelecida com sucesso`, está funcionando!

## 💡 Dicas de Otimização

### 1. Usar Flash para Tarefas Simples
```typescript
// Para transcrição e geração rápida
getGeminiModel() // usa gemini-2.0-flash
```

### 2. Usar Pro para Tarefas Complexas
```typescript
// Para análise profunda
getGeminiProModel() // usa gemini-1.5-pro
```

### 3. Implementar Cache
```typescript
// Cachear respostas para evitar requisições duplicadas
const cache = new Map();
if (cache.has(key)) {
  return cache.get(key);
}
```

### 4. Batch Requests
```typescript
// Agrupar múltiplas requisições
const results = await Promise.all([
  model.generateContent(prompt1),
  model.generateContent(prompt2),
  model.generateContent(prompt3)
]);
```

## 🔐 Segurança

### ✅ Fazer
- Manter a chave no arquivo `.env`
- Usar `.gitignore` para não commitar `.env`
- Regenerar chave se comprometida
- Usar variáveis de ambiente em produção

### ❌ Não Fazer
- Commitar a chave no Git
- Compartilhar a chave
- Usar a mesma chave em múltiplos projetos
- Expor a chave no frontend

## 📚 Recursos Adicionais

- [Google AI Studio](https://aistudio.google.com)
- [Documentação Oficial](https://ai.google.dev/docs)
- [Modelos Disponíveis](https://ai.google.dev/models)
- [Guia de Segurança](https://ai.google.dev/docs/safety_guidelines)

## 🆘 Suporte

Se continuar com problemas:

1. Verifique se a chave está correta
2. Tente usar `gemini-1.5-flash` explicitamente
3. Verifique a disponibilidade em sua região
4. Consulte a documentação oficial do Google AI
5. Abra uma issue no repositório

---

**Última atualização**: 19 de fevereiro de 2026
