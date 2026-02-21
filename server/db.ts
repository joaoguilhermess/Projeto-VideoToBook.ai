import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, videos, books, processingJobs, InsertVideo, InsertBook, InsertProcessingJob } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  if (!user.email || !user.passwordHash) {
    throw new Error("Email and password hash are required");
  }

  const result = await db.insert(users).values(user);
  const created = await getUserByEmail(user.email);
  return created;
}

export async function updateUser(userId: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set(updates).where(eq(users.id, userId));
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all videos for a user
 */
export async function getUserVideos(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt));
  return result;
}

/**
 * Get video by ID with ownership check
 */
export async function getVideoById(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(videos).where(and(eq(videos.id, videoId), eq(videos.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new video record
 */
export async function createVideo(video: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videos).values(video);
  return result;
}

/**
 * Delete a video
 */
export async function deleteVideo(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(videos).where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
}

/**
 * Get all books for a user
 */
export async function getUserBooks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(books).where(eq(books.userId, userId)).orderBy(desc(books.createdAt));
  return result;
}

/**
 * Get book by ID with ownership check
 */
export async function getBookById(bookId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(books).where(and(eq(books.id, bookId), eq(books.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new book record
 */
export async function createBook(book: InsertBook) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(books).values(book);
  
  // Fetch the created book
  const created = await db.select().from(books).where(eq(books.userId, book.userId)).orderBy(desc(books.createdAt)).limit(1);
  return created[0];
}

/**
 * Update book content
 */
export async function updateBook(bookId: number, userId: number, updates: Partial<InsertBook>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(books).set(updates).where(and(eq(books.id, bookId), eq(books.userId, userId)));
}

/**
 * Delete a book
 */
export async function deleteBook(bookId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(books).where(and(eq(books.id, bookId), eq(books.userId, userId)));
}

/**
 * Get processing jobs for a book
 */
export async function getBookProcessingJobs(bookId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(processingJobs).where(eq(processingJobs.bookId, bookId)).orderBy(processingJobs.createdAt);
  return result;
}

/**
 * Create a processing job
 */
export async function createProcessingJob(job: InsertProcessingJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(processingJobs).values(job);
  
  // Fetch the created job
  const created = await db.select().from(processingJobs).where(eq(processingJobs.bookId, job.bookId)).orderBy(desc(processingJobs.createdAt)).limit(1);
  return created[0];
}

/**
 * Update processing job status
 */
export async function updateProcessingJob(jobId: number, updates: Partial<InsertProcessingJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(processingJobs).set(updates).where(eq(processingJobs.id, jobId));
}


/**
 * Link videos to a book
 */
export async function linkVideosToBook(bookId: number, videoIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const videosBooks = await import("../drizzle/schema").then(m => m.videosBooks);
  
  // Insert videos in order
  for (let i = 0; i < videoIds.length; i++) {
    await db.insert(videosBooks).values({
      videoId: videoIds[i],
      bookId,
      order: i,
    });
  }
}

/**
 * Get all videos for a book
 */
export async function getBookVideos(bookId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const videosBooks = await import("../drizzle/schema").then(m => m.videosBooks);
  const { eq } = await import("drizzle-orm").then(m => ({ eq: m.eq }));
  
  const result = await db
    .select()
    .from(videosBooks)
    .where(eq(videosBooks.bookId, bookId))
    .orderBy(videosBooks.order);
  
  return result;
}
