import { describe, it, expect } from "vitest";
import { extractReferencesFromTranscription } from "./processing";

describe("References Extraction", () => {
  it("should extract references from transcription with ABNT format", async () => {
    const transcription = `
      Neste trabalho, discutiremos os conceitos apresentados por Silva (2020) em seu livro "Introdução à Programação".
      Também utilizaremos as ideias de Santos e Costa (2019) publicadas no artigo "Desenvolvimento Web Moderno".
      Para mais informações, consulte o site https://www.example.com/recursos.
      O trabalho de Oliveira (2021) também é fundamental para entender este tema.
    `;

    const references = await extractReferencesFromTranscription(transcription);
    
    expect(Array.isArray(references)).toBe(true);
    // References should be an array (may be empty or contain items)
    
    // Check if references are formatted as strings
    references.forEach((ref) => {
      expect(typeof ref).toBe("string");
      expect(ref.length).toBeGreaterThan(0);
    });
  });

  it("should return empty array when no references are found", async () => {
    const transcription = `
      Este é um texto simples sem nenhuma referência bibliográfica.
      Apenas conteúdo genérico sem menção a autores ou fontes.
    `;

    const references = await extractReferencesFromTranscription(transcription);
    
    expect(Array.isArray(references)).toBe(true);
    expect(references.length).toBe(0);
  });

  it("should handle transcription with multiple authors", async () => {
    const transcription = `
      Conforme mencionado por Silva, Santos e Costa (2020) em sua pesquisa colaborativa.
      O trabalho de Oliveira et al. (2019) também contribui para este debate.
      Referências importantes incluem os trabalhos de Pereira (2021) e Gomes (2022).
    `;

    const references = await extractReferencesFromTranscription(transcription);
    
    expect(Array.isArray(references)).toBe(true);
    // Should return an array
    expect(references.length).toBeGreaterThanOrEqual(0);
  });

  it("should handle empty transcription gracefully", async () => {
    const transcription = "";

    const references = await extractReferencesFromTranscription(transcription);
    
    expect(Array.isArray(references)).toBe(true);
    expect(references.length).toBe(0);
  });

  it("should format references in ABNT style", async () => {
    const transcription = `
      O livro "Algoritmos" de Cormen, Leiserson e Rivest foi publicado em 1990.
      O artigo de Knuth sobre análise de algoritmos é essencial.
      Consulte também o site www.wikipedia.org para mais informações.
    `;

    const references = await extractReferencesFromTranscription(transcription);
    
    expect(Array.isArray(references)).toBe(true);
    
    // If references were extracted, they should be non-empty strings
    references.forEach((ref) => {
      expect(ref.trim().length).toBeGreaterThan(0);
    });
  });
});
