import { CloudflareVideoService } from "@/lib/adapters/cloudflare-video-service";
import type { VideoService } from "@/lib/ports/video-service";
import crypto from "node:crypto";
import sinon from "sinon";
import { StubbedInstanceCreator } from "ts-stubber";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock environment variables
vi.stubEnv("CF_ACCOUNT_ID", "test-account-id");
vi.stubEnv("CF_STREAM_TOKEN", "test-api-token");
vi.stubEnv("CF_STREAM_CUSTOMER_SUBDOMAIN", "test-customer-subdomain");

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("CloudflareVideoService", () => {
  let service: CloudflareVideoService;

  beforeEach(() => {
    service = new CloudflareVideoService();
    mockFetch.mockReset();
  });

  describe("given a valid Cloudflare configuration", () => {
    describe("when creating an upload URL", () => {
      it("then it should call Cloudflare API with correct parameters", async () => {
        // given
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              result: {
                uploadURL: "https://upload.cloudflarestream.com/abc123",
                uid: "video-uid-123",
              },
            }),
        });

        // when
        const result = await service.createUploadUrl("user-123");

        // then
        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.cloudflare.com/client/v4/accounts/test-account-id/stream/direct_upload",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer test-api-token",
            }),
          })
        );
        expect(result.uploadUrl).toBe("https://upload.cloudflarestream.com/abc123");
        expect(result.assetId).toBe("video-uid-123");
      });

      it("then it should include userId in metadata", async () => {
        // given
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              result: { uploadURL: "https://test.com", uid: "uid-123" },
            }),
        });

        // when
        await service.createUploadUrl("user-456");

        // then
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.meta.userId).toBe("user-456");
        expect(callBody.maxDurationSeconds).toBe(60);
      });
    });

    describe("when the API returns an error", () => {
      it("then it should throw a descriptive error", async () => {
        // given
        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: "Unauthorized",
        });

        // when / then
        await expect(service.createUploadUrl("user-123")).rejects.toThrow(
          "Cloudflare Stream error: Unauthorized"
        );
      });
    });

    describe("when getting a playback URL", () => {
      it("then it should return correct HLS URL format", () => {
        // when
        const url = service.getPlaybackUrl("video-abc123");

        // then
        expect(url).toBe(
          "https://customer-test-customer-subdomain.cloudflarestream.com/video-abc123/manifest/video.m3u8"
        );
      });
    });

    describe("when deleting a video", () => {
      it("then it should call Cloudflare delete API", async () => {
        // given
        mockFetch.mockResolvedValueOnce({ ok: true });

        // when
        await service.deleteVideo("video-abc123");

        // then
        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.cloudflare.com/client/v4/accounts/test-account-id/stream/video-abc123",
          expect.objectContaining({
            method: "DELETE",
          })
        );
      });
    });
  });
});

describe("CloudflareVideoService.parseWebhook", () => {
  let service: CloudflareVideoService;

  beforeEach(() => {
    service = new CloudflareVideoService();
  });

  describe("given an empty body", () => {
    it("then it should return verification with empty challenge", () => {
      expect(service.parseWebhook("")).toEqual({ type: "verification", challenge: "" });
    });

    it("then it should handle whitespace-only body", () => {
      expect(service.parseWebhook("   ")).toEqual({
        type: "verification",
        challenge: "",
      });
    });
  });

  describe("given a non-JSON body", () => {
    it("then it should return verification with the body as challenge", () => {
      const plainText = "some-challenge-token";
      expect(service.parseWebhook(plainText)).toEqual({
        type: "verification",
        challenge: plainText,
      });
    });
  });

  describe("given a webhook_callback_verification payload", () => {
    it("then it should return verification with the challenge value", () => {
      const body = JSON.stringify({
        type: "webhook_callback_verification",
        challenge: "cf-challenge-123",
      });
      expect(service.parseWebhook(body)).toEqual({
        type: "verification",
        challenge: "cf-challenge-123",
      });
    });

    it("then it should handle missing challenge in verification payload", () => {
      const body = JSON.stringify({ type: "webhook_callback_verification" });
      expect(service.parseWebhook(body)).toEqual({
        type: "verification",
        challenge: "",
      });
    });
  });

  describe("given a payload with challenge field", () => {
    it("then it should return verification", () => {
      const body = JSON.stringify({ challenge: "direct-challenge" });
      expect(service.parseWebhook(body)).toEqual({
        type: "verification",
        challenge: "direct-challenge",
      });
    });
  });

  describe("given a readyToStream payload", () => {
    it("then it should return video_ready with assetId and duration", () => {
      const body = JSON.stringify({
        uid: "video-abc",
        readyToStream: true,
        duration: 42.5,
      });
      expect(service.parseWebhook(body)).toEqual({
        type: "video_ready",
        assetId: "video-abc",
        duration: 42.5,
      });
    });
  });

  describe("given a status.state ready payload", () => {
    it("then it should return video_ready", () => {
      const body = JSON.stringify({
        uid: "video-xyz",
        status: { state: "ready" },
        duration: 10,
      });
      expect(service.parseWebhook(body)).toEqual({
        type: "video_ready",
        assetId: "video-xyz",
        duration: 10,
      });
    });
  });

  describe("given a status.state error payload", () => {
    it("then it should return video_error with errorReason", () => {
      const body = JSON.stringify({
        uid: "video-err",
        status: { state: "error", errorReasonCode: "codec_unsupported" },
      });
      expect(service.parseWebhook(body)).toEqual({
        type: "video_error",
        assetId: "video-err",
        errorReason: "codec_unsupported",
      });
    });
  });

  describe("given an unrecognized JSON payload", () => {
    it("then it should return unknown with the uid", () => {
      const body = JSON.stringify({
        uid: "video-unknown",
        status: { state: "inprogress" },
      });
      expect(service.parseWebhook(body)).toEqual({
        type: "unknown",
        assetId: "video-unknown",
      });
    });
  });
});

describe("CloudflareVideoService.verifyWebhookSignature", () => {
  let service: CloudflareVideoService;

  beforeEach(() => {
    service = new CloudflareVideoService();
  });

  describe("given CF_WEBHOOK_SECRET is not set", () => {
    beforeEach(() => {
      vi.stubEnv("CF_WEBHOOK_SECRET", "");
    });

    it("then it should return true (skip verification in dev mode)", () => {
      expect(service.verifyWebhookSignature("body", "sig")).toBe(true);
    });
  });

  describe("given CF_WEBHOOK_SECRET is set", () => {
    const secret = "test-webhook-secret";

    beforeEach(() => {
      vi.stubEnv("CF_WEBHOOK_SECRET", secret);
    });

    describe("when no signature header is provided", () => {
      it("then it should return false", () => {
        expect(service.verifyWebhookSignature("body", "")).toBe(false);
      });
    });

    describe("when signature header has invalid format (missing time)", () => {
      it("then it should return false", () => {
        expect(service.verifyWebhookSignature("body", "sig1=abc123")).toBe(false);
      });
    });

    describe("when signature header has invalid format (missing sig1)", () => {
      it("then it should return false", () => {
        expect(service.verifyWebhookSignature("body", "time=123456")).toBe(false);
      });
    });

    describe("when timestamp is too old (replay attack)", () => {
      it("then it should return false", () => {
        const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
        const sig = crypto
          .createHmac("sha256", secret)
          .update(`${oldTimestamp}.body`)
          .digest("hex");
        expect(
          service.verifyWebhookSignature("body", `time=${oldTimestamp},sig1=${sig}`)
        ).toBe(false);
      });
    });

    describe("when signature is valid", () => {
      it("then it should return true", () => {
        const timestamp = Math.floor(Date.now() / 1000);
        const body = '{"uid":"video-123","readyToStream":true}';
        const sig = crypto
          .createHmac("sha256", secret)
          .update(`${timestamp}.${body}`)
          .digest("hex");
        expect(
          service.verifyWebhookSignature(body, `time=${timestamp},sig1=${sig}`)
        ).toBe(true);
      });
    });

    describe("when signature does not match", () => {
      it("then it should return false", () => {
        const timestamp = Math.floor(Date.now() / 1000);
        const wrongSig = crypto
          .createHmac("sha256", secret)
          .update(`${timestamp}.wrong-body`)
          .digest("hex");
        expect(
          service.verifyWebhookSignature(
            "actual-body",
            `time=${timestamp},sig1=${wrongSig}`
          )
        ).toBe(false);
      });
    });
  });
});

describe("VideoService interface (stubbed with ts-stubber)", () => {
  let stubbedService: VideoService;

  beforeEach(() => {
    // given — create a lazy-stubbed instance using ts-stubber + sinon
    stubbedService = StubbedInstanceCreator<VideoService, sinon.SinonStub>(() =>
      sinon.stub()
    ).createStubbedInstance();
  });

  it("then stubbed createUploadUrl should be callable", async () => {
    // given
    const stub = stubbedService.createUploadUrl as sinon.SinonStub;
    stub.resolves({ uploadUrl: "https://stubbed.com", assetId: "stub-123" });

    // when
    const result = await stubbedService.createUploadUrl("user-1");

    // then
    expect(result.uploadUrl).toBe("https://stubbed.com");
    expect(result.assetId).toBe("stub-123");
    expect(stub.calledOnceWith("user-1")).toBe(true);
  });

  it("then stubbed getPlaybackUrl should be callable", () => {
    // given
    const stub = stubbedService.getPlaybackUrl as sinon.SinonStub;
    stub.returns("https://stubbed-playback.com/video.m3u8");

    // when
    const url = stubbedService.getPlaybackUrl("asset-1");

    // then
    expect(url).toBe("https://stubbed-playback.com/video.m3u8");
    expect(stub.calledOnceWith("asset-1")).toBe(true);
  });

  it("then stubbed deleteVideo should be callable", async () => {
    // given
    const stub = stubbedService.deleteVideo as sinon.SinonStub;
    stub.resolves();

    // when
    await stubbedService.deleteVideo("asset-1");

    // then
    expect(stub.calledOnceWith("asset-1")).toBe(true);
  });

  it("then stubbed verifyWebhookSignature should be callable", () => {
    // given
    const stub = stubbedService.verifyWebhookSignature as sinon.SinonStub;
    stub.returns(true);

    // when
    const result = stubbedService.verifyWebhookSignature("body", "sig");

    // then
    expect(result).toBe(true);
    expect(stub.calledOnceWith("body", "sig")).toBe(true);
  });
});
