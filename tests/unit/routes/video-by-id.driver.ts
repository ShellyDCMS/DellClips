import { DELETE, GET } from "@/app/api/videos/[id]/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

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

export class VideoByIdDriver {
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
    video: (video: any) => {
      mockGetVideoById.mockResolvedValue(video);
    },
    videoNotFound: () => {
      mockGetVideoById.mockResolvedValue(null);
    },
    videoFetchFails: (error: Error) => {
      mockGetVideoById.mockRejectedValue(error);
    },
    userLikedVideo: (liked: boolean) => {
      mockHasUserLikedVideo.mockResolvedValue(liked);
    },
    playbackUrl: (url: string) => {
      mockGetPlaybackUrl.mockReturnValue(url);
    },
    deleteVideoSucceeds: () => {
      mockDeleteVideo.mockResolvedValue(undefined);
    },
    deleteFromProviderSucceeds: () => {
      mockDeleteVideoFromProvider.mockResolvedValue(undefined);
    },
    deleteFromProviderFails: (error: Error) => {
      mockDeleteVideoFromProvider.mockRejectedValue(error);
    },
  };

  when = {
    getVideo: async (id: string) => {
      const request = new NextRequest(
        new URL(`/api/videos/${id}`, "http://localhost:3000")
      );
      this.lastResponse = await GET(request, {
        params: Promise.resolve({ id }),
      });
      this.lastBody = await this.lastResponse.json();
    },
    deleteVideo: async (id: string) => {
      const request = new NextRequest(
        new URL(`/api/videos/${id}`, "http://localhost:3000"),
        { method: "DELETE" }
      );
      this.lastResponse = await DELETE(request, {
        params: Promise.resolve({ id }),
      });
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    deleteVideoMock: () => mockDeleteVideo,
    deleteFromProviderMock: () => mockDeleteVideoFromProvider,
  };
}
