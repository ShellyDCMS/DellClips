import { GET } from "@/app/api/videos/search/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockGetVideosByHashtag = vi.fn();
const mockSearchVideos = vi.fn();
const mockGetPlaybackUrl = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getVideosByHashtag: (...args: unknown[]) =>
      mockGetVideosByHashtag(...args),
    searchVideos: (...args: unknown[]) => mockSearchVideos(...args),
  },
  videoService: {
    getPlaybackUrl: (...args: unknown[]) => mockGetPlaybackUrl(...args),
  },
}));

export class SearchDriver {
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
    hashtagVideos: (videos: any[]) => {
      mockGetVideosByHashtag.mockResolvedValue(videos);
    },
    searchResults: (videos: any[]) => {
      mockSearchVideos.mockResolvedValue(videos);
    },
    searchFails: (error: Error) => {
      mockSearchVideos.mockRejectedValue(error);
    },
    playbackUrl: (url: string) => {
      mockGetPlaybackUrl.mockReturnValue(url);
    },
  };

  when = {
    search: async (url: string) => {
      const request = new NextRequest(new URL(url, "http://localhost:3000"));
      this.lastResponse = await GET(request);
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    getVideosByHashtagMock: () => mockGetVideosByHashtag,
    searchVideosMock: () => mockSearchVideos,
  };
}
