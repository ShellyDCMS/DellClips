import type { VideoService } from "@/lib/ports/video-service";
import sinon from "sinon";
import { StubbedInstanceCreator } from "ts-stubber";
import { beforeEach, describe, expect, it } from "vitest";

describe("VideoService Port (interface contract via ts-stubber)", () => {
  let service: VideoService;

  beforeEach(() => {
    // given — lazy-stub the interface (no real implementation needed)
    service = new StubbedInstanceCreator<VideoService>(
      () => sinon.stub()
    ).createStubbedInstance();
  });

  describe("given a stubbed VideoService", () => {
    describe("when calling createUploadUrl", () => {
      it("then it should return uploadUrl and assetId", async () => {
        // given
        (service.createUploadUrl as sinon.SinonStub).resolves({
          uploadUrl: "https://upload.example.com/abc123",
          assetId: "asset-abc123",
        });

        // when
        const result = await service.createUploadUrl("user-123");

        // then
        expect(result).toHaveProperty("uploadUrl");
        expect(result).toHaveProperty("assetId");
        expect(typeof result.uploadUrl).toBe("string");
        expect(typeof result.assetId).toBe("string");
        expect(result.uploadUrl).toContain("https://");
      });
    });

    describe("when calling getPlaybackUrl", () => {
      it("then it should return a string URL", () => {
        // given
        (service.getPlaybackUrl as sinon.SinonStub).returns(
          "https://stream.example.com/asset-abc123/manifest/video.m3u8"
        );

        // when
        const url = service.getPlaybackUrl("asset-abc123");

        // then
        expect(typeof url).toBe("string");
        expect(url).toContain(".m3u8");
      });
    });

    describe("when calling deleteVideo", () => {
      it("then it should resolve without error", async () => {
        // given
        (service.deleteVideo as sinon.SinonStub).resolves(undefined);

        // when / then
        await expect(
          service.deleteVideo("asset-abc123")
        ).resolves.toBeUndefined();
      });
    });
  });
});