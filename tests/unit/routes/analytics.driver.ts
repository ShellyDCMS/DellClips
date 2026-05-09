import { POST } from "@/app/api/analytics/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockInsert = vi.fn();
const mockValues = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: (...vArgs: unknown[]) => mockValues(...vArgs) };
    },
  },
}));

vi.mock("@/drizzle/schema", () => ({
  analyticsEvents: "analyticsEvents",
}));

export class AnalyticsDriver {
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
      mockValues.mockResolvedValue(undefined);
    },
    insertFails: (error: Error) => {
      mockValues.mockRejectedValue(error);
    },
    insertFailsThenSucceeds: (error: Error) => {
      mockValues.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    },
  };

  when = {
    postEvent: async (body: Record<string, unknown>) => {
      const request = new NextRequest(
        new URL("/api/analytics", "http://localhost:3000"),
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );
      this.lastResponse = await POST(request);
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    insertMock: () => mockInsert,
    valuesMock: () => mockValues,
    valuesCallArgs: (callIndex: number) => mockValues.mock.calls[callIndex]?.[0],
    valuesCallCount: () => mockValues.mock.calls.length,
  };
}
