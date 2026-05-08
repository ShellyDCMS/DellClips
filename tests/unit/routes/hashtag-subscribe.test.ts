import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { HashtagSubscribeDriver } from "./hashtag-subscribe.driver";

const chance = new Chance();

describe("POST /api/hashtags/[name]/subscribe", () => {
  const driver = new HashtagSubscribeDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.subscribe("delltech");
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

    describe("when subscribing to a hashtag", () => {
      beforeEach(async () => {
        given.subscribeSucceeds();
        await when.subscribe("DellTech");
      });

      it("then it should return subscribed true", () => {
        expect(get.body().subscribed).toBe(true);
      });

      it("then it should normalize and call subscribeToHashtag", () => {
        expect(get.subscribeMock()).toHaveBeenCalledWith(userId, "delltech");
      });
    });

    describe("when the hashtag has a leading #", () => {
      beforeEach(async () => {
        given.subscribeSucceeds();
        await when.subscribe("#Engineering");
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should strip the # and normalize", () => {
        expect(get.subscribeMock()).toHaveBeenCalledWith(userId, "engineering");
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.subscribeFails(new Error("DB error"));
        await when.subscribe("delltech");
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to subscribe");
      });
    });
  });
});

describe("DELETE /api/hashtags/[name]/subscribe", () => {
  const driver = new HashtagSubscribeDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.unsubscribe("delltech");
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

    describe("when unsubscribing from a hashtag", () => {
      beforeEach(async () => {
        given.unsubscribeSucceeds();
        await when.unsubscribe("DellTech");
      });

      it("then it should return subscribed false", () => {
        expect(get.body().subscribed).toBe(false);
      });

      it("then it should normalize and call unsubscribeFromHashtag", () => {
        expect(get.unsubscribeMock()).toHaveBeenCalledWith(userId, "delltech");
      });
    });

    describe("when the hashtag has a leading #", () => {
      beforeEach(async () => {
        given.unsubscribeSucceeds();
        await when.unsubscribe("#Engineering");
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should strip the # and normalize", () => {
        expect(get.unsubscribeMock()).toHaveBeenCalledWith(userId, "engineering");
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.unsubscribeFails(new Error("DB error"));
        await when.unsubscribe("delltech");
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to unsubscribe");
      });
    });
  });
});
