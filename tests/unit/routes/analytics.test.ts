import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { AnalyticsDriver } from "./analytics.driver";

const chance = new Chance();

describe("POST /api/analytics", () => {
  const driver = new AnalyticsDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    const eventType = "page_view";

    beforeEach(async () => {
      given.unauthenticated();
      given.insertSucceeds();
      await when.postEvent({ eventType });
    });

    it("then it should still return 200 (analytics allows anonymous)", () => {
      expect(get.status()).toBe(200);
    });

    it("then it should return tracked true", () => {
      expect(get.body().tracked).toBe(true);
    });

    it("then it should insert with null userId", () => {
      expect(get.valuesMock()).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null })
      );
    });
  });

  describe("given an authenticated user", () => {
    const userId = chance.guid();

    beforeEach(() => {
      given.authenticatedUser(userId);
    });

    describe("when sending a valid event with a valid UUID videoId and metadata", () => {
      const eventType = "video_view";
      const videoId = chance.guid();
      const metadata = { title: chance.sentence() };

      beforeEach(async () => {
        given.insertSucceeds();
        await when.postEvent({ eventType, videoId, metadata });
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should return tracked true", () => {
        expect(get.body().tracked).toBe(true);
      });

      it("then it should insert with correct userId", () => {
        expect(get.valuesMock()).toHaveBeenCalledWith(
          expect.objectContaining({ userId })
        );
      });

      it("then it should insert with correct eventType", () => {
        expect(get.valuesMock()).toHaveBeenCalledWith(
          expect.objectContaining({ eventType })
        );
      });

      it("then it should insert with the valid UUID videoId", () => {
        expect(get.valuesMock()).toHaveBeenCalledWith(
          expect.objectContaining({ videoId })
        );
      });

      it("then it should insert with stringified metadata without rawVideoId", () => {
        expect(get.valuesMock()).toHaveBeenCalledWith(
          expect.objectContaining({ metadata: JSON.stringify(metadata) })
        );
      });
    });

    describe("when sending an event with a non-UUID videoId", () => {
      const eventType = "video_view";
      const videoId = "cf-not-a-uuid-abc123";
      const metadata = { title: chance.sentence() };

      beforeEach(async () => {
        given.insertSucceeds();
        await when.postEvent({ eventType, videoId, metadata });
      });

      it("then it should insert with null videoId", () => {
        expect(get.valuesCallArgs(0).videoId).toBeNull();
      });

      it("then it should include rawVideoId in metadata", () => {
        const parsed = JSON.parse(get.valuesCallArgs(0).metadata);
        expect(parsed.rawVideoId).toBe(videoId);
      });

      it("then it should preserve original metadata fields", () => {
        const parsed = JSON.parse(get.valuesCallArgs(0).metadata);
        expect(parsed.title).toBe(metadata.title);
      });
    });

    describe("when sending an event with a non-UUID videoId and no metadata", () => {
      const eventType = "video_view";
      const videoId = "cf-not-a-uuid-abc123";

      beforeEach(async () => {
        given.insertSucceeds();
        await when.postEvent({ eventType, videoId });
      });

      it("then it should insert with null videoId", () => {
        expect(get.valuesCallArgs(0).videoId).toBeNull();
      });

      it("then it should store rawVideoId in metadata", () => {
        const parsed = JSON.parse(get.valuesCallArgs(0).metadata);
        expect(parsed.rawVideoId).toBe(videoId);
      });
    });

    describe("when sending an event without videoId or metadata", () => {
      const eventType = "page_view";

      beforeEach(async () => {
        given.insertSucceeds();
        await when.postEvent({ eventType });
      });

      it("then it should insert with null videoId", () => {
        expect(get.valuesMock()).toHaveBeenCalledWith(
          expect.objectContaining({ videoId: null })
        );
      });

      it("then it should insert with null metadata", () => {
        expect(get.valuesMock()).toHaveBeenCalledWith(
          expect.objectContaining({ metadata: null })
        );
      });
    });

    describe("when the first insert fails with FK error and retry succeeds", () => {
      const eventType = "video_view";
      const videoId = chance.guid();

      beforeEach(async () => {
        given.insertFailsThenSucceeds(new Error("FK violation"));
        await when.postEvent({ eventType, videoId });
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should return tracked true", () => {
        expect(get.body().tracked).toBe(true);
      });

      it("then it should have called values twice (original + retry)", () => {
        expect(get.valuesCallCount()).toBe(2);
      });

      it("then the retry should insert with null videoId", () => {
        expect(get.valuesCallArgs(1).videoId).toBeNull();
      });

      it("then the retry should include rawVideoId in metadata", () => {
        const parsed = JSON.parse(get.valuesCallArgs(1).metadata);
        expect(parsed.rawVideoId).toBe(videoId);
      });
    });

    describe("when eventType is missing", () => {
      beforeEach(async () => {
        await when.postEvent({ videoId: chance.guid() });
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });

      it("then it should return eventType required error", () => {
        expect(get.body().error).toBe("eventType is required");
      });
    });

    describe("when both insert attempts fail", () => {
      beforeEach(async () => {
        given.insertFails(new Error("DB error"));
        await when.postEvent({ eventType: "page_view" });
      });

      it("then it should return 200 (analytics never returns 500)", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should return tracked false", () => {
        expect(get.body().tracked).toBe(false);
      });
    });
  });
});
