import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { ReportDriver } from "./report.driver";

const chance = new Chance();

describe("POST /api/videos/[id]/report", () => {
  const driver = new ReportDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.report("video-1", { reason: "offensive" });
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

    describe("when sending a valid report with a known reason", () => {
      const videoId = chance.guid();
      const reportId = chance.guid();
      const description = chance.sentence();

      beforeEach(async () => {
        given.video({ id: videoId });
        given.createReport({ id: reportId });
        await when.report(videoId, {
          reason: "offensive",
          description,
        });
      });

      it("then it should return 201", () => {
        expect(get.status()).toBe(201);
      });

      it("then it should return the report id", () => {
        expect(get.body().report.id).toBe(reportId);
      });

      it("then it should pass the correct data to createReport", () => {
        expect(get.createReportMock()).toHaveBeenCalledWith({
          userId,
          videoId,
          reason: "offensive",
          description,
        });
      });
    });

    describe("when sending a report without a description", () => {
      beforeEach(async () => {
        given.video({ id: "video-1" });
        given.createReport({ id: chance.guid() });
        await when.report("video-1", { reason: "harassment" });
      });

      it("then it should return 201", () => {
        expect(get.status()).toBe(201);
      });
    });

    describe("when sending an invalid reason", () => {
      beforeEach(async () => {
        await when.report("video-1", { reason: "invalid_reason" });
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });

      it("then it should return Invalid request error", () => {
        expect(get.body().error).toBe("Invalid request");
      });
    });

    describe("when sending a request without a reason", () => {
      beforeEach(async () => {
        await when.report("video-1", {});
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });
    });

    describe("when the video does not exist", () => {
      beforeEach(async () => {
        given.videoNotFound();
        await when.report("nonexistent", { reason: "offensive" });
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
        given.video({ id: "video-1" });
        given.createReportFails(new Error("DB error"));
        await when.report("video-1", { reason: "offensive" });
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to report video");
      });
    });
  });
});
