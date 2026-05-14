import { DELETE, GET, POST } from "@/app/api/videos/[id]/like/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockGetVideoById = vi.fn();
const mockGetUserById = vi.fn();
const mockLikeVideo = vi.fn();
const mockUnlikeVideo = vi.fn();
const mockGetVideoLikers = vi.fn();
const mockSendToUser = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getVideoById: (...args: unknown[]) => mockGetVideoById(...args),
    getUserById: (...args: unknown[]) => mockGetUserById(...args),
    likeVideo: (...args: unknown[]) => mockLikeVideo(...args),
    unlikeVideo: (...args: unknown[]) => mockUnlikeVideo(...args),
    getVideoLikers: (...args: unknown[]) => mockGetVideoLikers(...args),
  },
  notificationService: {
    sendToUser: (...args: unknown[]) => mockSendToUser(...args),
  },
}));

export class LikeDriver {
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
    liker: (user: any) => {
      mockGetUserById.mockResolvedValue(user);
    },
    notificationSendSucceeds: () => {
      mockSendToUser.mockResolvedValue(undefined);
    },
    likeSucceeds: () => {
      mockLikeVideo.mockResolvedValue(undefined);
    },
    likeFails: (error: Error) => {
      mockLikeVideo.mockRejectedValue(error);
    },
    unlikeSucceeds: () => {
      mockUnlikeVideo.mockResolvedValue(undefined);
    },
    unlikeFails: (error: Error) => {
      mockUnlikeVideo.mockRejectedValue(error);
    },
    likersReturns: (likers: any[]) => {
      mockGetVideoLikers.mockResolvedValue(likers);
    },
    likersFails: (error: Error) => {
      mockGetVideoLikers.mockRejectedValue(error);
    },
  };

  when = {
    getLikers: async (videoId: string) => {
      const request = new NextRequest(
        new URL(`/api/videos/${videoId}/like`, "http://localhost:3000"),
        { method: "GET" }
      );
      this.lastResponse = await GET(request, {
        params: Promise.resolve({ id: videoId }),
      });
      this.lastBody = await this.lastResponse.json();
    },
    likeVideo: async (videoId: string) => {
      const request = new NextRequest(
        new URL(`/api/videos/${videoId}/like`, "http://localhost:3000"),
        { method: "POST" }
      );
      this.lastResponse = await POST(request, {
        params: Promise.resolve({ id: videoId }),
      });
      this.lastBody = await this.lastResponse.json();
    },
    unlikeVideo: async (videoId: string) => {
      const request = new NextRequest(
        new URL(`/api/videos/${videoId}/like`, "http://localhost:3000"),
        { method: "DELETE" }
      );
      this.lastResponse = await DELETE(request, {
        params: Promise.resolve({ id: videoId }),
      });
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    likeVideoMock: () => mockLikeVideo,
    unlikeVideoMock: () => mockUnlikeVideo,
    getVideoLikersMock: () => mockGetVideoLikers,
    sendToUserMock: () => mockSendToUser,
  };
}
