import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { VideoByIdDriver } from "./video-by-id.driver";

const chance = new Chance();

describe("GET /api/videos/[id]", () => {
  const driver = new VideoByIdDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.getVideo("video-1");
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

    describe("when the video exists", () => {
      const videoTitle = chance.sentence();
      const playbackUrl = chance.url();
      const videoId = chance.guid();

      beforeEach(async () => {
        given.video({
          id: videoId,
          title: videoTitle,
          videoPlaybackId: chance.guid(),
          author: { id: chance.guid(), name: chance.name() },
        });
        given.userLikedVideo(false);
        given.playbackUrl(playbackUrl);
        await when.getVideo(videoId);
      });

      it("then it should return the video title", () => {
        expect(get.body().title).toBe(videoTitle);
      });

      it("then it should return the playback URL", () => {
        expect(get.body().playbackUrl).toBe(playbackUrl);
      });

      it("then it should return the like status", () => {
        expect(get.body().hasLiked).toBe(false);
      });
    });

    describe("when the video does not exist", () => {
      beforeEach(async () => {
        given.videoNotFound();
        await when.getVideo("nonexistent");
      });

      it("then it should return 404", () => {
        expect(get.status()).toBe(404);
      });

      it("then it should return Video not found error", () => {
        expect(get.body().error).toBe("Video not found");
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.videoFetchFails(new Error("DB error"));
        await when.getVideo("video-1");
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to fetch video");
      });
    });
  });
});

describe("DELETE /api/videos/[id]", () => {
  const driver = new VideoByIdDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.deleteVideo("video-1");
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
        await when.deleteVideo("video-1");
      });

      it("then it should return 404", () => {
        expect(get.status()).toBe(404);
      });
    });

    describe("when the user is not the video owner", () => {
      const videoId = chance.guid();

      beforeEach(async () => {
        given.video({
          id: videoId,
          videoPlaybackId: chance.guid(),
          author: { id: chance.guid() },
        });
        await when.deleteVideo(videoId);
      });

      it("then it should return 403", () => {
        expect(get.status()).toBe(403);
      });

      it("then it should return Forbidden error", () => {
        expect(get.body().error).toBe("Forbidden");
      });
    });

    describe("when the user is the video owner", () => {
      const videoId = chance.guid();
      const playbackId = chance.guid();

      beforeEach(async () => {
        given.video({
          id: videoId,
          videoPlaybackId: playbackId,
          author: { id: userId },
        });
        given.deleteFromProviderSucceeds();
        given.deleteVideoSucceeds();
        await when.deleteVideo(videoId);
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should return deleted true", () => {
        expect(get.body().deleted).toBe(true);
      });

      it("then it should delete from provider", () => {
        expect(get.deleteFromProviderMock()).toHaveBeenCalledWith(playbackId);
      });

      it("then it should delete from database", () => {
        expect(get.deleteVideoMock()).toHaveBeenCalledWith(videoId);
      });

      it("then it should revalidate the feed path", () => {
        expect(get.revalidatePathMock()).toHaveBeenCalledWith("/feed");
      });
    });

    describe("when provider deletion fails", () => {
      const videoId = chance.guid();

      beforeEach(async () => {
        given.video({
          id: videoId,
          videoPlaybackId: chance.guid(),
          author: { id: userId },
        });
        given.deleteFromProviderFails(new Error("Provider error"));
        given.deleteVideoSucceeds();
        await when.deleteVideo(videoId);
      });

      it("then it should still return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should still delete from database", () => {
        expect(get.deleteVideoMock()).toHaveBeenCalledWith(videoId);
      });
    });
  });
});
