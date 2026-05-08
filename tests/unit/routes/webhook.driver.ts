import { HEAD, POST } from "@/app/api/video/webhook/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockUpdateVideoStatus = vi.fn();
vi.mock("@/lib/services", () => ({
  databaseService: {
    updateVideoStatus: (...args: unknown[]) => mockUpdateVideoStatus(...args),
  },
}));

export class WebhookDriver {
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
    updateVideoStatusSucceeds: () => {
      mockUpdateVideoStatus.mockResolvedValue(undefined);
    },
    updateVideoStatusFails: (error: Error) => {
      mockUpdateVideoStatus.mockRejectedValue(error);
    },
  };

  when = {
    postWebhook: async (body: Record<string, unknown>) => {
      const request = new NextRequest(
        new URL("/api/video/webhook", "http://localhost:3000"),
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );
      this.lastResponse = await POST(request);
      this.lastBody = await this.lastResponse.json();
    },
    head: async () => {
      this.lastResponse = await HEAD();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    updateVideoStatusMock: () => mockUpdateVideoStatus,
  };
}
