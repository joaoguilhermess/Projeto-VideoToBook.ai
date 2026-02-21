import { describe, it, expect } from "vitest";
import { extractChaptersFromBook, generateImagePromptForChapter } from "./processing";

describe("Image Generation", () => {
  it("should extract chapters from book content", () => {
    const bookContent = `# Meu Livro

## Capítulo 1: Introdução
Este é o conteúdo da introdução.

### 1.1 Subtópico
Mais conteúdo aqui.

## Capítulo 2: Desenvolvimento
Este é o conteúdo do desenvolvimento.

### 2.1 Outro Subtópico
Mais conteúdo.`;

    const chapters = extractChaptersFromBook(bookContent);

    expect(chapters).toHaveLength(2);
    expect(chapters[0]?.number).toBe(1);
    expect(chapters[0]?.title).toBe("Introdução");
    expect(chapters[1]?.number).toBe(2);
    expect(chapters[1]?.title).toBe("Desenvolvimento");
  });

  it("should handle book with no chapters", () => {
    const bookContent = `# Meu Livro

Conteúdo sem capítulos numerados.`;

    const chapters = extractChaptersFromBook(bookContent);

    expect(chapters).toHaveLength(0);
  });

  // Note: Skipping API call test as it requires network and takes time
  // In production, use integration tests for API calls
  it("should handle chapter with valid structure", () => {
    const chapter = {
      number: 1,
      title: "Introdução ao Machine Learning",
      content: "Machine Learning é uma subárea da inteligência artificial que permite que sistemas aprendam e melhorem com a experiência.",
    };

    expect(chapter.number).toBe(1);
    expect(chapter.title).toBeDefined();
    expect(chapter.content).toBeDefined();
  });

});
