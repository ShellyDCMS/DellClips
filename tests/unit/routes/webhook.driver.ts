import { GET, HEAD, POST } from "@/app/api/video/webhook/route";
import type { WebhookResult } from "@/lib/ports/video-service";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockUpdateVideoStatus = vi.fn();
const mockParseWebhook = vi.fn();
const mockVerifyWebhookSignature = vi.fn();
vi.mock("@/lib/services", () => ({
  databaseService: {
    updateVideoStatus: (...args: unknown[]) => mockUpdateVideoStatus(...args),
  },
  videoService: {
    parseWebhook: (...args: unknown[]) => mockParseWebhook(...args),
    verifyWebhookSignature: (...args: unknown[]) => mockVerifyWebhookSignature(...args),
  },
}));

export class WebhookDriver {
  private lastResponse: Response | null = null;
  private lastBody: any = null;
  private lastText: string | null = null;

  beforeAndAfter = () => {
    beforeEach(() => {
      vi.clearAllMocks();
      this.lastResponse = null;
      this.lastBody = null;
      this.lastText = null;
    });
  };

  given = {
    updateVideoStatusSucceeds: () => {
      mockUpdateVideoStatus.mockResolvedValue(undefined);
    },
    updateVideoStatusFails: (error: Error) => {
      mockUpdateVideoStatus.mockRejectedValue(error);
    },
    parseWebhookReturns: (result: WebhookResult) => {
      mockParseWebhook.mockReturnValue(result);
    },
    signatureValid: () => {
      mockVerifyWebhookSignature.mockReturnValue(true);
    },
    signatureInvalid: () => {
      mockVerifyWebhookSignature.mockReturnValue(false);
    },
  };

  when = {
    postWebhook: async (body: string = "", signatureHeader: string = "sig") => {
      const request = new NextRequest(
        new URL("/api/video/webhook", "http://localhost:3000"),
        {
          method: "POST",
          body,
          headers: { "Webhook-Signature": signatureHeader },
        }
      );
      this.lastResponse = await POST(request);
      const contentType = this.lastResponse.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        this.lastBody = await this.lastResponse.json();
      } else {
        this.lastText = await this.lastResponse.text();
      }
    },
    head: async () => {
      this.lastResponse = await HEAD();
    },
    getHealth: async () => {
      this.lastResponse = await GET();
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    text: () => this.lastText,
    updateVideoStatusMock: () => mockUpdateVideoStatus,
    parseWebhookMock: () => mockParseWebhook,
    verifyWebhookSignatureMock: () => mockVerifyWebhookSignature,
    revalidatePathMock: () => mockRevalidatePath,
  };
}
