/**
 * Video management procedures
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { createVideo, getUserVideos, getVideoById, deleteVideo } from "../db";
import { TRPCError } from "@trpc/server";

const ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export const videosRouter = router({
  /**
   * Upload a video file
   */
  upload: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        fileData: z.string(), // Base64 encoded
        mimeType: z.string(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate file size
      if (input.fileSize > MAX_FILE_SIZE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File size exceeds 500MB limit",
        });
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid video format. Allowed: MP4, MOV, AVI, WebM",
        });
      }

      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(input.fileData, "base64");

         // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `videos/${ctx.user.id}/${timestamp}-${randomSuffix}-${input.filename}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Create video record in database
        await createVideo({
          userId: ctx.user.id,
          filename: input.filename,
          fileKey,
          fileUrl: url,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          status: "uploaded",
        });

        return {
          filename: input.filename,
          fileUrl: url,
          status: "uploaded",
        };
      } catch (error) {
        console.error("Upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload video",
        });
      }
    }),

  /**
   * List all videos for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const videos = await getUserVideos(ctx.user.id);
      return videos;
    } catch (error) {
      console.error("List videos error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch videos",
      });
    }
  }),

  /**
   * Get a specific video
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const video = await getVideoById(input.id, ctx.user.id);
        if (!video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }
        return video;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Get video error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch video",
        });
      }
    }),

  /**
   * Delete a video
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const video = await getVideoById(input.id, ctx.user.id);
        if (!video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }

        await deleteVideo(input.id, ctx.user.id);

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Delete video error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete video",
        });
      }
    }),
});
