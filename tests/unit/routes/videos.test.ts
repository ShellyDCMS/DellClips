import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock services
const mockGetVideoFeed = vi.fn();
const mockHasUserLikedVideo = vi.fn();
const mockCreateVideoRecord = vi.fn();
const mockGetPlaybackUrl = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getVideoFeed: (...args: unknown[]) => mockGetVideoFeed(...args),
    hasUserLikedVideo: (...args: unknown[]) => mockHasUserLikedVideo(...args),
    createVideoRecord: (...args: unknown[]) => mockCreateVideoRecord(...args),
  },
  videoService: {
    getPlaybackUrl: (...args: unknown[]) => mockGetPlaybackUrl(...args),
  },
}));

import { GET, POST } from "@/app/api/videos/route";
import { NextRequest } from "next/server";

function createGetRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL("/api/videos", "http://localhost:3000"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/videos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await GET(createGetRequest("/api/videos"));

      // then
      expect(response.status).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when requesting the video feed with defaults", () => {
      it("then it should call getVideoFeed with default limit and offset", async () => {
        // given
        mockGetVideoFeed.mockResolvedValue([]);

        // when
        await GET(createGetRequest("/api/videos"));

        // then
        expect(mockGetVideoFeed).toHaveBeenCalledWith({
          userId: "user-1",
          limit: 20,
          offset: 0,
        });
      });
    });

    describe("when requesting with custom limit and offset", () => {
      it("then it should respect the parameters", async () => {
        // given
        mockGetVideoFeed.mockResolvedValue([]);

        // when
        await GET(createGetRequest("/api/videos?limit=10&offset=5"));

        // then
        expect(mockGetVideoFeed).toHaveBeenCalledWith({
          userId: "user-1",
          limit: 10,
          offset: 5,
        });
      });
    });

    describe("when requesting with limit exceeding 50", () => {
      it("then it should cap the limit at 50", async () => {
        // given
        mockGetVideoFeed.mockResolvedValue([]);

        // when
        await GET(createGetRequest("/api/videos?limit=100"));

        // then
        expect(mockGetVideoFeed).toHaveBeenCalledWith({
          userId: "user-1",
          limit: 50,
          offset: 0,
        });
      });
    });

    describe("when videos are returned", () => {
      it("then it should enrich videos with playback URLs and like status", async () => {
        // given
        const mockVideos = [
          {
            id: "video-1",
            title: "Test",
            videoPlaybackId: "playback-1",
            status: "ready",
            author: { id: "user-2", name: "Author" },
          },
        ];
        mockGetVideoFeed.mockResolvedValue(mockVideos);
        mockHasUserLikedVideo.mockResolvedValue(true);
        mockGetPlaybackUrl.mockReturnValue("https://stream.example.com/playback-1");

        // when
        const response = await GET(createGetRequest("/api/videos"));

        // then
        const body = await response.json();
        expect(body.videos[0].playbackUrl).toBe("https://stream.example.com/playback-1");
        expect(body.videos[0].hasLiked).toBe(true);
      });

      it("then it should set hasMore to true when results equal limit", async () => {
        // given
        const mockVideos = Array.from({ length: 20 }, (_, i) => ({
          id: `video-${i}`,
          videoPlaybackId: `playback-${i}`,
        }));
        mockGetVideoFeed.mockResolvedValue(mockVideos);
        mockHasUserLikedVideo.mockResolvedValue(false);
        mockGetPlaybackUrl.mockReturnValue("https://stream.example.com/video");

        // when
        const response = await GET(createGetRequest("/api/videos"));

        // then
        const body = await response.json();
        expect(body.hasMore).toBe(true);
      });

      it("then it should set hasMore to false when results are fewer than limit", async () => {
        // given
        mockGetVideoFeed.mockResolvedValue([
          { id: "video-1", videoPlaybackId: "playback-1" },
        ]);
        mockHasUserLikedVideo.mockResolvedValue(false);
        mockGetPlaybackUrl.mockReturnValue("https://stream.example.com/video");

        // when
        const response = await GET(createGetRequest("/api/videos"));

        // then
        const body = await response.json();
        expect(body.hasMore).toBe(false);
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockGetVideoFeed.mockRejectedValue(new Error("DB error"));

        // when
        const response = await GET(createGetRequest("/api/videos"));

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to fetch videos");
      });
    });
  });
});

describe("POST /api/videos", () => {
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
        createPostRequest({ videoAssetId: "a", videoPlaybackId: "b" })
      );

      // then
      expect(response.status).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when sending a valid request body", () => {
      it("then it should create a video record and return 201", async () => {
        // given
        mockCreateVideoRecord.mockResolvedValue({ id: "new-video-id" });

        // when
        const response = await POST(
          createPostRequest({
            title: "My Video",
            description: "A test video",
            videoAssetId: "asset-123",
            videoPlaybackId: "playback-123",
            hashtags: ["demo", "test"],
          })
        );

        // then
        expect(response.status).toBe(201);
        const body = await response.json();
        expect(body.video.id).toBe("new-video-id");
      });

      it("then it should pass the correct data to createVideoRecord", async () => {
        // given
        mockCreateVideoRecord.mockResolvedValue({ id: "new-video-id" });

        // when
        await POST(
          createPostRequest({
            title: "My Video",
            videoAssetId: "asset-123",
            videoPlaybackId: "playback-123",
            hashtags: ["demo"],
          })
        );

        // then
        expect(mockCreateVideoRecord).toHaveBeenCalledWith({
          userId: "user-1",
          title: "My Video",
          description: undefined,
          videoAssetId: "asset-123",
          videoPlaybackId: "playback-123",
          videoUploadId: undefined,
          hashtags: ["demo"],
        });
      });
    });

    describe("when sending an invalid request body", () => {
      it("then it should return 400 when videoAssetId is missing", async () => {
        // when
        const response = await POST(
          createPostRequest({ videoPlaybackId: "playback-123" })
        );

        // then
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe("Invalid request");
      });

      it("then it should return 400 when videoPlaybackId is missing", async () => {
        // when
        const response = await POST(createPostRequest({ videoAssetId: "asset-123" }));

        // then
        expect(response.status).toBe(400);
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockCreateVideoRecord.mockRejectedValue(new Error("DB error"));

        // when
        const response = await POST(
          createPostRequest({
            videoAssetId: "asset-123",
            videoPlaybackId: "playback-123",
          })
        );

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to create video");
      });
    });
  });
});
