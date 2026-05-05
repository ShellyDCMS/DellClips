import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock database service
const mockGetCommentsByVideoId = vi.fn();
const mockGetVideoById = vi.fn();
const mockCreateComment = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getCommentsByVideoId: (...args: unknown[]) => mockGetCommentsByVideoId(...args),
    getVideoById: (...args: unknown[]) => mockGetVideoById(...args),
    createComment: (...args: unknown[]) => mockCreateComment(...args),
  },
}));

import { GET, POST } from "@/app/api/videos/[id]/comments/route";
import { NextRequest } from "next/server";

function createGetRequest(): NextRequest {
  return new NextRequest(
    new URL("/api/videos/video-1/comments", "http://localhost:3000")
  );
}

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new URL("/api/videos/video-1/comments", "http://localhost:3000"),
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }
  );
}

function createParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/videos/[id]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await GET(createGetRequest(), createParams("video-1"));

      // then
      expect(response.status).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when fetching comments for a video", () => {
      it("then it should return the comments", async () => {
        // given
        const mockComments = [
          {
            id: "comment-1",
            text: "Great video!",
            createdAt: new Date().toISOString(),
            author: { id: "user-2", name: "Jane", avatarUrl: null },
          },
        ];
        mockGetCommentsByVideoId.mockResolvedValue(mockComments);

        // when
        const response = await GET(createGetRequest(), createParams("video-1"));

        // then
        const body = await response.json();
        expect(body.comments).toHaveLength(1);
        expect(body.comments[0].text).toBe("Great video!");
      });

      it("then it should pass the video ID to the database service", async () => {
        // given
        mockGetCommentsByVideoId.mockResolvedValue([]);

        // when
        await GET(createGetRequest(), createParams("video-42"));

        // then
        expect(mockGetCommentsByVideoId).toHaveBeenCalledWith("video-42");
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockGetCommentsByVideoId.mockRejectedValue(new Error("DB error"));

        // when
        const response = await GET(createGetRequest(), createParams("video-1"));

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to fetch comments");
      });
    });
  });
});

describe("POST /api/videos/[id]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await POST(
        createPostRequest({ text: "Hello" }),
        createParams("video-1")
      );

      // then
      expect(response.status).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when sending a valid comment", () => {
      it("then it should create the comment and return 201", async () => {
        // given
        mockGetVideoById.mockResolvedValue({ id: "video-1" });
        mockCreateComment.mockResolvedValue({ id: "comment-new" });

        // when
        const response = await POST(
          createPostRequest({ text: "Nice work!" }),
          createParams("video-1")
        );

        // then
        expect(response.status).toBe(201);
        const body = await response.json();
        expect(body.comment.id).toBe("comment-new");
      });

      it("then it should pass the correct arguments to createComment", async () => {
        // given
        mockGetVideoById.mockResolvedValue({ id: "video-1" });
        mockCreateComment.mockResolvedValue({ id: "comment-new" });

        // when
        await POST(createPostRequest({ text: "Nice work!" }), createParams("video-1"));

        // then
        expect(mockCreateComment).toHaveBeenCalledWith("user-1", "video-1", "Nice work!");
      });
    });

    describe("when sending an empty text", () => {
      it("then it should return 400", async () => {
        // when
        const response = await POST(
          createPostRequest({ text: "" }),
          createParams("video-1")
        );

        // then
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe("Invalid request");
      });
    });

    describe("when the text exceeds 1000 characters", () => {
      it("then it should return 400", async () => {
        // when
        const response = await POST(
          createPostRequest({ text: "a".repeat(1001) }),
          createParams("video-1")
        );

        // then
        expect(response.status).toBe(400);
      });
    });

    describe("when the video does not exist", () => {
      it("then it should return 404", async () => {
        // given
        mockGetVideoById.mockResolvedValue(null);

        // when
        const response = await POST(
          createPostRequest({ text: "Hello" }),
          createParams("nonexistent")
        );

        // then
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toBe("Video not found");
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockGetVideoById.mockResolvedValue({ id: "video-1" });
        mockCreateComment.mockRejectedValue(new Error("DB error"));

        // when
        const response = await POST(
          createPostRequest({ text: "Hello" }),
          createParams("video-1")
        );

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to create comment");
      });
    });
  });
});
