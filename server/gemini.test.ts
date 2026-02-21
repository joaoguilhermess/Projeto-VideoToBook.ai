import { describe, it, expect } from "vitest";
import { invokeLLM } from "./_core/llm";

describe("Gemini API Integration", () => {
  it("should successfully call Gemini API with valid credentials", async () => {
    // Skip test if API key is not configured
    if (!process.env.GEMINI_API_KEY) {
      console.log("Skipping Gemini API test - GEMINI_API_KEY not configured");
      return;
    }

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Respond with a single sentence confirming you received this message.",
          },
          {
            role: "user",
            content: "Test message to verify API connection",
          },
        ],
      });

      expect(response).toBeDefined();
      expect(response.choices).toBeDefined();
      expect(response.choices.length).toBeGreaterThan(0);
      expect(response.choices[0].message).toBeDefined();
      expect(response.choices[0].message.content).toBeDefined();
      expect(typeof response.choices[0].message.content).toBe("string");
      expect(response.choices[0].message.content.length).toBeGreaterThan(0);

      console.log("✓ Gemini API connection successful");
    } catch (error) {
      console.error("Gemini API test failed:", error);
      throw new Error(
        `Failed to connect to Gemini API. Check your GEMINI_API_KEY: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
});
