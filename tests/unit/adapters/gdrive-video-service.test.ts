import { GDriveVideoService } from "@/lib/adapters/gdrive-video-service";
import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";

const chance = new Chance();

describe("GDriveVideoService", () => {
  let service: GDriveVideoService;

  beforeEach(() => {
    service = new GDriveVideoService();
  });

  describe("given a GDriveVideoService instance", () => {
    describe("when creating an upload URL", () => {
      it("then it should return a manual upload URL", async () => {
        const result = await service.createUploadUrl(chance.guid());

        expect(result.uploadUrl).toBe("https://drive.google.com/upload-manually");
      });

      it("then it should return an asset ID with manual-upload prefix", async () => {
        const result = await service.createUploadUrl(chance.guid());

        expect(result.assetId).toMatch(/^manual-upload-/);
      });

      it("then it should return an asset ID containing a timestamp", async () => {
        const before = Date.now();
        const result = await service.createUploadUrl(chance.guid());
        const after = Date.now();

        const timestamp = parseInt(result.assetId.replace("manual-upload-", ""), 10);
        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(after);
      });
    });

    describe("when getting a playback URL for a gdrive asset", () => {
      const fileId = chance.guid();

      it("then it should return a Google Drive direct download URL", () => {
        const url = service.getPlaybackUrl(`gdrive-${fileId}`);

        expect(url).toBe(`https://drive.google.com/uc?export=download&id=${fileId}`);
      });

      it("then it should strip the gdrive- prefix from the file ID", () => {
        const url = service.getPlaybackUrl(`gdrive-${fileId}`);

        expect(url).toContain(fileId);
        expect(url).not.toContain("gdrive-");
      });
    });

    describe("when getting a playback URL for a non-gdrive asset", () => {
      it("then it should fallback to the Mux test stream", () => {
        const url = service.getPlaybackUrl(chance.word());

        expect(url).toBe("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
      });
    });

    describe("when deleting a video", () => {
      it("then it should resolve without error (no-op)", async () => {
        await expect(
          service.deleteVideo(`gdrive-${chance.guid()}`)
        ).resolves.toBeUndefined();
      });
    });
  });
});
