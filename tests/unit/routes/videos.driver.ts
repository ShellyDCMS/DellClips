import { GET, POST } from "@/app/api/videos/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

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

export class VideosDriver {
  private lastResponse: Response | null = null;
  private lastBody: any = null;

  beforeAndAfter = () => {
    beforeEach(() => {
      vi.clearAllMocks();
      this.lastResponse = null;
      this.lastBody = null;
    });
  };

  given = {
    unauthenticated: () => {
      mockAuth.mockResolvedValue(null);
    },
    authenticatedUser: (userId: string) => {
      mockAuth.mockResolvedValue({ user: { id: userId } });
    },
    videoFeed: (videos: any[]) => {
      mockGetVideoFeed.mockResolvedValue(videos);
    },
    videoFeedFails: (error: Error) => {
      mockGetVideoFeed.mockRejectedValue(error);
    },
    userLikedVideo: (liked: boolean) => {
      mockHasUserLikedVideo.mockResolvedValue(liked);
    },
    playbackUrl: (url: string) => {
      mockGetPlaybackUrl.mockReturnValue(url);
    },
    createVideoRecord: (result: any) => {
      mockCreateVideoRecord.mockResolvedValue(result);
    },
    createVideoRecordFails: (error: Error) => {
      mockCreateVideoRecord.mockRejectedValue(error);
    },
  };

  when = {
    getVideos: async (url: string = "/api/videos") => {
      const request = new NextRequest(new URL(url, "http://localhost:3000"));
      this.lastResponse = await GET(request);
      this.lastBody = await this.lastResponse.json();
    },
    postVideo: async (body: Record<string, unknown>) => {
      const request = new NextRequest(new URL("/api/videos", "http://localhost:3000"), {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      this.lastResponse = await POST(request);
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    getVideoFeedMock: () => mockGetVideoFeed,
    createVideoRecordMock: () => mockCreateVideoRecord,
  };
}
