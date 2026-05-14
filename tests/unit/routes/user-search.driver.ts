import { GET } from "@/app/api/users/search/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockSearchUsers = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    searchUsers: (...args: unknown[]) => mockSearchUsers(...args),
  },
}));

export class UserSearchDriver {
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
    searchReturns: (users: any[]) => {
      mockSearchUsers.mockResolvedValue(users);
    },
    searchFails: (error: Error) => {
      mockSearchUsers.mockRejectedValue(error);
    },
  };

  when = {
    search: async (query: string, limit?: number) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (limit !== undefined) params.set("limit", String(limit));
      const request = new NextRequest(
        new URL(`/api/users/search?${params.toString()}`, "http://localhost:3000"),
        { method: "GET" }
      );
      this.lastResponse = await GET(request);
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    searchUsersMock: () => mockSearchUsers,
  };
}
