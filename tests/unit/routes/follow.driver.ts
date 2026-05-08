import { DELETE, POST } from "@/app/api/users/[id]/follow/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockGetUserById = vi.fn();
const mockFollowUser = vi.fn();
const mockUnfollowUser = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getUserById: (...args: unknown[]) => mockGetUserById(...args),
    followUser: (...args: unknown[]) => mockFollowUser(...args),
    unfollowUser: (...args: unknown[]) => mockUnfollowUser(...args),
  },
}));

export class FollowDriver {
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
    targetUser: (user: any) => {
      mockGetUserById.mockResolvedValue(user);
    },
    targetUserNotFound: () => {
      mockGetUserById.mockResolvedValue(null);
    },
    followSucceeds: () => {
      mockFollowUser.mockResolvedValue(undefined);
    },
    followFails: (error: Error) => {
      mockFollowUser.mockRejectedValue(error);
    },
    unfollowSucceeds: () => {
      mockUnfollowUser.mockResolvedValue(undefined);
    },
    unfollowFails: (error: Error) => {
      mockUnfollowUser.mockRejectedValue(error);
    },
  };

  when = {
    follow: async (targetId: string) => {
      const request = new NextRequest(
        new URL(`/api/users/${targetId}/follow`, "http://localhost:3000"),
        { method: "POST" }
      );
      this.lastResponse = await POST(request, {
        params: Promise.resolve({ id: targetId }),
      });
      this.lastBody = await this.lastResponse.json();
    },
    unfollow: async (targetId: string) => {
      const request = new NextRequest(
        new URL(`/api/users/${targetId}/follow`, "http://localhost:3000"),
        { method: "DELETE" }
      );
      this.lastResponse = await DELETE(request, {
        params: Promise.resolve({ id: targetId }),
      });
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    followUserMock: () => mockFollowUser,
    unfollowUserMock: () => mockUnfollowUser,
  };
}
