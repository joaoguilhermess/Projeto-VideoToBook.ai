import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createBook,
  getUserBooks,
  getBookById,
  updateBook,
  deleteBook,
  getVideoById,
  getBookProcessingJobs,
  createProcessingJob,
  linkVideosToBook,
  getBookVideos,
} from "../db";
import { TRPCError } from "@trpc/server";
import { exportToDOCX, exportToPDF } from "../export";
import { storagePut } from "../storage";
import { processAudioTranscription, processBookGeneration, processMultiVideoBook } from "../processing";
import { notifyOwner } from "../_core/notification";

export const booksRouter = router({
  createMulti: protectedProcedure
    .input(z.object({ videoIds: z.array(z.number()), title: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.videoIds.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "At least one video is required",
          });
        }

        // Verify all videos belong to the user
        for (const videoId of input.videoIds) {
          const video = await getVideoById(videoId, ctx.user.id);
          if (!video) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Video ${videoId} not found`,
            });
          }
        }

        // Create book without videoId
        const book = await createBook({
          userId: ctx.user.id,
          status: "pending",
          title: input.title,
        });

        // Link videos to book
        await linkVideosToBook(book.id, input.videoIds);

        // Start processing asynchronously
        (async () => {
          try {
            const bookVideos = await getBookVideos(book.id);
            let allTranscriptions: string[] = [];

            // Process each video
            for (let i = 0; i < bookVideos.length; i++) {
              const videoBook = bookVideos[i];
              const video = await getVideoById(videoBook.videoId, ctx.user.id);
              if (!video) continue;

              const transcriptionJob = await createProcessingJob({
                bookId: book.id,
                stage: "transcription",
                status: "processing",
              });

              const transcription = await processAudioTranscription(
                video.fileUrl,
                book.id
              );
              allTranscriptions.push(transcription);

              await updateBook(book.id, ctx.user.id, {
                transcription: allTranscriptions.join("\n\n---\n\n"),
              });
            }

            // Generate book from all transcriptions
            const generationJob = await createProcessingJob({
              bookId: book.id,
              stage: "generation",
              status: "pending",
            });

            const consolidatedTranscription = allTranscriptions.join("\n\n---\n\n");
            const generatedBook = await processBookGeneration(consolidatedTranscription, book.id);
            await updateBook(book.id, ctx.user.id, {
              title: generatedBook.title,
              subtitle: generatedBook.subtitle,
              structuredContent: JSON.stringify(generatedBook),
              references: generatedBook.references,
              status: "completed",
            });

            await notifyOwner({
              title: "Livro multi-vídeo gerado com sucesso!",
              content: `O livro foi gerado automaticamente a partir de ${input.videoIds.length} vídeos.`,
            });
          } catch (error) {
            console.error("Multi-video book processing error:", error);
            await notifyOwner({
              title: "Erro ao gerar livro multi-vídeo",
              content: `Falha ao processar ${input.videoIds.length} vídeos: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            });
          }
        })();

        return {
          id: book.id,
          videoIds: input.videoIds,
          status: "pending",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Create multi-video book error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create multi-video book",
        });
      }
    }),

  create: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const video = await getVideoById(input.videoId, ctx.user.id);
        if (!video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }

        const book = await createBook({
          videoId: input.videoId,
          userId: ctx.user.id,
          status: "pending",
        });

        // Start processing asynchronously
        (async () => {
          try {
            // Create processing jobs for each stage
            const transcriptionJob = await createProcessingJob({
              bookId: book.id,
              stage: "transcription",
              status: "pending",
            });

            // Process audio transcription
            const transcription = await processAudioTranscription(
              video.fileUrl,
              book.id
            );

            // Create generation job
            const generationJob = await createProcessingJob({
              bookId: book.id,
              stage: "generation",
              status: "pending",
            });

            // Generate book from transcription
            const generatedBook = await processBookGeneration(transcription, book.id);
            await updateBook(book.id, ctx.user.id, {
              title: generatedBook.title,
              subtitle: generatedBook.subtitle,
              structuredContent: JSON.stringify(generatedBook),
              references: generatedBook.references,
              status: "completed",
            });

            // Notify owner of successful completion
            await notifyOwner({
              title: "Livro gerado com sucesso!",
              content: `O livro foi gerado automaticamente a partir do video "${video.filename}".`,
            });
          } catch (error) {
            console.error("Book processing error:", error);
            // Notify owner of failure
            await notifyOwner({
              title: "Erro ao gerar livro",
              content: `Falha ao processar o video "${video.filename}": ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            });
          }
        })();

        return {
          id: book.id,
          videoId: input.videoId,
          status: "pending",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Create book error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create book",
        });
      }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const books = await getUserBooks(ctx.user.id);
      return books;
    } catch (error) {
      console.error("List books error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch books",
      });
    }
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const book = await getBookById(input.id, ctx.user.id);
        if (!book) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Book not found",
          });
        }
        return book;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Get book error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch book",
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        structuredContent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const book = await getBookById(input.id, ctx.user.id);
        if (!book) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Book not found",
          });
        }

        const updates: Record<string, unknown> = {};
        if (input.title !== undefined) updates.title = input.title;
        if (input.subtitle !== undefined) updates.subtitle = input.subtitle;
        if (input.structuredContent !== undefined)
          updates.structuredContent = input.structuredContent;
        updates.updatedAt = new Date();

        await updateBook(input.id, ctx.user.id, updates);

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Update book error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update book",
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const book = await getBookById(input.id, ctx.user.id);
        if (!book) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Book not found",
          });
        }

        await deleteBook(input.id, ctx.user.id);

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Delete book error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete book",
        });
      }
    }),

  status: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const book = await getBookById(input.id, ctx.user.id);
        if (!book) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Book not found",
          });
        }

        const jobs = await getBookProcessingJobs(input.id);

        return {
          bookStatus: book.status,
          jobs: jobs.map((job) => ({
            stage: job.stage,
            status: job.status,
            progress: job.progress,
            errorMessage: job.errorMessage,
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Get status error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch status",
        });
      }
    }),

  export: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        format: z.enum(["pdf", "docx"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const book = await getBookById(input.id, ctx.user.id);
        if (!book) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Book not found",
          });
        }

        if (!book.structuredContent) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Book content not ready for export",
          });
        }

        let buffer: Buffer;
        const mimeType =
          input.format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        if (input.format === "pdf") {
          buffer = await exportToPDF(
            book.title || "Untitled",
            book.subtitle || "",
            book.structuredContent,
            book.references as string[] | null
          );
        } else {
          buffer = await exportToDOCX(
            book.title || "Untitled",
            book.subtitle || "",
            book.structuredContent
          );
        }

        // Return buffer as base64 instead of URL to avoid Chrome blocking
        const base64 = buffer.toString('base64');
        
        // Also save to S3 for backup
        const fileKey = `exports/${ctx.user.id}/${book.id}-${Date.now()}.${input.format}`;
        await storagePut(fileKey, buffer, mimeType);

        return { 
          data: base64, 
          format: input.format,
          mimeType,
          filename: `${book.title || 'livro'}.${input.format}`
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Export error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export book",
        });
      }
    }),
});
