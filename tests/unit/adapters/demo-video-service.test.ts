import { DemoVideoService } from "@/lib/adapters/demo-video-service";
import { beforeEach, describe, expect, it } from "vitest";

describe("DemoVideoService", () => {
  let service: DemoVideoService;

  beforeEach(() => {
    service = new DemoVideoService();
  });

  describe("given a DemoVideoService instance", () => {
    describe("when creating an upload URL", () => {
      it("then it should return a fake upload URL", async () => {
        // when
        const result = await service.createUploadUrl("user-123");

        // then
        expect(result.uploadUrl).toBe("https://demo.upload.example.com/not-real");
      });

      it("then it should return a demo asset ID", async () => {
        // when
        const result = await service.createUploadUrl("user-123");

        // then
        expect(result.assetId).toMatch(/^demo-/);
      });

      it("then it should return one of the known demo video IDs", async () => {
        // given
        const knownIds = ["demo-1", "demo-2", "demo-3", "demo-4", "demo-5"];

        // when
        const result = await service.createUploadUrl("user-456");

        // then
        expect(knownIds).toContain(result.assetId);
      });
    });

    describe("when getting a playback URL for a known demo asset", () => {
      it("then it should return the Mux HLS stream URL for demo-1", () => {
        // when
        const url = service.getPlaybackUrl("demo-1");

        // then
        expect(url).toBe("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
      });

      it("then it should return the Mux HLS stream URL for demo-3", () => {
        // when
        const url = service.getPlaybackUrl("demo-3");

        // then
        expect(url).toBe("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
      });
    });

    describe("when getting a playback URL for an unknown asset", () => {
      it("then it should fallback to the first demo video URL", () => {
        // when
        const url = service.getPlaybackUrl("unknown-asset-id");

        // then
        expect(url).toBe("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
      });
    });

    describe("when deleting a video", () => {
      it("then it should resolve without error (no-op)", async () => {
        // when / then
        await expect(service.deleteVideo("demo-1")).resolves.toBeUndefined();
      });
    });
  });
});
