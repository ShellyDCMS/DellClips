import { GET, POST } from "@/app/api/videos/[id]/comments/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

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

export class CommentsDriver {
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
    comments: (comments: any[]) => {
      mockGetCommentsByVideoId.mockResolvedValue(comments);
    },
    commentsFetchFails: (error: Error) => {
      mockGetCommentsByVideoId.mockRejectedValue(error);
    },
    video: (video: any) => {
      mockGetVideoById.mockResolvedValue(video);
    },
    videoNotFound: () => {
      mockGetVideoById.mockResolvedValue(null);
    },
    createComment: (result: any) => {
      mockCreateComment.mockResolvedValue(result);
    },
    createCommentFails: (error: Error) => {
      mockCreateComment.mockRejectedValue(error);
    },
  };

  when = {
    getComments: async (videoId: string) => {
      const request = new NextRequest(
        new URL(`/api/videos/${videoId}/comments`, "http://localhost:3000")
      );
      this.lastResponse = await GET(request, {
        params: Promise.resolve({ id: videoId }),
      });
      this.lastBody = await this.lastResponse.json();
    },
    postComment: async (videoId: string, body: Record<string, unknown>) => {
      const request = new NextRequest(
        new URL(`/api/videos/${videoId}/comments`, "http://localhost:3000"),
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );
      this.lastResponse = await POST(request, {
        params: Promise.resolve({ id: videoId }),
      });
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    getCommentsMock: () => mockGetCommentsByVideoId,
    createCommentMock: () => mockCreateComment,
  };
}
