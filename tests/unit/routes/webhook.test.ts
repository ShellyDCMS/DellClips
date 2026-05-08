import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { WebhookDriver } from "./webhook.driver";

const chance = new Chance();

describe("POST /api/video/webhook", () => {
  const driver = new WebhookDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given a webhook payload without uid", () => {
    beforeEach(async () => {
      await when.postWebhook({});
    });

    it("then it should return 400", () => {
      expect(get.status()).toBe(400);
    });

    it("then it should return Missing uid error", () => {
      expect(get.body().error).toBe("Missing uid");
    });
  });

  describe("given a webhook payload with readyToStream true", () => {
    const uid = chance.guid();
    const duration = chance.floating({ min: 1, max: 300, fixed: 1 });

    beforeEach(async () => {
      given.updateVideoStatusSucceeds();
      await when.postWebhook({ uid, readyToStream: true, duration });
    });

    it("then it should update video status to ready", () => {
      expect(get.updateVideoStatusMock()).toHaveBeenCalledWith(uid, "ready", duration);
    });

    it("then it should return ready status", () => {
      expect(get.body().status).toBe("ready");
    });
  });

  describe("given a webhook payload with readyToStream true and no duration", () => {
    const uid = chance.guid();

    beforeEach(async () => {
      given.updateVideoStatusSucceeds();
      await when.postWebhook({ uid, readyToStream: true });
    });

    it("then it should pass undefined duration", () => {
      expect(get.updateVideoStatusMock()).toHaveBeenCalledWith(uid, "ready", undefined);
    });
  });

  describe("given a webhook payload with status.state ready", () => {
    const uid = chance.guid();
    const duration = chance.integer({ min: 1, max: 300 });

    beforeEach(async () => {
      given.updateVideoStatusSucceeds();
      await when.postWebhook({ uid, status: { state: "ready" }, duration });
    });

    it("then it should update video status to ready", () => {
      expect(get.updateVideoStatusMock()).toHaveBeenCalledWith(uid, "ready", duration);
    });

    it("then it should return ready status", () => {
      expect(get.body().status).toBe("ready");
    });
  });

  describe("given a webhook payload with status.state error", () => {
    const uid = chance.guid();

    beforeEach(async () => {
      given.updateVideoStatusSucceeds();
      await when.postWebhook({
        uid,
        status: { state: "error", errorReasonCode: "codec_unsupported" },
      });
    });

    it("then it should update video status to errored", () => {
      expect(get.updateVideoStatusMock()).toHaveBeenCalledWith(uid, "errored");
    });

    it("then it should return errored status", () => {
      expect(get.body().status).toBe("errored");
    });
  });

  describe("given a webhook payload with an unrecognized status", () => {
    beforeEach(async () => {
      await when.postWebhook({
        uid: chance.guid(),
        status: { state: "inprogress" },
      });
    });

    it("then it should not update video status", () => {
      expect(get.updateVideoStatusMock()).not.toHaveBeenCalled();
    });

    it("then it should return acknowledged status", () => {
      expect(get.body().status).toBe("acknowledged");
    });
  });

  describe("given the database throws an error", () => {
    beforeEach(async () => {
      given.updateVideoStatusFails(new Error("DB error"));
      await when.postWebhook({ uid: chance.guid(), readyToStream: true });
    });

    it("then it should return 500", () => {
      expect(get.status()).toBe(500);
    });

    it("then it should return failure message", () => {
      expect(get.body().error).toBe("Webhook processing failed");
    });
  });
});

describe("HEAD /api/video/webhook", () => {
  const driver = new WebhookDriver();
  const { when, get } = driver;
  driver.beforeAndAfter();

  beforeEach(async () => {
    await when.head();
  });

  it("then it should return 200", () => {
    expect(get.status()).toBe(200);
  });
});
