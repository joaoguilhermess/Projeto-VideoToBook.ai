/**
 * Video processing utilities
 * Handles audio extraction, transcription, and book generation
 */

import { invokeLLM } from "./_core/llm";
import { updateBook, updateProcessingJob } from "./db";
import { promises as fs } from 'fs';
import { join } from 'path';
import { extractAudioFromVideo, extractAudioFromLocalStorage } from "./ffmpeg";

/**
 * Transcribe audio from video using Gemini Pro
 * Handles both local files and remote URLs
 */
export async function transcribeAudioWithGemini(videoUrl: string): Promise<string> {
  try {
    let audioPath: string;
    let base64Audio: string;
    
    // Check if it's a local file path
    if (videoUrl.startsWith('/.local-storage/')) {
      // Extract audio from local video file
      console.log(`[Processing] Extracting audio from local video: ${videoUrl}`);
      audioPath = await extractAudioFromLocalStorage(videoUrl);
      
      // Read extracted audio file
      const absoluteAudioPath = join(process.cwd(), audioPath.substring(1));
      const audioBuffer = await fs.readFile(absoluteAudioPath);
      base64Audio = audioBuffer.toString('base64');
      console.log(`[Processing] Audio extracted and loaded: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    } else {
      // Download video from URL and extract audio
      console.log(`[Processing] Downloading video from URL: ${videoUrl}`);
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
      }
      
      const videoBuffer = await videoResponse.arrayBuffer();
      console.log(`[Processing] Downloaded video: ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);
      
      // Save video temporarily
      const tempVideoPath = join(process.cwd(), '.temp-video.mp4');
      await fs.writeFile(tempVideoPath, Buffer.from(videoBuffer));
      
      // Extract audio
      audioPath = await extractAudioFromVideo(tempVideoPath);
      
      // Read extracted audio
      const audioBuffer = await fs.readFile(audioPath);
      base64Audio = audioBuffer.toString('base64');
      console.log(`[Processing] Audio extracted: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`);
      
      // Clean up temp video
      try {
        await fs.unlink(tempVideoPath);
      } catch (e) {
        console.warn('[Processing] Failed to delete temp video file');
      }
    }
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a professional transcriber. Your task is to transcribe the audio from the provided audio file into Portuguese text. Provide only the transcription without any additional commentary or formatting.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please transcribe the audio from this audio file into Portuguese:",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:audio/mpeg;base64,${base64Audio}`,
              },
            },
          ],
        },
      ],
    });

    const transcription = response.choices[0]?.message.content as string;

    if (!transcription || transcription.length === 0) {
      throw new Error("Failed to extract transcription from Gemini response");
    }

    return transcription;
  } catch (error) {
    throw new Error(
      `Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate book structure from transcription using Gemini Pro
 */
export async function generateBookStructure(transcription: string): Promise<{
  title: string;
  subtitle: string;
  chapters: Array<{
    number: number;
    title: string;
    content: string;
  }>;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a professional book editor. Your task is to analyze transcribed content and structure it into a well-organized book with chapters. Return a JSON response with title, subtitle, and chapters array.",
        },
        {
          role: "user",
          content: `Please analyze this transcribed content and structure it into a book format. Return ONLY valid JSON (no markdown, no extra text) with this exact structure:
{
  "title": "Book Title",
  "subtitle": "Book Subtitle",
  "chapters": [
    {
      "number": 1,
      "title": "Chapter Title",
      "content": "Chapter content..."
    }
  ]
}

Transcribed content:
${transcription}`,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const content = response.choices[0]?.message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response format from LLM");
    }

    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    throw new Error(
      `Failed to generate book structure: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extract references from transcription using Gemini Pro
 */
export async function extractReferencesFromTranscription(
  transcription: string
): Promise<string[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a research librarian. Your task is to extract bibliographic references from transcribed content and format them according to ABNT (Associação Brasileira de Normas Técnicas) standards. Return ONLY a JSON array of strings with properly formatted references.",
        },
        {
          role: "user",
          content: `Extract all bibliographic references from this transcribed content and format them in ABNT style. Return ONLY a valid JSON array of strings (no markdown, no extra text).

Example ABNT format:
["AUTHOR, A. B. Title of book. Publisher, Year.", "AUTHOR, C. D. Title of article. Journal Name, v. 1, n. 2, p. 1-10, Year."]

Transcribed content:
${transcription}`,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const content = response.choices[0]?.message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response format from LLM");
    }

    // Parse the response - it might be wrapped in an object
    let references: string[] = [];
    try {
      const parsed = JSON.parse(content);
      references = Array.isArray(parsed) ? parsed : parsed.references || [];
    } catch {
      references = [];
    }

    return references;
  } catch (error) {
    console.error("[References] Extraction failed:", error);
    return [];
  }
}

/**
 * Generate book from transcription
 */
export async function generateBook(transcription: string): Promise<{
  title: string;
  subtitle: string;
  chapters: Array<{
    number: number;
    title: string;
    content: string;
  }>;
  references: string[];
}> {
  const bookStructure = await generateBookStructure(transcription);
  const references = await extractReferencesFromTranscription(transcription);

  return {
    ...bookStructure,
    references,
  };
}

/**
 * Process audio transcription from video
 */
export async function processAudioTranscription(
  videoUrl: string,
  bookId: number
): Promise<string> {
  try {
    console.log(`[Processing] Starting transcription for book ${bookId}`);

    const transcription = await transcribeAudioWithGemini(videoUrl);
    console.log(
      `[Processing] Transcription complete: ${transcription.length} characters`
    );


    return transcription;
  } catch (error) {
    console.error("[Processing] Transcription failed:", error);
    throw error;
  }
}

/**
 * Process book generation from transcription
 */
export async function processBookGeneration(
  transcription: string,
  bookId: number
): Promise<{
  title: string;
  subtitle: string;
  chapters: Array<{
    number: number;
    title: string;
    content: string;
  }>;
  references: string[];
}> {
  try {
    console.log(`[Processing] Starting book generation for ${bookId}`);

    const book = await generateBook(transcription);
    console.log(
      `[Processing] Book generated with ${book.chapters.length} chapters and ${book.references.length} references`
    );

    return book;
  } catch (error) {
    console.error("[Processing] Book generation failed:", error);
    throw error;
  }
}

/**
 * Process multi-video book generation
 */
export async function processMultiVideoBook(
  videoUrls: string[],
  bookId: number
): Promise<{
  title: string;
  subtitle: string;
  chapters: Array<{
    number: number;
    title: string;
    content: string;
  }>;
  references: string[];
}> {
  try {
    console.log(
      `[Processing] Starting multi-video book processing for ${bookId} with ${videoUrls.length} videos`
    );

    // Transcribe all videos
    const transcriptions: string[] = [];
    for (let i = 0; i < videoUrls.length; i++) {
      const progress = Math.round((i / videoUrls.length) * 50);


      try {
        const transcription = await transcribeAudioWithGemini(videoUrls[i]);
        transcriptions.push(transcription);
        console.log(
          `[Processing] Video ${i + 1}/${videoUrls.length} transcribed`
        );
      } catch (error) {
        console.error(
          `[Processing] Failed to transcribe video ${i + 1}:`,
          error
        );
        // Continue with other videos
      }
    }

    if (transcriptions.length === 0) {
      throw new Error("Failed to transcribe any videos");
    }

    // Combine transcriptions
    const combinedTranscription = transcriptions.join("\n\n---\n\n");

    // Generate book from combined transcription
    const book = await generateBook(combinedTranscription);

    console.log(
      `[Processing] Multi-video book generated with ${book.chapters.length} chapters`
    );

    return book;
  } catch (error) {
    console.error("[Processing] Multi-video book processing failed:", error);
    throw error;
  }
}
