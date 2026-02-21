import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, longtext } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Email único para login local */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Hash da senha (bcrypt) */
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: text("name"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tipo para criar usuário (sem ID)
 */
export type CreateUserInput = {
  email: string;
  passwordHash: string;
  name?: string;
};

/**
 * Videos table - stores metadata about uploaded videos
 */
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 key
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileSize: int("fileSize").notNull(), // Size in bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["uploaded", "processing", "completed", "failed"]).default("uploaded").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Books table - stores generated books with their content
 */
export const books = mysqlTable("books", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId"), // Deprecated: kept for backward compatibility, use videosBooks for multiple videos
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  subtitle: varchar("subtitle", { length: 255 }),
  transcription: longtext("transcription"), // Full audio transcription
  structuredContent: longtext("structuredContent"), // Full book content in markdown
  references: json("references"), // Array of references in ABNT format
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"), // Error details if processing failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;

/**
 * VideosBooks junction table - allows multiple videos per book
 */
export const videosBooks = mysqlTable("videosBooks", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  bookId: int("bookId").notNull(),
  order: int("order").default(0), // Order of videos in the book
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoBook = typeof videosBooks.$inferSelect;
export type InsertVideoBook = typeof videosBooks.$inferInsert;

/**
 * Processing jobs table - tracks the processing pipeline stages
 */
export const processingJobs = mysqlTable("processingJobs", {
  id: int("id").autoincrement().primaryKey(),
  bookId: int("bookId").notNull(),
  stage: mysqlEnum("stage", ["extraction", "transcription", "generation", "export"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  progress: int("progress").default(0), // 0-100
  errorMessage: text("errorMessage"),
  metadata: json("metadata"), // Additional stage-specific data
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertProcessingJob = typeof processingJobs.$inferInsert;

/**
 * Relations for type safety
 */
export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  books: many(books),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  user: one(users, { fields: [videos.userId], references: [users.id] }),
  books: many(books),
  videosBooks: many(videosBooks),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  user: one(users, { fields: [books.userId], references: [users.id] }),
  video: one(videos, { fields: [books.videoId], references: [videos.id] }),
  videosBooks: many(videosBooks),
  processingJobs: many(processingJobs),
}));

export const videosBookRelations = relations(videosBooks, ({ one }) => ({
  video: one(videos, { fields: [videosBooks.videoId], references: [videos.id] }),
  book: one(books, { fields: [videosBooks.bookId], references: [books.id] }),
}));

export const processingJobsRelations = relations(processingJobs, ({ one }) => ({
  book: one(books, { fields: [processingJobs.bookId], references: [books.id] }),
}));
