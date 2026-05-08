import { GET } from "@/app/api/admin/analytics/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockGetUserById = vi.fn();
vi.mock("@/lib/services", () => ({
  databaseService: {
    getUserById: (...args: unknown[]) => mockGetUserById(...args),
  },
}));

// Flexible chainable DB mock — every method returns a proxy that is also
// an awaitable array (thenable). The first `select().from()` call resolves
// to `dbResults[callIndex]`, which lets us feed different data per query.
let dbResults: any[][] = [];
let callIndex = 0;

function createChainProxy(): any {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === "then") {
        const result = dbResults[callIndex] ?? [];
        callIndex++;
        return (resolve: (v: any) => void) => resolve(result);
      }
      if (prop === "as") {
        return () => createChainProxy();
      }
      return () => createChainProxy();
    },
  };
  return new Proxy(() => createChainProxy(), handler);
}

vi.mock("@/lib/db", () => ({
  db: { select: () => createChainProxy() },
}));

vi.mock("@/drizzle/schema", () => ({
  analyticsEvents: {
    eventType: "eventType",
    createdAt: "createdAt",
    userId: "userId",
    videoId: "videoId",
    id: "id",
  },
  users: { id: "usersId", email: "email", name: "name" },
  videos: { id: "videosId", title: "title", status: "status" },
}));

vi.mock("drizzle-orm", () => ({
  count: vi.fn(() => "count"),
  desc: vi.fn((col: unknown) => col),
  eq: vi.fn((a: unknown, b: unknown) => [a, b]),
  gte: vi.fn((a: unknown, b: unknown) => [a, b]),
  sql: Object.assign(
    vi.fn((_strings: unknown, ..._values: unknown[]) => ({
      as: () => "sqlExpr",
    })),
    {}
  ),
}));

export class AdminAnalyticsDriver {
  private lastResponse: Response | null = null;
  private lastBody: any = null;

  beforeAndAfter = () => {
    beforeEach(() => {
      vi.clearAllMocks();
      callIndex = 0;
      dbResults = [];
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
    userWithRole: (userId: string, role: string) => {
      mockGetUserById.mockResolvedValue({ id: userId, role });
    },
    userNotFound: () => {
      mockGetUserById.mockResolvedValue(null);
    },
    dbQueryResults: (results: any[][]) => {
      dbResults = results;
    },
  };

  when = {
    getAnalytics: async (url: string = "/api/admin/analytics") => {
      const request = new NextRequest(new URL(url, "http://localhost:3000"));
      this.lastResponse = await GET(request);
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
  };
}
