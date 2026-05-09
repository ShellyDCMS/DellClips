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

        expect(url).toBe(`https://drive.google.com/file/d/${fileId}/preview`);
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

    describe("when parsing a webhook with empty body", () => {
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

    describe("when parsing a webhook with non-JSON body", () => {
      it("then it should return verification with the body as challenge", () => {
        const plainText = chance.word();
        expect(service.parseWebhook(plainText)).toEqual({
          type: "verification",
          challenge: plainText,
        });
      });
    });

    describe("when parsing a webhook with a challenge JSON payload", () => {
      it("then it should return verification with the challenge value", () => {
        const challenge = chance.hash();
        const body = JSON.stringify({ challenge });
        expect(service.parseWebhook(body)).toEqual({
          type: "verification",
          challenge,
        });
      });
    });

    describe("when parsing a webhook with an unrecognized JSON payload", () => {
      it("then it should return unknown", () => {
        const body = JSON.stringify({ data: chance.word() });
        expect(service.parseWebhook(body)).toEqual({ type: "unknown" });
      });
    });

    describe("when verifying a webhook signature", () => {
      it("then it should always return true (gdrive adapter)", () => {
        expect(service.verifyWebhookSignature(chance.sentence(), chance.hash())).toBe(
          true
        );
      });

      it("then it should return true even with empty arguments", () => {
        expect(service.verifyWebhookSignature("", "")).toBe(true);
      });
    });
  });
});
