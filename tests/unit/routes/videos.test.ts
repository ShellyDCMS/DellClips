import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { VideosDriver } from "./videos.driver";

const chance = new Chance();

describe("GET /api/videos", () => {
  const driver = new VideosDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.getVideos();
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

    describe("when requesting the video feed with defaults", () => {
      beforeEach(async () => {
        given.videoFeed([]);
        await when.getVideos();
      });

      it("then it should call getVideoFeed with default limit and offset", () => {
        expect(get.getVideoFeedMock()).toHaveBeenCalledWith({
          userId,
          limit: 20,
          offset: 0,
        });
      });
    });

    describe("when requesting with custom limit and offset", () => {
      beforeEach(async () => {
        given.videoFeed([]);
        await when.getVideos("/api/videos?limit=10&offset=5");
      });

      it("then it should respect the parameters", () => {
        expect(get.getVideoFeedMock()).toHaveBeenCalledWith({
          userId,
          limit: 10,
          offset: 5,
        });
      });
    });

    describe("when requesting with limit exceeding 50", () => {
      beforeEach(async () => {
        given.videoFeed([]);
        await when.getVideos("/api/videos?limit=100");
      });

      it("then it should cap the limit at 50", () => {
        expect(get.getVideoFeedMock()).toHaveBeenCalledWith({
          userId,
          limit: 50,
          offset: 0,
        });
      });
    });

    describe("when videos are returned", () => {
      const playbackUrl = chance.url();

      beforeEach(async () => {
        given.videoFeed([
          {
            id: chance.guid(),
            title: chance.sentence(),
            videoPlaybackId: chance.guid(),
            status: "ready",
            author: { id: chance.guid(), name: chance.name() },
          },
        ]);
        given.userLikedVideo(true);
        given.isFollowing(true);
        given.playbackUrl(playbackUrl);
        await when.getVideos();
      });

      it("then it should enrich videos with playback URLs", () => {
        expect(get.body().videos[0].playbackUrl).toBe(playbackUrl);
      });

      it("then it should enrich videos with like status", () => {
        expect(get.body().videos[0].hasLiked).toBe(true);
      });

      it("then it should enrich videos with follow status", () => {
        expect(get.body().videos[0].isFollowingAuthor).toBe(true);
      });
    });

    describe("when the video author is the current user", () => {
      beforeEach(async () => {
        given.videoFeed([
          {
            id: chance.guid(),
            title: chance.sentence(),
            videoPlaybackId: chance.guid(),
            status: "ready",
            author: { id: userId, name: chance.name() },
          },
        ]);
        given.userLikedVideo(false);
        given.playbackUrl(chance.url());
        await when.getVideos();
      });

      it("then isFollowingAuthor should be false", () => {
        expect(get.body().videos[0].isFollowingAuthor).toBe(false);
      });

      it("then isFollowing should not have been called", () => {
        expect(get.isFollowingMock()).not.toHaveBeenCalled();
      });
    });

    describe("when results equal the limit", () => {
      beforeEach(async () => {
        given.videoFeed(
          Array.from({ length: 20 }, (_, i) => ({
            id: `video-${i}`,
            videoPlaybackId: `playback-${i}`,
            author: { id: chance.guid(), name: chance.name() },
          }))
        );
        given.userLikedVideo(false);
        given.isFollowing(false);
        given.playbackUrl(chance.url());
        await when.getVideos();
      });

      it("then hasMore should be true", () => {
        expect(get.body().hasMore).toBe(true);
      });
    });

    describe("when results are fewer than limit", () => {
      beforeEach(async () => {
        given.videoFeed([
          {
            id: chance.guid(),
            videoPlaybackId: chance.guid(),
            author: { id: chance.guid(), name: chance.name() },
          },
        ]);
        given.userLikedVideo(false);
        given.isFollowing(false);
        given.playbackUrl(chance.url());
        await when.getVideos();
      });

      it("then hasMore should be false", () => {
        expect(get.body().hasMore).toBe(false);
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.videoFeedFails(new Error("DB error"));
        await when.getVideos();
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to fetch videos");
      });
    });
  });
});

describe("POST /api/videos", () => {
  const driver = new VideosDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.postVideo({ videoAssetId: "a", videoPlaybackId: "b" });
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

    describe("when sending a valid request body", () => {
      const title = chance.sentence();
      const videoAssetId = chance.guid();
      const videoPlaybackId = chance.guid();
      const videoId = chance.guid();

      beforeEach(async () => {
        given.createVideoRecord({ id: videoId });
        await when.postVideo({
          title,
          videoAssetId,
          videoPlaybackId,
          hashtags: ["demo"],
        });
      });

      it("then it should return 201", () => {
        expect(get.status()).toBe(201);
      });

      it("then it should return the video id", () => {
        expect(get.body().video.id).toBe(videoId);
      });

      it("then it should pass the correct data to createVideoRecord", () => {
        expect(get.createVideoRecordMock()).toHaveBeenCalledWith({
          userId,
          title,
          description: undefined,
          videoAssetId,
          videoPlaybackId,
          videoUploadId: undefined,
          hashtags: ["demo"],
        });
      });
    });

    describe("when videoAssetId is missing", () => {
      beforeEach(async () => {
        await when.postVideo({ videoPlaybackId: chance.guid() });
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });

      it("then it should return Invalid request error", () => {
        expect(get.body().error).toBe("Invalid request");
      });
    });

    describe("when videoPlaybackId is missing", () => {
      beforeEach(async () => {
        await when.postVideo({ videoAssetId: chance.guid() });
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.createVideoRecordFails(new Error("DB error"));
        await when.postVideo({
          videoAssetId: chance.guid(),
          videoPlaybackId: chance.guid(),
        });
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to create video");
      });
    });
  });
});
