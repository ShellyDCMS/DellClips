import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { UploadUrlDriver } from "./upload-url.driver";

const chance = new Chance();

describe("POST /api/video/upload-url", () => {
  const driver = new UploadUrlDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.createUploadUrl();
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });

    it("then it should return Unauthorized error", () => {
      expect(get.body().error).toBe("Unauthorized");
    });
  });

  describe("given an authenticated user", () => {
    const userId = chance.guid();

    beforeEach(() => {
      given.authenticatedUser(userId);
    });

    describe("when creating an upload URL succeeds", () => {
      const uploadUrl = chance.url();
      const assetId = chance.guid();

      beforeEach(async () => {
        given.uploadUrl({ uploadUrl, assetId });
        await when.createUploadUrl();
      });

      it("then it should return the upload URL", () => {
        expect(get.body().uploadUrl).toBe(uploadUrl);
      });

      it("then it should return the asset ID", () => {
        expect(get.body().assetId).toBe(assetId);
      });

      it("then it should pass the user ID to the video service", () => {
        expect(get.createUploadUrlMock()).toHaveBeenCalledWith(userId);
      });
    });

    describe("when the video service throws an error", () => {
      beforeEach(async () => {
        given.uploadUrlFails(new Error("Service error"));
        await when.createUploadUrl();
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to create upload URL");
      });
    });
  });
});
