import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { LikeDriver } from "./like.driver";

const chance = new Chance();

describe("POST /api/videos/[id]/like", () => {
  const driver = new LikeDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.likeVideo("video-1");
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    const userId = chance.guid();

    beforeEach(() => {
      given.authenticatedUser(userId);
    });

    describe("when the video does not exist", () => {
      beforeEach(async () => {
        given.videoNotFound();
        await when.likeVideo("nonexistent");
      });

      it("then it should return 404", () => {
        expect(get.status()).toBe(404);
      });

      it("then it should return Video not found error", () => {
        expect(get.body().error).toBe("Video not found");
      });
    });

    describe("when the video exists", () => {
      const videoId = chance.guid();

      beforeEach(async () => {
        given.video({ id: videoId });
        given.likeSucceeds();
        await when.likeVideo(videoId);
      });

      it("then it should return liked true", () => {
        expect(get.body().liked).toBe(true);
      });

      it("then it should call likeVideo with correct arguments", () => {
        expect(get.likeVideoMock()).toHaveBeenCalledWith(userId, videoId);
      });
    });

    describe("when the database throws an error", () => {
      const videoId = chance.guid();

      beforeEach(async () => {
        given.video({ id: videoId });
        given.likeFails(new Error("DB error"));
        await when.likeVideo(videoId);
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to like video");
      });
    });
  });
});

describe("DELETE /api/videos/[id]/like", () => {
  const driver = new LikeDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.unlikeVideo("video-1");
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    const userId = chance.guid();

    beforeEach(() => {
      given.authenticatedUser(userId);
    });

    describe("when unliking a video", () => {
      const videoId = chance.guid();

      beforeEach(async () => {
        given.unlikeSucceeds();
        await when.unlikeVideo(videoId);
      });

      it("then it should return liked false", () => {
        expect(get.body().liked).toBe(false);
      });

      it("then it should call unlikeVideo with correct arguments", () => {
        expect(get.unlikeVideoMock()).toHaveBeenCalledWith(userId, videoId);
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.unlikeFails(new Error("DB error"));
        await when.unlikeVideo(chance.guid());
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to unlike video");
      });
    });
  });
});
