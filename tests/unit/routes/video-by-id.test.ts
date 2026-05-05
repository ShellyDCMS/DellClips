import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock services
const mockGetVideoById = vi.fn();
const mockHasUserLikedVideo = vi.fn();
const mockDeleteVideo = vi.fn();
const mockGetPlaybackUrl = vi.fn();
const mockDeleteVideoFromProvider = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getVideoById: (...args: unknown[]) => mockGetVideoById(...args),
    hasUserLikedVideo: (...args: unknown[]) => mockHasUserLikedVideo(...args),
    deleteVideo: (...args: unknown[]) => mockDeleteVideo(...args),
  },
  videoService: {
    getPlaybackUrl: (...args: unknown[]) => mockGetPlaybackUrl(...args),
    deleteVideo: (...args: unknown[]) => mockDeleteVideoFromProvider(...args),
  },
}));

import { GET, DELETE } from "@/app/api/videos/[id]/route";
import { NextRequest } from "next/server";

function createRequest(method: string = "GET"): NextRequest {
  return new NextRequest(new URL("/api/videos/video-1", "http://localhost:3000"), {
    method,
  });
}

function createParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/videos/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await GET(createRequest(), createParams("video-1"));

      // then
      expect(response.status).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when the video exists", () => {
      it("then it should return the video with playback URL and like status", async () => {
        // given
        const mockVideo = {
          id: "video-1",
          title: "Test Video",
          videoPlaybackId: "playback-1",
          author: { id: "user-2", name: "Author" },
        };
        mockGetVideoById.mockResolvedValue(mockVideo);
        mockHasUserLikedVideo.mockResolvedValue(false);
        mockGetPlaybackUrl.mockReturnValue("https://stream.example.com/playback-1");

        // when
        const response = await GET(createRequest(), createParams("video-1"));

        // then
        const body = await response.json();
        expect(body.title).toBe("Test Video");
        expect(body.playbackUrl).toBe("https://stream.example.com/playback-1");
        expect(body.hasLiked).toBe(false);
      });
    });

    describe("when the video does not exist", () => {
      it("then it should return 404", async () => {
        // given
        mockGetVideoById.mockResolvedValue(null);

        // when
        const response = await GET(createRequest(), createParams("nonexistent"));

        // then
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toBe("Video not found");
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockGetVideoById.mockRejectedValue(new Error("DB error"));

        // when
        const response = await GET(createRequest(), createParams("video-1"));

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to fetch video");
      });
    });
  });
});

describe("DELETE /api/videos/[id]", () => {
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

    describe("when the video does not exist", () => {
      it("then it should return 404", async () => {
        // given
        mockGetVideoById.mockResolvedValue(null);

        // when
        const response = await DELETE(createRequest("DELETE"), createParams("video-1"));

        // then
        expect(response.status).toBe(404);
      });
    });

    describe("when the user is not the video owner", () => {
      it("then it should return 403", async () => {
        // given
        mockGetVideoById.mockResolvedValue({
          id: "video-1",
          videoPlaybackId: "playback-1",
          author: { id: "user-other" },
        });

        // when
        const response = await DELETE(createRequest("DELETE"), createParams("video-1"));

        // then
        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toBe("Forbidden");
      });
    });

    describe("when the user is the video owner", () => {
      it("then it should delete from provider and database", async () => {
        // given
        mockGetVideoById.mockResolvedValue({
          id: "video-1",
          videoPlaybackId: "playback-1",
          author: { id: "user-1" },
        });
        mockDeleteVideoFromProvider.mockResolvedValue(undefined);
        mockDeleteVideo.mockResolvedValue(undefined);

        // when
        const response = await DELETE(createRequest("DELETE"), createParams("video-1"));

        // then
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.deleted).toBe(true);
        expect(mockDeleteVideoFromProvider).toHaveBeenCalledWith("playback-1");
        expect(mockDeleteVideo).toHaveBeenCalledWith("video-1");
      });

      it("then it should still delete from DB if provider deletion fails", async () => {
        // given
        mockGetVideoById.mockResolvedValue({
          id: "video-1",
          videoPlaybackId: "playback-1",
          author: { id: "user-1" },
        });
        mockDeleteVideoFromProvider.mockRejectedValue(new Error("Provider error"));
        mockDeleteVideo.mockResolvedValue(undefined);

        // when
        const response = await DELETE(createRequest("DELETE"), createParams("video-1"));

        // then
        expect(response.status).toBe(200);
        expect(mockDeleteVideo).toHaveBeenCalledWith("video-1");
      });
    });
  });
});
