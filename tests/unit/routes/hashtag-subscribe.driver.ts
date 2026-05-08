import { DELETE, POST } from "@/app/api/hashtags/[name]/subscribe/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockSubscribeToHashtag = vi.fn();
const mockUnsubscribeFromHashtag = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    subscribeToHashtag: (...args: unknown[]) => mockSubscribeToHashtag(...args),
    unsubscribeFromHashtag: (...args: unknown[]) => mockUnsubscribeFromHashtag(...args),
  },
}));

export class HashtagSubscribeDriver {
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
    subscribeSucceeds: () => {
      mockSubscribeToHashtag.mockResolvedValue(undefined);
    },
    subscribeFails: (error: Error) => {
      mockSubscribeToHashtag.mockRejectedValue(error);
    },
    unsubscribeSucceeds: () => {
      mockUnsubscribeFromHashtag.mockResolvedValue(undefined);
    },
    unsubscribeFails: (error: Error) => {
      mockUnsubscribeFromHashtag.mockRejectedValue(error);
    },
  };

  when = {
    subscribe: async (name: string) => {
      const request = new NextRequest(
        new URL(`/api/hashtags/${name}/subscribe`, "http://localhost:3000"),
        { method: "POST" }
      );
      this.lastResponse = await POST(request, {
        params: Promise.resolve({ name }),
      });
      this.lastBody = await this.lastResponse.json();
    },
    unsubscribe: async (name: string) => {
      const request = new NextRequest(
        new URL(`/api/hashtags/${name}/subscribe`, "http://localhost:3000"),
        { method: "DELETE" }
      );
      this.lastResponse = await DELETE(request, {
        params: Promise.resolve({ name }),
      });
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    subscribeMock: () => mockSubscribeToHashtag,
    unsubscribeMock: () => mockUnsubscribeFromHashtag,
  };
}
