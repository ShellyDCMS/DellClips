import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { HashtagsDriver } from "./hashtags.driver";

const chance = new Chance();

describe("GET /api/hashtags", () => {
  const driver = new HashtagsDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.getHashtags();
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

    describe("when requesting with default limit", () => {
      beforeEach(async () => {
        given.trendingHashtags([]);
        await when.getHashtags();
      });

      it("then it should call getTrendingHashtags with limit 10", () => {
        expect(get.getTrendingHashtagsMock()).toHaveBeenCalledWith(10);
      });
    });

    describe("when requesting and hashtags exist", () => {
      const mockHashtags = [
        { name: chance.word(), count: chance.integer({ min: 1, max: 100 }) },
        { name: chance.word(), count: chance.integer({ min: 1, max: 100 }) },
      ];

      beforeEach(async () => {
        given.trendingHashtags(mockHashtags);
        await when.getHashtags();
      });

      it("then it should return hashtags", () => {
        expect(get.body().hashtags).toEqual(mockHashtags);
      });
    });

    describe("when requesting with a custom limit", () => {
      beforeEach(async () => {
        given.trendingHashtags([]);
        await when.getHashtags("/api/hashtags?limit=5");
      });

      it("then it should respect the limit parameter", () => {
        expect(get.getTrendingHashtagsMock()).toHaveBeenCalledWith(5);
      });
    });

    describe("when requesting with a limit exceeding 50", () => {
      beforeEach(async () => {
        given.trendingHashtags([]);
        await when.getHashtags("/api/hashtags?limit=100");
      });

      it("then it should cap the limit at 50", () => {
        expect(get.getTrendingHashtagsMock()).toHaveBeenCalledWith(50);
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.trendingHashtagsFail(new Error("DB error"));
        await when.getHashtags();
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to fetch hashtags");
      });
    });
  });
});
