import { DemoVideoService } from "@/lib/adapters/demo-video-service";
import { describe, expect, it, beforeEach, vi } from "vitest";

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
        const knownIds = [
          "demo-big-buck-bunny",
          "demo-sintel",
          "demo-tears-of-steel",
          "demo-elephant-dream",
          "demo-test-pattern",
        ];

        // when
        const result = await service.createUploadUrl("user-456");

        // then
        expect(knownIds).toContain(result.assetId);
      });
    });

    describe("when getting a playback URL for a known demo asset", () => {
      it("then it should return the matching HLS stream URL for big-buck-bunny", () => {
        // when
        const url = service.getPlaybackUrl("demo-big-buck-bunny");

        // then
        expect(url).toBe("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
      });

      it("then it should return the matching HLS stream URL for sintel", () => {
        // when
        const url = service.getPlaybackUrl("demo-sintel");

        // then
        expect(url).toBe(
          "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
        );
      });

      it("then it should return the matching HLS stream URL for tears-of-steel", () => {
        // when
        const url = service.getPlaybackUrl("demo-tears-of-steel");

        // then
        expect(url).toBe(
          "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8"
        );
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
        await expect(service.deleteVideo("demo-big-buck-bunny")).resolves.toBeUndefined();
      });
    });
  });
});
