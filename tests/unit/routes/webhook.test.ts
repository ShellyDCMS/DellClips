import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock database service
const mockUpdateVideoStatus = vi.fn();
vi.mock("@/lib/services", () => ({
  databaseService: {
    updateVideoStatus: (...args: unknown[]) => mockUpdateVideoStatus(...args),
  },
}));

import { POST, HEAD } from "@/app/api/video/webhook/route";
import { NextRequest } from "next/server";

function createWebhookRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL("/api/video/webhook", "http://localhost:3000"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/video/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given a webhook payload without uid", () => {
    it("then it should return 400", async () => {
      // when
      const response = await POST(createWebhookRequest({}));

      // then
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Missing uid");
    });
  });

  describe("given a webhook payload with readyToStream true", () => {
    it("then it should update video status to ready", async () => {
      // given
      mockUpdateVideoStatus.mockResolvedValue(undefined);

      // when
      const response = await POST(
        createWebhookRequest({
          uid: "video-123",
          readyToStream: true,
          duration: 45.5,
        })
      );

      // then
      expect(mockUpdateVideoStatus).toHaveBeenCalledWith("video-123", "ready", 45.5);
      const body = await response.json();
      expect(body.status).toBe("ready");
    });

    it("then it should handle missing duration", async () => {
      // given
      mockUpdateVideoStatus.mockResolvedValue(undefined);

      // when
      await POST(
        createWebhookRequest({
          uid: "video-456",
          readyToStream: true,
        })
      );

      // then
      expect(mockUpdateVideoStatus).toHaveBeenCalledWith("video-456", "ready", undefined);
    });
  });

  describe("given a webhook payload with status.state ready", () => {
    it("then it should update video status to ready", async () => {
      // given
      mockUpdateVideoStatus.mockResolvedValue(undefined);

      // when
      const response = await POST(
        createWebhookRequest({
          uid: "video-789",
          status: { state: "ready" },
          duration: 30,
        })
      );

      // then
      expect(mockUpdateVideoStatus).toHaveBeenCalledWith("video-789", "ready", 30);
      const body = await response.json();
      expect(body.status).toBe("ready");
    });
  });

  describe("given a webhook payload with status.state error", () => {
    it("then it should update video status to errored", async () => {
      // given
      mockUpdateVideoStatus.mockResolvedValue(undefined);

      // when
      const response = await POST(
        createWebhookRequest({
          uid: "video-error",
          status: { state: "error", errorReasonCode: "codec_unsupported" },
        })
      );

      // then
      expect(mockUpdateVideoStatus).toHaveBeenCalledWith("video-error", "errored");
      const body = await response.json();
      expect(body.status).toBe("errored");
    });
  });

  describe("given a webhook payload with an unrecognized status", () => {
    it("then it should acknowledge without updating", async () => {
      // when
      const response = await POST(
        createWebhookRequest({
          uid: "video-progress",
          status: { state: "inprogress" },
        })
      );

      // then
      expect(mockUpdateVideoStatus).not.toHaveBeenCalled();
      const body = await response.json();
      expect(body.status).toBe("acknowledged");
    });
  });

  describe("given the database throws an error", () => {
    it("then it should return 500", async () => {
      // given
      mockUpdateVideoStatus.mockRejectedValue(new Error("DB error"));

      // when
      const response = await POST(
        createWebhookRequest({
          uid: "video-123",
          readyToStream: true,
        })
      );

      // then
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Webhook processing failed");
    });
  });
});

describe("HEAD /api/video/webhook", () => {
  it("then it should return 200", async () => {
    // when
    const response = await HEAD();

    // then
    expect(response.status).toBe(200);
  });
});
