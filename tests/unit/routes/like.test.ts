import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock database service
const mockGetVideoById = vi.fn();
const mockLikeVideo = vi.fn();
const mockUnlikeVideo = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getVideoById: (...args: unknown[]) => mockGetVideoById(...args),
    likeVideo: (...args: unknown[]) => mockLikeVideo(...args),
    unlikeVideo: (...args: unknown[]) => mockUnlikeVideo(...args),
  },
}));

import { POST, DELETE } from "@/app/api/videos/[id]/like/route";
import { NextRequest } from "next/server";

function createRequest(method: string): NextRequest {
  return new NextRequest(new URL("/api/videos/video-1/like", "http://localhost:3000"), {
    method,
  });
}

function createParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/videos/[id]/like", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await POST(createRequest("POST"), createParams("video-1"));

      // then
      expect(response.status).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when the video does not exist", () => {
      it("then it should return 404", async () => {
        // given
        mockGetVideoById.mockResolvedValue(null);

        // when
        const response = await POST(createRequest("POST"), createParams("nonexistent"));

        // then
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toBe("Video not found");
      });
    });

    describe("when the video exists", () => {
      it("then it should like the video and return liked true", async () => {
        // given
        mockGetVideoById.mockResolvedValue({ id: "video-1" });
        mockLikeVideo.mockResolvedValue(undefined);

        // when
        const response = await POST(createRequest("POST"), createParams("video-1"));

        // then
        const body = await response.json();
        expect(body.liked).toBe(true);
        expect(mockLikeVideo).toHaveBeenCalledWith("user-1", "video-1");
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockGetVideoById.mockResolvedValue({ id: "video-1" });
        mockLikeVideo.mockRejectedValue(new Error("DB error"));

        // when
        const response = await POST(createRequest("POST"), createParams("video-1"));

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to like video");
      });
    });
  });
});

describe("DELETE /api/videos/[id]/like", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await DELETE(createRequest("DELETE"), createParams("video-1"));

      // then
      expect(response.status).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when unliking a video", () => {
      it("then it should unlike the video and return liked false", async () => {
        // given
        mockUnlikeVideo.mockResolvedValue(undefined);

        // when
        const response = await DELETE(createRequest("DELETE"), createParams("video-1"));

        // then
        const body = await response.json();
        expect(body.liked).toBe(false);
        expect(mockUnlikeVideo).toHaveBeenCalledWith("user-1", "video-1");
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockUnlikeVideo.mockRejectedValue(new Error("DB error"));

        // when
        const response = await DELETE(createRequest("DELETE"), createParams("video-1"));

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to unlike video");
      });
    });
  });
});
