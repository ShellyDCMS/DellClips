import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { SearchDriver } from "./search.driver";

const chance = new Chance();

describe("GET /api/videos/search", () => {
  const driver = new SearchDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.search("/api/videos/search?q=test");
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

    describe("when neither q nor hashtag parameter is provided", () => {
      beforeEach(async () => {
        await when.search("/api/videos/search");
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });

      it("then it should return parameter error", () => {
        expect(get.body().error).toBe("Provide 'q' or 'hashtag' parameter");
      });
    });

    describe("when searching by hashtag", () => {
      beforeEach(async () => {
        given.hashtagVideos([]);
        await when.search("/api/videos/search?hashtag=delltech");
      });

      it("then it should call getVideosByHashtag", () => {
        expect(get.getVideosByHashtagMock()).toHaveBeenCalledWith("delltech", 20, 0);
      });
    });

    describe("when searching by hashtag with custom limit and offset", () => {
      beforeEach(async () => {
        given.hashtagVideos([]);
        await when.search("/api/videos/search?hashtag=demo&limit=5&offset=10");
      });

      it("then it should respect custom limit and offset", () => {
        expect(get.getVideosByHashtagMock()).toHaveBeenCalledWith("demo", 5, 10);
      });
    });

    describe("when searching by hashtag with limit exceeding 50", () => {
      beforeEach(async () => {
        given.hashtagVideos([]);
        await when.search("/api/videos/search?hashtag=demo&limit=100");
      });

      it("then it should cap the limit at 50", () => {
        expect(get.getVideosByHashtagMock()).toHaveBeenCalledWith("demo", 50, 0);
      });
    });

    describe("when hashtag search returns videos", () => {
      const playbackUrl = chance.url();

      beforeEach(async () => {
        given.hashtagVideos([
          {
            id: chance.guid(),
            videoPlaybackId: chance.guid(),
            title: chance.sentence(),
          },
        ]);
        given.playbackUrl(playbackUrl);
        await when.search("/api/videos/search?hashtag=delltech");
      });

      it("then it should enrich videos with playback URLs", () => {
        expect(get.body().videos[0].playbackUrl).toBe(playbackUrl);
      });
    });

    describe("when searching by query", () => {
      beforeEach(async () => {
        given.searchResults([]);
        await when.search("/api/videos/search?q=engineering");
      });

      it("then it should call searchVideos", () => {
        expect(get.searchVideosMock()).toHaveBeenCalledWith({
          query: "engineering",
          limit: 20,
          offset: 0,
        });
      });
    });

    describe("when searching by query with limit exceeding 50", () => {
      beforeEach(async () => {
        given.searchResults([]);
        await when.search("/api/videos/search?q=test&limit=200");
      });

      it("then it should cap the limit at 50", () => {
        expect(get.searchVideosMock()).toHaveBeenCalledWith({
          query: "test",
          limit: 50,
          offset: 0,
        });
      });
    });

    describe("when both hashtag and q are provided", () => {
      beforeEach(async () => {
        given.hashtagVideos([]);
        await when.search("/api/videos/search?hashtag=demo&q=engineering");
      });

      it("then it should prioritize hashtag over q", () => {
        expect(get.getVideosByHashtagMock()).toHaveBeenCalled();
      });

      it("then it should not call searchVideos", () => {
        expect(get.searchVideosMock()).not.toHaveBeenCalled();
      });
    });

    describe("when results equal the limit", () => {
      beforeEach(async () => {
        given.searchResults(
          Array.from({ length: 20 }, (_, i) => ({
            id: `video-${i}`,
            videoPlaybackId: `playback-${i}`,
          }))
        );
        given.playbackUrl(chance.url());
        await when.search("/api/videos/search?q=test");
      });

      it("then hasMore should be true", () => {
        expect(get.body().hasMore).toBe(true);
      });
    });

    describe("when results are fewer than the limit", () => {
      beforeEach(async () => {
        given.searchResults([{ id: chance.guid(), videoPlaybackId: chance.guid() }]);
        given.playbackUrl(chance.url());
        await when.search("/api/videos/search?q=test");
      });

      it("then hasMore should be false", () => {
        expect(get.body().hasMore).toBe(false);
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.searchFails(new Error("DB error"));
        await when.search("/api/videos/search?q=test");
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to search videos");
      });
    });
  });
});
