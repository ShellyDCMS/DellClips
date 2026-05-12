import { DELETE, POST } from "@/app/api/push/subscribe/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockOnConflictDoNothing = vi.fn();
const mockDelete = vi.fn();
const mockWhere = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs);
          return {
            onConflictDoNothing: (...cArgs: unknown[]) =>
              mockOnConflictDoNothing(...cArgs),
          };
        },
      };
    },
    delete: (...args: unknown[]) => {
      mockDelete(...args);
      return {
        where: (...wArgs: unknown[]) => mockWhere(...wArgs),
      };
    },
  },
}));

vi.mock("@/drizzle/schema", () => ({
  pushSubscriptions: {
    userId: "userId",
    endpoint: "endpoint",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ _and: args }),
  eq: (a: unknown, b: unknown) => ({ _eq: [a, b] }),
}));

export class PushSubscribeDriver {
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
    insertSucceeds: () => {
      mockOnConflictDoNothing.mockResolvedValue(undefined);
    },
    insertFails: (error: Error) => {
      mockOnConflictDoNothing.mockRejectedValue(error);
    },
    deleteSucceeds: () => {
      mockWhere.mockResolvedValue(undefined);
    },
    deleteFails: (error: Error) => {
      mockWhere.mockRejectedValue(error);
    },
  };

  when = {
    subscribe: async (body: Record<string, unknown>) => {
      const request = new NextRequest(
        new URL("/api/push/subscribe", "http://localhost:3000"),
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );
      this.lastResponse = await POST(request);
      this.lastBody = await this.lastResponse.json();
    },
    unsubscribe: async (body: Record<string, unknown>) => {
      const request = new NextRequest(
        new URL("/api/push/subscribe", "http://localhost:3000"),
        {
          method: "DELETE",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );
      this.lastResponse = await DELETE(request);
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    valuesCallArgs: (i: number) => mockValues.mock.calls[i]?.[0],
    insertCallCount: () => mockInsert.mock.calls.length,
    deleteCallCount: () => mockDelete.mock.calls.length,
  };
}
