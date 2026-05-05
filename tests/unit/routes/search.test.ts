import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock services
const mockGetVideosByHashtag = vi.fn();
const mockSearchVideos = vi.fn();
const mockGetPlaybackUrl = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getVideosByHashtag: (...args: unknown[]) => mockGetVideosByHashtag(...args),
    searchVideos: (...args: unknown[]) => mockSearchVideos(...args),
  },
  videoService: {
    getPlaybackUrl: (...args: unknown[]) => mockGetPlaybackUrl(...args),
  },
}));

import { GET } from "@/app/api/videos/search/route";
import { NextRequest } from "next/server";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/videos/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await GET(createRequest("/api/videos/search?q=test"));

      // then
      expect(response.status).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when neither q nor hashtag parameter is provided", () => {
      it("then it should return 400", async () => {
        // when
        const response = await GET(createRequest("/api/videos/search"));

        // then
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe("Provide 'q' or 'hashtag' parameter");
      });
    });

    describe("when searching by hashtag", () => {
      it("then it should call getVideosByHashtag", async () => {
        // given
        mockGetVideosByHashtag.mockResolvedValue([]);

        // when
        await GET(createRequest("/api/videos/search?hashtag=delltech"));

        // then
        expect(mockGetVideosByHashtag).toHaveBeenCalledWith("delltech", 20, 0);
      });

      it("then it should respect custom limit and offset", async () => {
        // given
        mockGetVideosByHashtag.mockResolvedValue([]);

        // when
        await GET(createRequest("/api/videos/search?hashtag=demo&limit=5&offset=10"));

        // then
        expect(mockGetVideosByHashtag).toHaveBeenCalledWith("demo", 5, 10);
      });

      it("then it should cap the limit at 50", async () => {
        // given
        mockGetVideosByHashtag.mockResolvedValue([]);

        // when
        await GET(createRequest("/api/videos/search?hashtag=demo&limit=100"));

        // then
        expect(mockGetVideosByHashtag).toHaveBeenCalledWith("demo", 50, 0);
      });

      it("then it should enrich videos with playback URLs", async () => {
        // given
        const mockVideos = [
          { id: "video-1", videoPlaybackId: "playback-1", title: "Test" },
        ];
        mockGetVideosByHashtag.mockResolvedValue(mockVideos);
        mockGetPlaybackUrl.mockReturnValue("https://stream.example.com/playback-1");

        // when
        const response = await GET(
          createRequest("/api/videos/search?hashtag=delltech")
        );

        // then
        const body = await response.json();
        expect(body.videos[0].playbackUrl).toBe(
          "https://stream.example.com/playback-1"
        );
      });
    });

    describe("when searching by query", () => {
      it("then it should call searchVideos", async () => {
        // given
        mockSearchVideos.mockResolvedValue([]);

        // when
        await GET(createRequest("/api/videos/search?q=engineering"));

        // then
        expect(mockSearchVideos).toHaveBeenCalledWith({
          query: "engineering",
          limit: 20,
          offset: 0,
        });
      });

      it("then it should cap the limit at 50", async () => {
        // given
        mockSearchVideos.mockResolvedValue([]);

        // when
        await GET(createRequest("/api/videos/search?q=test&limit=200"));

        // then
        expect(mockSearchVideos).toHaveBeenCalledWith({
          query: "test",
          limit: 50,
          offset: 0,
        });
      });
    });

    describe("when both hashtag and q are provided", () => {
      it("then it should prioritize hashtag over q", async () => {
        // given
        mockGetVideosByHashtag.mockResolvedValue([]);

        // when
        await GET(
          createRequest("/api/videos/search?hashtag=demo&q=engineering")
        );

        // then
        expect(mockGetVideosByHashtag).toHaveBeenCalled();
        expect(mockSearchVideos).not.toHaveBeenCalled();
      });
    });

    describe("when results equal the limit", () => {
      it("then hasMore should be true", async () => {
        // given
        const mockVideos = Array.from({ length: 20 }, (_, i) => ({
          id: `video-${i}`,
          videoPlaybackId: `playback-${i}`,
        }));
        mockSearchVideos.mockResolvedValue(mockVideos);
        mockGetPlaybackUrl.mockReturnValue("https://stream.example.com/video");

        // when
        const response = await GET(createRequest("/api/videos/search?q=test"));

        // then
        const body = await response.json();
        expect(body.hasMore).toBe(true);
      });
    });

    describe("when results are fewer than the limit", () => {
      it("then hasMore should be false", async () => {
        // given
        mockSearchVideos.mockResolvedValue([
          { id: "video-1", videoPlaybackId: "playback-1" },
        ]);
        mockGetPlaybackUrl.mockReturnValue("https://stream.example.com/video");

        // when
        const response = await GET(createRequest("/api/videos/search?q=test"));

        // then
        const body = await response.json();
        expect(body.hasMore).toBe(false);
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockSearchVideos.mockRejectedValue(new Error("DB error"));

        // when
        const response = await GET(createRequest("/api/videos/search?q=test"));

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to search videos");
      });
    });
  });
});
