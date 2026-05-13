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
      const videoId = chance.guid();

      beforeEach(async () => {
        given.likeSucceeds();
        given.videoNotFound();
        await when.likeVideo(videoId);
      });

      it("then it should still return liked true", () => {
        expect(get.body().liked).toBe(true);
      });

      it("then it should not send a notification", () => {
        expect(get.sendToUserMock()).not.toHaveBeenCalled();
      });
    });

    describe("when the video exists and is owned by someone else", () => {
      const videoId = chance.guid();
      const authorId = chance.guid();
      const videoTitle = chance.sentence({ words: 3 });
      const likerName = chance.name();

      beforeEach(async () => {
        given.video({
          id: videoId,
          title: videoTitle,
          author: { id: authorId },
        });
        given.liker({ id: userId, name: likerName });
        given.likeSucceeds();
        given.notificationSendSucceeds();
        await when.likeVideo(videoId);
      });

      it("then it should return liked true", () => {
        expect(get.body().liked).toBe(true);
      });

      it("then it should call likeVideo with correct arguments", () => {
        expect(get.likeVideoMock()).toHaveBeenCalledWith(userId, videoId);
      });

      it("then it should notify the video author", () => {
        expect(get.sendToUserMock()).toHaveBeenCalledWith(
          authorId,
          expect.objectContaining({
            title: expect.stringContaining("Like"),
            body: expect.stringContaining(likerName),
            url: `/feed?video=${videoId}`,
            tag: `like-${videoId}`,
          })
        );
      });
    });

    describe("when the video is owned by the liker", () => {
      const videoId = chance.guid();

      beforeEach(async () => {
        given.video({ id: videoId, author: { id: userId } });
        given.likeSucceeds();
        await when.likeVideo(videoId);
      });

      it("then it should return 403", () => {
        expect(get.status()).toBe(403);
      });

      it("then it should return self-like error message", () => {
        expect(get.body().error).toBe("You cannot like your own video");
      });

      it("then it should not call likeVideo", () => {
        expect(get.likeVideoMock()).not.toHaveBeenCalled();
      });

      it("then it should not send a notification", () => {
        expect(get.sendToUserMock()).not.toHaveBeenCalled();
      });
    });

    describe("when the database throws an error", () => {
      const videoId = chance.guid();

      beforeEach(async () => {
        given.videoNotFound();
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
