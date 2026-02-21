var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  books: () => books,
  booksRelations: () => booksRelations,
  processingJobs: () => processingJobs,
  processingJobsRelations: () => processingJobsRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  videos: () => videos,
  videosBookRelations: () => videosBookRelations,
  videosBooks: () => videosBooks,
  videosRelations: () => videosRelations
});
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, longtext } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
var users, videos, books, videosBooks, processingJobs, usersRelations, videosRelations, booksRelations, videosBookRelations, processingJobsRelations;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
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
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    videos = mysqlTable("videos", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      filename: varchar("filename", { length: 255 }).notNull(),
      fileKey: varchar("fileKey", { length: 512 }).notNull(),
      // S3 key
      fileUrl: text("fileUrl").notNull(),
      // S3 URL
      fileSize: int("fileSize").notNull(),
      // Size in bytes
      mimeType: varchar("mimeType", { length: 100 }).notNull(),
      status: mysqlEnum("status", ["uploaded", "processing", "completed", "failed"]).default("uploaded").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    books = mysqlTable("books", {
      id: int("id").autoincrement().primaryKey(),
      videoId: int("videoId"),
      // Deprecated: kept for backward compatibility, use videosBooks for multiple videos
      userId: int("userId").notNull(),
      title: varchar("title", { length: 255 }),
      subtitle: varchar("subtitle", { length: 255 }),
      transcription: longtext("transcription"),
      // Full audio transcription
      structuredContent: longtext("structuredContent"),
      // Full book content in markdown
      references: json("references"),
      // Array of references in ABNT format
      status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
      errorMessage: text("errorMessage"),
      // Error details if processing failed
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    videosBooks = mysqlTable("videosBooks", {
      id: int("id").autoincrement().primaryKey(),
      videoId: int("videoId").notNull(),
      bookId: int("bookId").notNull(),
      order: int("order").default(0),
      // Order of videos in the book
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    processingJobs = mysqlTable("processingJobs", {
      id: int("id").autoincrement().primaryKey(),
      bookId: int("bookId").notNull(),
      stage: mysqlEnum("stage", ["extraction", "transcription", "generation", "export"]).notNull(),
      status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
      progress: int("progress").default(0),
      // 0-100
      errorMessage: text("errorMessage"),
      metadata: json("metadata"),
      // Additional stage-specific data
      startedAt: timestamp("startedAt"),
      completedAt: timestamp("completedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    usersRelations = relations(users, ({ many }) => ({
      videos: many(videos),
      books: many(books)
    }));
    videosRelations = relations(videos, ({ one, many }) => ({
      user: one(users, { fields: [videos.userId], references: [users.id] }),
      books: many(books),
      videosBooks: many(videosBooks)
    }));
    booksRelations = relations(books, ({ one, many }) => ({
      user: one(users, { fields: [books.userId], references: [users.id] }),
      video: one(videos, { fields: [books.videoId], references: [videos.id] }),
      videosBooks: many(videosBooks),
      processingJobs: many(processingJobs)
    }));
    videosBookRelations = relations(videosBooks, ({ one }) => ({
      video: one(videos, { fields: [videosBooks.videoId], references: [videos.id] }),
      book: one(books, { fields: [videosBooks.bookId], references: [books.id] })
    }));
    processingJobsRelations = relations(processingJobs, ({ one }) => ({
      book: one(books, { fields: [processingJobs.bookId], references: [books.id] })
    }));
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
init_schema();
import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
var _db = null;
async function getDb() {
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
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createUser(user) {
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
async function updateUser(userId, updates) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.update(users).set(updates).where(eq(users.id, userId));
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(userId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserVideos(userId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt));
  return result;
}
async function getVideoById(videoId, userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(videos).where(and(eq(videos.id, videoId), eq(videos.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createVideo(video) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(videos).values(video);
  return result;
}
async function deleteVideo(videoId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(videos).where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
}
async function getUserBooks(userId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(books).where(eq(books.userId, userId)).orderBy(desc(books.createdAt));
  return result;
}
async function getBookById(bookId, userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(books).where(and(eq(books.id, bookId), eq(books.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createBook(book) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(books).values(book);
  const created = await db.select().from(books).where(eq(books.userId, book.userId)).orderBy(desc(books.createdAt)).limit(1);
  return created[0];
}
async function updateBook(bookId, userId, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(books).set(updates).where(and(eq(books.id, bookId), eq(books.userId, userId)));
}
async function deleteBook(bookId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(books).where(and(eq(books.id, bookId), eq(books.userId, userId)));
}
async function getBookProcessingJobs(bookId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(processingJobs).where(eq(processingJobs.bookId, bookId)).orderBy(processingJobs.createdAt);
  return result;
}
async function createProcessingJob(job) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(processingJobs).values(job);
  const created = await db.select().from(processingJobs).where(eq(processingJobs.bookId, job.bookId)).orderBy(desc(processingJobs.createdAt)).limit(1);
  return created[0];
}
async function updateProcessingJob(jobId, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(processingJobs).set(updates).where(eq(processingJobs.id, jobId));
}
async function linkVideosToBook(bookId, videoIds) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const videosBooks2 = await Promise.resolve().then(() => (init_schema(), schema_exports)).then((m) => m.videosBooks);
  for (let i = 0; i < videoIds.length; i++) {
    await db.insert(videosBooks2).values({
      videoId: videoIds[i],
      bookId,
      order: i
    });
  }
}
async function getBookVideos(bookId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const videosBooks2 = await Promise.resolve().then(() => (init_schema(), schema_exports)).then((m) => m.videosBooks);
  const { eq: eq2 } = await import("drizzle-orm").then((m) => ({ eq: m.eq }));
  const result = await db.select().from(videosBooks2).where(eq2(videosBooks2.bookId, bookId)).orderBy(videosBooks2.order);
  return result;
}

// server/_core/cookies.ts
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1"]);
function isIpAddress(host) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const hostname = req.hostname;
  const isLocalhost = LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);
  const isSecure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // Em localhost (desenvolvimento), use 'lax'. Em produção (HTTPS), use 'none'
    sameSite: isLocalhost ? "lax" : "none",
    // Em localhost, secure pode ser false. Em produção, deve ser true
    secure: isSecure
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import { SignJWT, jwtVerify } from "jose";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/sdk.ts
import bcrypt from "bcrypt";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var LocalAuthService = class {
  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }
  /**
   * Compare a password with its hash
   */
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
  /**
   * Create a session token for a user
   */
  async createSessionToken(userId, email, options = {}) {
    return this.signSession(
      {
        userId,
        email
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      userId: payload.userId,
      email: payload.email
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { userId, email } = payload;
      if (typeof userId !== "number" || !isNonEmptyString(email)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        userId,
        email
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.split("=");
        if (key && value) {
          acc.set(key.trim(), decodeURIComponent(value.trim()));
        }
        return acc;
      },
      /* @__PURE__ */ new Map()
    );
    return parsed;
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const user = await getUserById(session.userId);
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await updateUser(user.id, {
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    return user;
  }
};
var sdk = new LocalAuthService();

// server/_core/oauth.ts
import { z } from "zod";
function getJsonBody(req) {
  return req.body;
}
var LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
var RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});
function registerOAuthRoutes(app) {
  app.post("/api/auth/login", async (req, res) => {
    try {
      const body = getJsonBody(req);
      const { email, password } = LoginSchema.parse(body);
      const user = await getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      const isPasswordValid = await sdk.verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      const sessionToken = await sdk.createSessionToken(user.id, user.email, {
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request", details: error.issues });
        return;
      }
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app.post("/api/auth/register", async (req, res) => {
    try {
      const body = getJsonBody(req);
      const { email, password, name } = RegisterSchema.parse(body);
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }
      const passwordHash = await sdk.hashPassword(password);
      const user = await createUser({
        email,
        passwordHash,
        name: name || null
      });
      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }
      const sessionToken = await sdk.createSessionToken(user.id, user.email, {
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request", details: error.issues });
        return;
      }
      console.error("[Auth] Registration failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z as z2 } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z2.object({
      timestamp: z2.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z2.object({
      title: z2.string().min(1, "title is required"),
      content: z2.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/videos.ts
import { z as z3 } from "zod";

// server/storage.ts
import { promises as fs } from "fs";
import { join } from "path";
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    return null;
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function uploadToManus(relKey, data, contentType, config) {
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(config.baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(config.apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}
var STORAGE_DIR = join(process.cwd(), ".local-storage");
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error("[Storage] Failed to create storage directory:", error);
  }
}
async function uploadToLocal(relKey, data, contentType) {
  await ensureStorageDir();
  const key = normalizeKey(relKey);
  const filePath = join(STORAGE_DIR, key);
  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  await fs.mkdir(dir, { recursive: true });
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  await fs.writeFile(filePath, buffer);
  const url = `/.local-storage/${key}`;
  console.log(`[Storage] File saved locally: ${url}`);
  return { key, url };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const config = getStorageConfig();
  if (config) {
    return uploadToManus(relKey, data, contentType, config);
  } else {
    console.log("[Storage] Using local filesystem storage (Manus credentials not configured)");
    return uploadToLocal(relKey, data, contentType);
  }
}

// server/routers/videos.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
var ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
var MAX_FILE_SIZE = 500 * 1024 * 1024;
var videosRouter = router({
  /**
   * Upload a video file
   */
  upload: protectedProcedure.input(
    z3.object({
      filename: z3.string().min(1),
      fileData: z3.string(),
      // Base64 encoded
      mimeType: z3.string(),
      fileSize: z3.number()
    })
  ).mutation(async ({ ctx, input }) => {
    if (input.fileSize > MAX_FILE_SIZE) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: "File size exceeds 500MB limit"
      });
    }
    if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: "Invalid video format. Allowed: MP4, MOV, AVI, WebM"
      });
    }
    try {
      const buffer = Buffer.from(input.fileData, "base64");
      const timestamp2 = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `videos/${ctx.user.id}/${timestamp2}-${randomSuffix}-${input.filename}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      await createVideo({
        userId: ctx.user.id,
        filename: input.filename,
        fileKey,
        fileUrl: url,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        status: "uploaded"
      });
      return {
        filename: input.filename,
        fileUrl: url,
        status: "uploaded"
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload video"
      });
    }
  }),
  /**
   * List all videos for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const videos2 = await getUserVideos(ctx.user.id);
      return videos2;
    } catch (error) {
      console.error("List videos error:", error);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch videos"
      });
    }
  }),
  /**
   * Get a specific video
   */
  get: protectedProcedure.input(z3.object({ id: z3.number() })).query(async ({ ctx, input }) => {
    try {
      const video = await getVideoById(input.id, ctx.user.id);
      if (!video) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Video not found"
        });
      }
      return video;
    } catch (error) {
      if (error instanceof TRPCError3) throw error;
      console.error("Get video error:", error);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch video"
      });
    }
  }),
  /**
   * Delete a video
   */
  delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ ctx, input }) => {
    try {
      const video = await getVideoById(input.id, ctx.user.id);
      if (!video) {
        throw new TRPCError3({
          code: "NOT_FOUND",
          message: "Video not found"
        });
      }
      await deleteVideo(input.id, ctx.user.id);
      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError3) throw error;
      console.error("Delete video error:", error);
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete video"
      });
    }
  })
});

// server/routers/books.ts
import { z as z4 } from "zod";
import { TRPCError as TRPCError4 } from "@trpc/server";

// server/export.ts
import { Document, Packer, Paragraph, HeadingLevel, convertInchesToTwip } from "docx";
import { PDFDocument, rgb } from "pdf-lib";
import fetch2 from "node-fetch";
function parseMarkdownStructure(markdown) {
  const lines = markdown.split("\n");
  const sections = [];
  let currentSection = { level: 0, text: "", content: "" };
  let title = "";
  let subtitle = "";
  for (const line of lines) {
    const headingMatch = line.match(/^(#+)\s+(.+)$/);
    if (headingMatch) {
      if (currentSection.text) {
        sections.push(currentSection);
      }
      const level = headingMatch[1].length;
      const text2 = headingMatch[2];
      if (level === 1) {
        title = text2;
      } else if (level === 2 && !subtitle && title) {
        subtitle = text2;
      }
      currentSection = { level, text: text2, content: "" };
    } else if (currentSection.text || title) {
      currentSection.content += line + "\n";
    }
  }
  if (currentSection.text) {
    sections.push(currentSection);
  }
  return { title, subtitle, sections };
}
async function fetchImageAsBytes(imageUrl) {
  try {
    const response = await fetch2(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.statusText}`);
      return null;
    }
    const buffer = await response.buffer();
    return new Uint8Array(buffer);
  } catch (error) {
    console.error(`Error fetching image: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
async function exportToDOCX(title, subtitle, content) {
  const { sections } = parseMarkdownStructure(content);
  const paragraphs = [];
  paragraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    })
  );
  if (subtitle) {
    paragraphs.push(
      new Paragraph({
        text: subtitle,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 400 }
      })
    );
  }
  for (const section of sections) {
    const headingLevel = section.level === 2 ? HeadingLevel.HEADING_2 : section.level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4;
    paragraphs.push(
      new Paragraph({
        text: section.text,
        heading: headingLevel,
        spacing: { before: 200, after: 100 }
      })
    );
    const contentLines = section.content.split("\n").filter((line) => line.trim());
    for (const contentLine of contentLines) {
      paragraphs.push(
        new Paragraph({
          text: contentLine,
          spacing: { line: 360, after: 100 }
        })
      );
    }
  }
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1)
            }
          }
        },
        children: paragraphs
      }
    ]
  });
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
async function exportToPDF(title, subtitle, content, chapterImages, references) {
  const pdfDoc = await PDFDocument.create();
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  const contentWidth = pageWidth - 2 * margin;
  const { sections } = parseMarkdownStructure(content);
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  const lineHeight = 14;
  const maxLinesPerPage = Math.floor((pageHeight - 2 * margin) / lineHeight);
  let linesOnCurrentPage = 0;
  const addText = (text2, fontSize, isBold = false) => {
    if (linesOnCurrentPage >= maxLinesPerPage - 2) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
      linesOnCurrentPage = 0;
    }
    const words = text2.split(" ");
    let line = "";
    const avgCharWidth = fontSize * 0.5;
    const maxCharsPerLine = Math.floor(contentWidth / avgCharWidth);
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (testLine.length > maxCharsPerLine && line) {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0)
        });
        yPosition -= lineHeight;
        linesOnCurrentPage++;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0)
      });
      yPosition -= lineHeight;
      linesOnCurrentPage++;
    }
  };
  const addImage = async (imageUrl, maxWidth = 300, maxHeight = 300) => {
    try {
      const imageBytes = await fetchImageAsBytes(imageUrl);
      if (!imageBytes) {
        console.warn(`Failed to add image from URL: ${imageUrl}`);
        return;
      }
      if (yPosition - maxHeight < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
        linesOnCurrentPage = 0;
      }
      let image;
      if (imageUrl.toLowerCase().endsWith(".png")) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }
      const { width, height } = image.scale(1);
      let displayWidth = width;
      let displayHeight = height;
      if (displayWidth > maxWidth) {
        displayHeight = displayHeight * maxWidth / displayWidth;
        displayWidth = maxWidth;
      }
      if (displayHeight > maxHeight) {
        displayWidth = displayWidth * maxHeight / displayHeight;
        displayHeight = maxHeight;
      }
      const imageX = margin + (contentWidth - displayWidth) / 2;
      page.drawImage(image, {
        x: imageX,
        y: yPosition - displayHeight,
        width: displayWidth,
        height: displayHeight
      });
      yPosition -= displayHeight + 20;
      linesOnCurrentPage += Math.ceil((displayHeight + 20) / lineHeight);
    } catch (error) {
      console.error(`Error adding image: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  addText(title, 24, true);
  yPosition -= 20;
  linesOnCurrentPage += 2;
  if (subtitle) {
    addText(subtitle, 14);
    yPosition -= 30;
    linesOnCurrentPage += 3;
  }
  for (const section of sections) {
    const chapterMatch = section.text.match(/Capítulo\s+\d+:\s*(.+)/i);
    const chapterTitle = chapterMatch ? chapterMatch[1].trim() : section.text;
    const headingSize = section.level === 2 ? 16 : section.level === 3 ? 14 : 12;
    addText(section.text, headingSize, true);
    yPosition -= 8;
    linesOnCurrentPage += 1;
    if (chapterImages && chapterImages.has(chapterTitle)) {
      const imageUrl = chapterImages.get(chapterTitle);
      if (imageUrl) {
        await addImage(imageUrl, 280, 280);
      }
    }
    const contentLines = section.content.split("\n").filter((line) => line.trim());
    for (const contentLine of contentLines) {
      addText(contentLine, 11);
      yPosition -= 5;
      linesOnCurrentPage += 1;
    }
    yPosition -= 10;
    linesOnCurrentPage += 1;
  }
  if (references && references.length > 0) {
    if (linesOnCurrentPage > maxLinesPerPage - 10) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
      linesOnCurrentPage = 0;
    }
    addText("Refer\xEAncias", 16, true);
    yPosition -= 15;
    linesOnCurrentPage += 2;
    for (const reference of references) {
      addText(reference, 10);
      yPosition -= 8;
      linesOnCurrentPage += 1;
    }
  }
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/processing.ts
async function transcribeAudioWithGemini(videoUrl) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional transcriber. Your task is to transcribe the audio from the provided video file into Portuguese text. Provide only the transcription without any additional commentary or formatting."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please transcribe the audio from this video file into Portuguese:"
            },
            {
              type: "file_url",
              file_url: {
                url: videoUrl,
                mime_type: "video/mp4"
              }
            }
          ]
        }
      ]
    });
    const transcription = response.choices[0]?.message.content;
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
async function generateBookStructure(transcription) {
  const systemPrompt = `Voc\xEA \xE9 um escritor profissional, editor editorial e especialista em estrutura\xE7\xE3o de livros publicados.
Sua tarefa \xE9 transformar a transcri\xE7\xE3o completa de um v\xEDdeo em um livro profissional, bem estruturado e public\xE1vel.

OBJETIVO:
Gerar um livro formal, coeso e aprofundado a partir do conte\xFAdo transcrito do v\xEDdeo enviado pelo usu\xE1rio.

REQUISITOS GERAIS:

1. TAMANHO DO LIVRO:
- O livro deve ter entre 50 e 100 p\xE1ginas.
- A quantidade de p\xE1ginas deve variar proporcionalmente \xE0 densidade e relev\xE2ncia do conte\xFAdo.
- Expanda conceitos importantes.
- Elimine redund\xE2ncias t\xEDpicas da linguagem oral.
- Aprofunde t\xF3picos relevantes.
- N\xE3o adicione conte\xFAdo irrelevante apenas para aumentar volume.

2. FORMATA\xC7\xC3O PROFISSIONAL:
O livro deve conter obrigatoriamente:
- T\xEDtulo impactante e profissional
- Subt\xEDtulo (se aplic\xE1vel)
- Nome do autor (caso n\xE3o informado, usar "Autor Independente")
- Sum\xE1rio organizado
- Introdu\xE7\xE3o formal
- Cap\xEDtulos numerados (Cap\xEDtulo 1, Cap\xEDtulo 2...)
- Subt\xEDtulos dentro de cada cap\xEDtulo
- Conclus\xE3o
- Se apropriado: Gloss\xE1rio ou Considera\xE7\xF5es Finais

IMPORTANTE: N\xC3O inclua p\xE1gina de direitos autorais, copyright ou qualquer texto legal.

3. ORGANIZA\xC7\xC3O:
- Estrutura progressiva e l\xF3gica
- Coes\xE3o entre cap\xEDtulos
- Transi\xE7\xF5es naturais
- Evitar repeti\xE7\xE3o
- Linguagem editorial formal
- Remover v\xEDcios de linguagem oral
- Converter explica\xE7\xF5es faladas em narrativa escrita fluida

4. PROFUNDIDADE:
- Expandir conceitos t\xE9cnicos quando necess\xE1rio
- Incluir exemplos explicativos
- Inserir estudos de caso quando pertinente
- Adicionar contextualiza\xE7\xE3o hist\xF3rica ou conceitual se relevante ao tema

5. ESTILO:
- Linguagem formal e profissional
- Tom de livro publicado
- Escrita clara, estruturada e refinada
- Par\xE1grafos bem distribu\xEDdos
- Uso adequado de t\xEDtulos e subt\xEDtulos

6. ILUSTRA\xC7\xD5ES:
N\xC3O inclua marcadores de ilustra\xE7\xE3o no texto. As imagens ser\xE3o geradas automaticamente pela API ap\xF3s a gera\xE7\xE3o do livro e inseridas nos cap\xEDtulos do PDF. Foque exclusivamente no texto profissional e bem estruturado.

7. PROIBI\xC7\xD5ES ABSOLUTAS:
- N\xC3O inclua coment\xE1rios como:
  "Aqui est\xE1 seu livro"
  "Espero que goste"
  "Segue abaixo"
  "Como solicitado"
- N\xC3O explique o processo
- N\xC3O inclua observa\xE7\xF5es da IA
- N\xC3O utilize linguagem conversacional
- A sa\xEDda deve conter EXCLUSIVAMENTE o conte\xFAdo do livro finalizado

8. QUALIDADE EDITORIAL:
- O texto deve parecer pronto para publica\xE7\xE3o
- Evitar formata\xE7\xE3o estilo texto simples
- Estruturar visualmente como livro real
- Manter consist\xEAncia terminol\xF3gica

INSTRU\xC7\xC3O FINAL:
Produza apenas o livro final completo, j\xE1 estruturado, revisado e formatado.
Nenhum texto fora da estrutura do livro deve ser inclu\xEDdo.`;
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `Transcri\xE7\xE3o do v\xEDdeo:

${transcription}

Transforme esta transcri\xE7\xE3o em um livro profissional seguindo rigorosamente todas as regras obrigat\xF3rias acima.`
      }
    ]
  });
  let content = response.choices[0]?.message.content;
  content = content.replace(/\[ILUSTRAÇÃO DO CAPÍTULO:.*?\]/gi, "");
  content = content.replace(/\[ILLUSTRATION OF CHAPTER:.*?\]/gi, "");
  content = content.replace(/Página de Direitos Autorais[\s\S]*?(?=##|$)/i, "");
  content = content.replace(/Copyright Page[\s\S]*?(?=##|$)/i, "");
  content = content.replace(/Todos os direitos reservados[\s\S]*?(?=##|$)/i, "");
  content = content.replace(/\n{3,}/g, "\n\n");
  const lines = content.split("\n").filter((line) => line.trim());
  const title = lines[0]?.replace(/^#+\s*/, "").trim() || "Livro sem t\xEDtulo";
  const subtitle = lines[1]?.replace(/^#+\s*/, "").trim() || "Gerado automaticamente";
  return {
    title,
    subtitle,
    content
  };
}
async function processAudioTranscription(audioUrl, bookId, jobId, userId) {
  try {
    await updateProcessingJob(jobId, {
      status: "processing",
      progress: 10,
      startedAt: /* @__PURE__ */ new Date()
    });
    const transcription = await transcribeAudioWithGemini(audioUrl);
    await updateProcessingJob(jobId, {
      progress: 50
    });
    await updateBook(bookId, userId, {
      transcription,
      status: "processing"
    });
    return transcription;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Audio transcription error:", errorMessage);
    await updateProcessingJob(jobId, {
      status: "failed",
      errorMessage
    });
    throw error;
  }
}
async function generateBook(transcription, bookId, jobId, userId) {
  try {
    await updateProcessingJob(jobId, {
      status: "processing",
      progress: 10,
      startedAt: /* @__PURE__ */ new Date()
    });
    const { title, subtitle, content } = await generateBookStructure(transcription);
    const references = await extractReferencesFromTranscription(transcription);
    await updateProcessingJob(jobId, {
      progress: 90
    });
    await updateBook(bookId, userId, {
      title,
      subtitle,
      structuredContent: content,
      references: references.length > 0 ? references : null,
      status: "completed"
    });
    await updateProcessingJob(jobId, {
      status: "completed",
      progress: 100,
      completedAt: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Book generation error:", errorMessage);
    await updateProcessingJob(jobId, {
      status: "failed",
      errorMessage
    });
    await updateBook(bookId, userId, {
      status: "failed",
      errorMessage
    });
    throw error;
  }
}
function extractChaptersFromBook(bookContent) {
  const chapters = [];
  const chapterRegex = /^##\s+(?:Capítulo|Chapter)\s+(\d+):\s*(.+?)$/gm;
  let match;
  while ((match = chapterRegex.exec(bookContent)) !== null) {
    const number = parseInt(match[1], 10);
    const title = match[2].trim();
    const startIndex = match.index + match[0].length;
    const nextChapterMatch = chapterRegex.exec(bookContent);
    const endIndex = nextChapterMatch ? nextChapterMatch.index : bookContent.length;
    chapterRegex.lastIndex = startIndex;
    const content = bookContent.substring(startIndex, endIndex).trim();
    chapters.push({
      number,
      title,
      content
    });
  }
  return chapters;
}
async function generateImagePromptForChapter(chapter) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional image prompt generator. Your task is to create a detailed, specific image prompt based on chapter content that will be used to generate illustrations for a professional book. The prompt should be visual, descriptive, and suitable for AI image generation. Generate ONLY the prompt text, nothing else."
        },
        {
          role: "user",
          content: `Generate a detailed image prompt for a book chapter with the following information:

Chapter Title: ${chapter.title}
Chapter Number: ${chapter.number}

Chapter Content Summary:
${chapter.content.substring(0, 500)}...

Create a professional, visually rich prompt that captures the essence of this chapter. The image should be suitable for a professional published book. Include specific visual elements, style, composition, and mood. The prompt should be detailed enough for high-quality AI image generation (minimum 1024x1024 resolution).`
        }
      ]
    });
    const prompt = response.choices[0]?.message.content;
    if (!prompt || prompt.length === 0) {
      throw new Error("Failed to generate image prompt from Gemini response");
    }
    return prompt;
  } catch (error) {
    throw new Error(
      `Failed to generate image prompt: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
async function generateImageWithGemini(imagePrompt) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional image generator. Your task is to generate high-quality, professional images suitable for book illustrations. Generate images with consistent style, professional quality, and minimum 1024x1024 resolution."
        },
        {
          role: "user",
          content: imagePrompt
        }
      ]
    });
    const imageUrl = response.choices[0]?.message.content;
    if (!imageUrl || imageUrl.length === 0) {
      throw new Error("Failed to generate image from Gemini response");
    }
    return imageUrl;
  } catch (error) {
    throw new Error(
      `Failed to generate image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
async function generateImagesForBook(bookContent, bookId, userId) {
  try {
    const chapters = extractChaptersFromBook(bookContent);
    const images = {};
    for (const chapter of chapters) {
      try {
        const prompt = await generateImagePromptForChapter(chapter);
        const imageUrl = await generateImageWithGemini(prompt);
        images[chapter.title] = imageUrl;
      } catch (error) {
        console.error(`Failed to generate image for chapter "${chapter.title}":`, error);
      }
    }
    return images;
  } catch (error) {
    throw new Error(
      `Failed to generate images for book: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
async function extractReferencesFromTranscription(transcription) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Voc\xEA \xE9 um especialista em formata\xE7\xE3o de refer\xEAncias bibliogr\xE1ficas em formato ABNT.
Sua tarefa \xE9 extrair todas as refer\xEAncias mencionadas no texto transcrito e format\xE1-las de acordo com as normas ABNT (Associa\xE7\xE3o Brasileira de Normas T\xE9cnicas).

INSTRU\xC7\xD5ES:
1. Identifique todos os livros, artigos, sites, autores e fontes mencionados no texto
2. Formate cada refer\xEAncia de acordo com as regras ABNT:
   - Para livros: SOBRENOME, Nome. T\xEDtulo do livro. Edi\xE7\xE3o (se houver). Local de publica\xE7\xE3o: Editora, ano.
   - Para artigos: SOBRENOME, Nome. T\xEDtulo do artigo. Nome da revista, volume, n\xFAmero, p\xE1ginas, ano.
   - Para sites: SOBRENOME, Nome. T\xEDtulo da p\xE1gina. Dispon\xEDvel em: <URL>. Acesso em: data.
3. Ordene as refer\xEAncias alfabeticamente pelo sobrenome do autor
4. Se o autor n\xE3o for mencionado, use o t\xEDtulo como base para ordena\xE7\xE3o
5. Retorne APENAS as refer\xEAncias formatadas, uma por linha
6. Se nenhuma refer\xEAncia for encontrada, retorne uma lista vazia`
        },
        {
          role: "user",
          content: `Extraia e formate as refer\xEAncias do seguinte texto transcrito em formato ABNT:

${transcription}

Retorne as refer\xEAncias formatadas em ABNT, uma por linha. Se n\xE3o houver refer\xEAncias claras, retorne uma lista vazia.`
        }
      ]
    });
    const referencesText = response.choices[0]?.message.content;
    if (!referencesText || referencesText.length === 0) {
      return [];
    }
    const references = referencesText.split("\n").map((ref) => ref.trim()).filter((ref) => ref.length > 0 && !ref.toLowerCase().includes("nenhuma refer\xEAncia"));
    return references;
  } catch (error) {
    console.error("Failed to extract references:", error);
    return [];
  }
}

// server/routers/books.ts
var booksRouter = router({
  createMulti: protectedProcedure.input(z4.object({ videoIds: z4.array(z4.number()), title: z4.string().optional() })).mutation(async ({ ctx, input }) => {
    try {
      if (input.videoIds.length === 0) {
        throw new TRPCError4({
          code: "BAD_REQUEST",
          message: "At least one video is required"
        });
      }
      for (const videoId of input.videoIds) {
        const video = await getVideoById(videoId, ctx.user.id);
        if (!video) {
          throw new TRPCError4({
            code: "NOT_FOUND",
            message: `Video ${videoId} not found`
          });
        }
      }
      const book = await createBook({
        userId: ctx.user.id,
        status: "pending",
        title: input.title
      });
      await linkVideosToBook(book.id, input.videoIds);
      (async () => {
        try {
          const bookVideos = await getBookVideos(book.id);
          let allTranscriptions = [];
          for (let i = 0; i < bookVideos.length; i++) {
            const videoBook = bookVideos[i];
            const video = await getVideoById(videoBook.videoId, ctx.user.id);
            if (!video) continue;
            const transcriptionJob = await createProcessingJob({
              bookId: book.id,
              stage: "transcription",
              status: "processing"
            });
            const transcription = await processAudioTranscription(
              video.fileUrl,
              book.id,
              transcriptionJob.id,
              ctx.user.id
            );
            allTranscriptions.push(transcription);
            await updateBook(book.id, ctx.user.id, {
              transcription: allTranscriptions.join("\n\n---\n\n")
            });
          }
          const generationJob = await createProcessingJob({
            bookId: book.id,
            stage: "generation",
            status: "pending"
          });
          const consolidatedTranscription = allTranscriptions.join("\n\n---\n\n");
          await generateBook(consolidatedTranscription, book.id, generationJob.id, ctx.user.id);
          await notifyOwner({
            title: "Livro multi-v\xEDdeo gerado com sucesso!",
            content: `O livro foi gerado automaticamente a partir de ${input.videoIds.length} v\xEDdeos.`
          });
        } catch (error) {
          console.error("Multi-video book processing error:", error);
          await notifyOwner({
            title: "Erro ao gerar livro multi-v\xEDdeo",
            content: `Falha ao processar ${input.videoIds.length} v\xEDdeos: ${error instanceof Error ? error.message : "Erro desconhecido"}`
          });
        }
      })();
      return {
        id: book.id,
        videoIds: input.videoIds,
        status: "pending"
      };
    } catch (error) {
      if (error instanceof TRPCError4) throw error;
      console.error("Create multi-video book error:", error);
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create multi-video book"
      });
    }
  }),
  create: protectedProcedure.input(z4.object({ videoId: z4.number() })).mutation(async ({ ctx, input }) => {
    try {
      const video = await getVideoById(input.videoId, ctx.user.id);
      if (!video) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Video not found"
        });
      }
      const book = await createBook({
        videoId: input.videoId,
        userId: ctx.user.id,
        status: "pending"
      });
      (async () => {
        try {
          const transcriptionJob = await createProcessingJob({
            bookId: book.id,
            stage: "transcription",
            status: "pending"
          });
          const transcription = await processAudioTranscription(
            video.fileUrl,
            book.id,
            transcriptionJob.id,
            ctx.user.id
          );
          const generationJob = await createProcessingJob({
            bookId: book.id,
            stage: "generation",
            status: "pending"
          });
          await generateBook(transcription, book.id, generationJob.id, ctx.user.id);
          await notifyOwner({
            title: "Livro gerado com sucesso!",
            content: `O livro foi gerado automaticamente a partir do video "${video.filename}".`
          });
        } catch (error) {
          console.error("Book processing error:", error);
          await notifyOwner({
            title: "Erro ao gerar livro",
            content: `Falha ao processar o video "${video.filename}": ${error instanceof Error ? error.message : "Erro desconhecido"}`
          });
        }
      })();
      return {
        id: book.id,
        videoId: input.videoId,
        status: "pending"
      };
    } catch (error) {
      if (error instanceof TRPCError4) throw error;
      console.error("Create book error:", error);
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create book"
      });
    }
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const books2 = await getUserBooks(ctx.user.id);
      return books2;
    } catch (error) {
      console.error("List books error:", error);
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch books"
      });
    }
  }),
  get: protectedProcedure.input(z4.object({ id: z4.number() })).query(async ({ ctx, input }) => {
    try {
      const book = await getBookById(input.id, ctx.user.id);
      if (!book) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Book not found"
        });
      }
      return book;
    } catch (error) {
      if (error instanceof TRPCError4) throw error;
      console.error("Get book error:", error);
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch book"
      });
    }
  }),
  update: protectedProcedure.input(
    z4.object({
      id: z4.number(),
      title: z4.string().optional(),
      subtitle: z4.string().optional(),
      structuredContent: z4.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const book = await getBookById(input.id, ctx.user.id);
      if (!book) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Book not found"
        });
      }
      const updates = {};
      if (input.title !== void 0) updates.title = input.title;
      if (input.subtitle !== void 0) updates.subtitle = input.subtitle;
      if (input.structuredContent !== void 0)
        updates.structuredContent = input.structuredContent;
      updates.updatedAt = /* @__PURE__ */ new Date();
      await updateBook(input.id, ctx.user.id, updates);
      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError4) throw error;
      console.error("Update book error:", error);
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update book"
      });
    }
  }),
  delete: protectedProcedure.input(z4.object({ id: z4.number() })).mutation(async ({ ctx, input }) => {
    try {
      const book = await getBookById(input.id, ctx.user.id);
      if (!book) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Book not found"
        });
      }
      await deleteBook(input.id, ctx.user.id);
      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError4) throw error;
      console.error("Delete book error:", error);
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete book"
      });
    }
  }),
  status: protectedProcedure.input(z4.object({ id: z4.number() })).query(async ({ ctx, input }) => {
    try {
      const book = await getBookById(input.id, ctx.user.id);
      if (!book) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Book not found"
        });
      }
      const jobs = await getBookProcessingJobs(input.id);
      return {
        bookStatus: book.status,
        jobs: jobs.map((job) => ({
          stage: job.stage,
          status: job.status,
          progress: job.progress,
          errorMessage: job.errorMessage
        }))
      };
    } catch (error) {
      if (error instanceof TRPCError4) throw error;
      console.error("Get status error:", error);
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch status"
      });
    }
  }),
  export: protectedProcedure.input(
    z4.object({
      id: z4.number(),
      format: z4.enum(["pdf", "docx"])
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const book = await getBookById(input.id, ctx.user.id);
      if (!book) {
        throw new TRPCError4({
          code: "NOT_FOUND",
          message: "Book not found"
        });
      }
      if (!book.structuredContent) {
        throw new TRPCError4({
          code: "BAD_REQUEST",
          message: "Book content not ready for export"
        });
      }
      let buffer;
      const mimeType = input.format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (input.format === "pdf") {
        console.log("Generating images for book chapters...");
        const chapterImages = await generateImagesForBook(book.structuredContent, book.id, ctx.user.id);
        console.log(`Generated ${Object.keys(chapterImages).length} chapter images`);
        buffer = await exportToPDF(
          book.title || "Untitled",
          book.subtitle || "",
          book.structuredContent,
          new Map(Object.entries(chapterImages)),
          book.references
        );
      } else {
        buffer = await exportToDOCX(
          book.title || "Untitled",
          book.subtitle || "",
          book.structuredContent
        );
      }
      const base64 = buffer.toString("base64");
      const fileKey = `exports/${ctx.user.id}/${book.id}-${Date.now()}.${input.format}`;
      await storagePut(fileKey, buffer, mimeType);
      return {
        data: base64,
        format: input.format,
        mimeType,
        filename: `${book.title || "livro"}.${input.format}`
      };
    } catch (error) {
      if (error instanceof TRPCError4) throw error;
      console.error("Export error:", error);
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to export book"
      });
    }
  })
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  videos: videosRouter,
  books: booksRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs3 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs2 from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs2.existsSync(LOG_DIR)) {
    fs2.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs2.existsSync(logPath) || fs2.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs2.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs2.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs2.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = path2.resolve(process.cwd(), "dist/public");
  if (!fs3.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, run npm run build first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.join(distPath, "index.html"));
  });
}

// server/_core/index.ts
import { join as join2 } from "path";
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "500mb" }));
  app.use(express2.urlencoded({ limit: "500mb", extended: true }));
  registerOAuthRoutes(app);
  app.use("/.local-storage", express2.static(join2(process.cwd(), ".local-storage")));
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
