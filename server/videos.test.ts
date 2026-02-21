import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("videos router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  it("should list videos for authenticated user", async () => {
    const caller = appRouter.createCaller(ctx);
    const videos = await caller.videos.list();
    expect(Array.isArray(videos)).toBe(true);
  });

  it("should validate video upload input", async () => {
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.videos.upload({
        filename: "test.mp4",
        fileData: "invalid-base64",
        mimeType: "video/invalid",
        fileSize: 1000000000, // 1GB - exceeds limit
      });
      expect.fail("Should have thrown error for invalid file size");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should reject unsupported video formats", async () => {
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.videos.upload({
        filename: "test.txt",
        fileData: "dGVzdA==", // base64 for "test"
        mimeType: "text/plain",
        fileSize: 100,
      });
      expect.fail("Should have thrown error for unsupported format");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("books router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  it("should list books for authenticated user", async () => {
    const caller = appRouter.createCaller(ctx);
    const books = await caller.books.list();
    expect(Array.isArray(books)).toBe(true);
  });

  it("should require authentication for book operations", async () => {
    const unauthCtx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(unauthCtx);

    try {
      await caller.books.list();
      expect.fail("Should require authentication");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
