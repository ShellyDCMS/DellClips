import { GET } from "@/app/api/hashtags/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockGetTrendingHashtags = vi.fn();
vi.mock("@/lib/services", () => ({
  databaseService: {
    getTrendingHashtags: (...args: unknown[]) => mockGetTrendingHashtags(...args),
  },
}));

export class HashtagsDriver {
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
    trendingHashtags: (hashtags: any[]) => {
      mockGetTrendingHashtags.mockResolvedValue(hashtags);
    },
    trendingHashtagsFail: (error: Error) => {
      mockGetTrendingHashtags.mockRejectedValue(error);
    },
  };

  when = {
    getHashtags: async (url: string = "/api/hashtags") => {
      const request = new NextRequest(new URL(url, "http://localhost:3000"));
      this.lastResponse = await GET(request);
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    getTrendingHashtagsMock: () => mockGetTrendingHashtags,
  };
}
