import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { WebhookDriver } from "./webhook.driver";

const chance = new Chance();

describe("POST /api/video/webhook", () => {
  const driver = new WebhookDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given signature verification fails", () => {
    beforeEach(async () => {
      given.signatureInvalid();
      await when.postWebhook("some-body");
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });

    it("then it should return Invalid signature error", () => {
      expect(get.body().error).toBe("Invalid signature");
    });

    it("then it should not call parseWebhook", () => {
      expect(get.parseWebhookMock()).not.toHaveBeenCalled();
    });

    it("then it should not update video status", () => {
      expect(get.updateVideoStatusMock()).not.toHaveBeenCalled();
    });
  });

  describe("given signature verification passes and parseWebhook returns verification", () => {
    const challenge = chance.hash();

    beforeEach(async () => {
      given.signatureValid();
      given.parseWebhookReturns({ type: "verification", challenge });
      await when.postWebhook("some-body");
    });

    it("then it should return 200", () => {
      expect(get.status()).toBe(200);
    });

    it("then it should return the challenge as plain text", () => {
      expect(get.text()).toBe(challenge);
    });

    it("then it should not update video status", () => {
      expect(get.updateVideoStatusMock()).not.toHaveBeenCalled();
    });
  });

  describe("given signature passes and parseWebhook returns video_ready with assetId and duration", () => {
    const assetId = chance.guid();
    const duration = chance.floating({ min: 1, max: 300, fixed: 1 });

    beforeEach(async () => {
      given.signatureValid();
      given.updateVideoStatusSucceeds();
      given.parseWebhookReturns({ type: "video_ready", assetId, duration });
      await when.postWebhook("ready-body");
    });

    it("then it should update video status to ready with duration", () => {
      expect(get.updateVideoStatusMock()).toHaveBeenCalledWith(
        assetId,
        "ready",
        duration
      );
    });

    it("then it should return ready status", () => {
      expect(get.body().status).toBe("ready");
    });

    it("then it should revalidate the feed and root paths", () => {
      expect(get.revalidatePathMock()).toHaveBeenCalledWith("/feed");
      expect(get.revalidatePathMock()).toHaveBeenCalledWith("/");
    });
  });

  describe("given signature passes and parseWebhook returns video_ready without assetId", () => {
    beforeEach(async () => {
      given.signatureValid();
      given.parseWebhookReturns({ type: "video_ready" });
      await when.postWebhook("ready-no-id");
    });

    it("then it should not update video status", () => {
      expect(get.updateVideoStatusMock()).not.toHaveBeenCalled();
    });

    it("then it should return ready status", () => {
      expect(get.body().status).toBe("ready");
    });
  });

  describe("given signature passes and parseWebhook returns video_error with assetId", () => {
    const assetId = chance.guid();

    beforeEach(async () => {
      given.signatureValid();
      given.updateVideoStatusSucceeds();
      given.parseWebhookReturns({
        type: "video_error",
        assetId,
        errorReason: "codec_unsupported",
      });
      await when.postWebhook("error-body");
    });

    it("then it should update video status to errored", () => {
      expect(get.updateVideoStatusMock()).toHaveBeenCalledWith(assetId, "errored");
    });

    it("then it should return errored status", () => {
      expect(get.body().status).toBe("errored");
    });
  });

  describe("given signature passes and parseWebhook returns video_error without assetId", () => {
    beforeEach(async () => {
      given.signatureValid();
      given.parseWebhookReturns({ type: "video_error", errorReason: "unknown" });
      await when.postWebhook("error-no-id");
    });

    it("then it should not update video status", () => {
      expect(get.updateVideoStatusMock()).not.toHaveBeenCalled();
    });

    it("then it should return errored status", () => {
      expect(get.body().status).toBe("errored");
    });
  });

  describe("given signature passes and parseWebhook returns unknown", () => {
    beforeEach(async () => {
      given.signatureValid();
      given.parseWebhookReturns({ type: "unknown", assetId: chance.guid() });
      await when.postWebhook("unknown-body");
    });

    it("then it should not update video status", () => {
      expect(get.updateVideoStatusMock()).not.toHaveBeenCalled();
    });

    it("then it should return acknowledged status", () => {
      expect(get.body().status).toBe("acknowledged");
    });
  });

  describe("given the database throws an error on video_ready", () => {
    beforeEach(async () => {
      given.signatureValid();
      given.updateVideoStatusFails(new Error("DB error"));
      given.parseWebhookReturns({
        type: "video_ready",
        assetId: chance.guid(),
        duration: 10,
      });
      await when.postWebhook("ready-db-fail");
    });

    it("then it should return 200 to avoid webhook rejection", () => {
      expect(get.status()).toBe(200);
    });

    it("then it should return processing failed error", () => {
      expect(get.body().error).toBe("Processing failed");
    });
  });

  describe("given parseWebhook throws an error", () => {
    beforeEach(async () => {
      given.signatureValid();
      get.parseWebhookMock().mockImplementation(() => {
        throw new Error("parse crash");
      });
      await when.postWebhook("bad-body");
    });

    it("then it should return 200 to avoid webhook rejection", () => {
      expect(get.status()).toBe(200);
    });

    it("then it should return processing failed error", () => {
      expect(get.body().error).toBe("Processing failed");
    });
  });

  describe("given the request body is passed to parseWebhook", () => {
    const rawBody = chance.sentence();

    beforeEach(async () => {
      given.signatureValid();
      given.parseWebhookReturns({ type: "unknown" });
      await when.postWebhook(rawBody);
    });

    it("then it should delegate the raw body to videoService.parseWebhook", () => {
      expect(get.parseWebhookMock()).toHaveBeenCalledWith(rawBody);
    });
  });

  describe("given the request body and signature are passed to verifyWebhookSignature", () => {
    const rawBody = chance.sentence();
    const signature = chance.hash();

    beforeEach(async () => {
      given.signatureValid();
      given.parseWebhookReturns({ type: "unknown" });
      await when.postWebhook(rawBody, signature);
    });

    it("then it should delegate the body and signature to verifyWebhookSignature", () => {
      expect(get.verifyWebhookSignatureMock()).toHaveBeenCalledWith(rawBody, signature);
    });
  });
});

describe("GET /api/video/webhook", () => {
  const driver = new WebhookDriver();
  const { when, get } = driver;
  driver.beforeAndAfter();

  beforeEach(async () => {
    await when.getHealth();
  });

  it("then it should return 200", () => {
    expect(get.status()).toBe(200);
  });

  it("then it should return status ok", () => {
    expect(get.body().status).toBe("ok");
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
