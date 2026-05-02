import { CloudflareVideoService } from "@/lib/adapters/cloudflare-video-service";
import type { VideoService } from "@/lib/ports/video-service";
import sinon from "sinon";
import { StubbedInstanceCreator } from "ts-stubber";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock environment variables
vi.stubEnv("CF_ACCOUNT_ID", "test-account-id");
vi.stubEnv("CF_STREAM_TOKEN", "test-api-token");

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
          "https://customer-test-account-id.cloudflarestream.com/video-abc123/manifest/video.m3u8"
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

describe("VideoService interface (stubbed with ts-stubber)", () => {
  let stubbedService: VideoService;

  beforeEach(() => {
    // given — create a lazy-stubbed instance using ts-stubber + sinon
    stubbedService = StubbedInstanceCreator<VideoService, sinon.SinonStub>(
      () => sinon.stub(),
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
});
