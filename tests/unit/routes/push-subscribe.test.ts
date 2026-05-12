import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { PushSubscribeDriver } from "./push-subscribe.driver";

const chance = new Chance();

const aSubscription = () => ({
  endpoint: chance.url(),
  keys: {
    p256dh: chance.string({ length: 32 }),
    auth: chance.string({ length: 16 }),
  },
});

describe("POST /api/push/subscribe", () => {
  const driver = new PushSubscribeDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.subscribe(aSubscription());
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });

    it("then it should not insert a subscription", () => {
      expect(get.insertCallCount()).toBe(0);
    });
  });

  describe("given an authenticated user", () => {
    const userId = chance.guid();

    beforeEach(() => {
      given.authenticatedUser(userId);
    });

    describe("when subscribing with valid keys", () => {
      const subscription = aSubscription();

      beforeEach(async () => {
        given.insertSucceeds();
        await when.subscribe(subscription);
      });

      it("then it should return subscribed true", () => {
        expect(get.body().subscribed).toBe(true);
      });

      it("then it should insert the subscription with the user id", () => {
        expect(get.valuesCallArgs(0)).toEqual(
          expect.objectContaining({
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          })
        );
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.insertFails(new Error("DB error"));
        await when.subscribe(aSubscription());
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

describe("DELETE /api/push/subscribe", () => {
  const driver = new PushSubscribeDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.unsubscribe({ endpoint: chance.url() });
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });

    it("then it should not delete a subscription", () => {
      expect(get.deleteCallCount()).toBe(0);
    });
  });

  describe("given an authenticated user", () => {
    const userId = chance.guid();

    beforeEach(() => {
      given.authenticatedUser(userId);
    });

    describe("when unsubscribing with a valid endpoint", () => {
      beforeEach(async () => {
        given.deleteSucceeds();
        await when.unsubscribe({ endpoint: chance.url() });
      });

      it("then it should return unsubscribed true", () => {
        expect(get.body().unsubscribed).toBe(true);
      });

      it("then it should issue a delete query", () => {
        expect(get.deleteCallCount()).toBe(1);
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.deleteFails(new Error("DB error"));
        await when.unsubscribe({ endpoint: chance.url() });
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
