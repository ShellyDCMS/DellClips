import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { AdminReportsDriver } from "./admin-reports.driver";

const chance = new Chance();

describe("GET /api/admin/reports", () => {
  const driver = new AdminReportsDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.getReports();
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });

    it("then it should return Unauthorized error", () => {
      expect(get.body().error).toBe("Unauthorized");
    });
  });

  describe("given an authenticated non-admin user", () => {
    const userId = chance.guid();

    beforeEach(async () => {
      given.authenticatedUser(userId);
      given.userWithRole(userId, "user");
      await when.getReports();
    });

    it("then it should return 403", () => {
      expect(get.status()).toBe(403);
    });

    it("then it should return Forbidden error", () => {
      expect(get.body().error).toBe("Forbidden");
    });
  });

  describe("given an authenticated admin user", () => {
    const adminId = chance.guid();

    beforeEach(() => {
      given.authenticatedUser(adminId);
      given.userWithRole(adminId, "admin");
    });

    describe("when fetching reports succeeds", () => {
      const reportId = chance.guid();

      beforeEach(async () => {
        given.pendingReports([
          {
            id: reportId,
            reason: "spam",
            description: chance.sentence(),
            status: "pending",
            createdAt: new Date().toISOString(),
            video: { id: chance.guid(), title: chance.sentence() },
            reportedBy: { id: chance.guid(), name: chance.name(), email: chance.email() },
          },
        ]);
        await when.getReports();
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should return the reports", () => {
        expect(get.body().reports).toHaveLength(1);
      });

      it("then the report id should match", () => {
        expect(get.body().reports[0].id).toBe(reportId);
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.pendingReportsFails(new Error("DB error"));
        await when.getReports();
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to fetch reports");
      });
    });
  });
});

describe("PUT /api/admin/reports", () => {
  const driver = new AdminReportsDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.putReport({ reportId: chance.guid(), action: "dismiss" });
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });

    it("then it should return Unauthorized error", () => {
      expect(get.body().error).toBe("Unauthorized");
    });
  });

  describe("given an authenticated non-admin user", () => {
    const userId = chance.guid();

    beforeEach(async () => {
      given.authenticatedUser(userId);
      given.userWithRole(userId, "user");
      await when.putReport({ reportId: chance.guid(), action: "dismiss" });
    });

    it("then it should return 403", () => {
      expect(get.status()).toBe(403);
    });

    it("then it should return Forbidden error", () => {
      expect(get.body().error).toBe("Forbidden");
    });
  });

  describe("given an authenticated admin user", () => {
    const adminId = chance.guid();

    beforeEach(() => {
      given.authenticatedUser(adminId);
      given.userWithRole(adminId, "admin");
    });

    describe("when reportId is missing", () => {
      beforeEach(async () => {
        await when.putReport({ action: "dismiss" });
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });

      it("then it should return validation error", () => {
        expect(get.body().error).toBe("reportId and action are required");
      });
    });

    describe("when action is missing", () => {
      beforeEach(async () => {
        await when.putReport({ reportId: chance.guid() });
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });
    });

    describe("when action is invalid", () => {
      beforeEach(async () => {
        await when.putReport({ reportId: chance.guid(), action: "bogus" });
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });

      it("then it should return invalid action error", () => {
        expect(get.body().error).toBe(
          "Invalid action. Use 'dismiss' or 'remove_video'"
        );
      });
    });

    describe("when dismissing a report", () => {
      const reportId = chance.guid();

      beforeEach(async () => {
        given.updateReportSucceeds();
        await when.putReport({ reportId, action: "dismiss" });
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should return success true", () => {
        expect(get.body().success).toBe(true);
      });

      it("then it should return the action", () => {
        expect(get.body().action).toBe("dismiss");
      });

      it("then it should call updateReportStatus with dismissed", () => {
        expect(get.updateReportStatusMock()).toHaveBeenCalledWith(
          reportId,
          "dismissed",
          adminId
        );
      });

      it("then it should not call deleteVideo", () => {
        expect(get.deleteVideoMock()).not.toHaveBeenCalled();
      });

      it("then it should revalidate /admin/reports", () => {
        expect(get.revalidatePathMock()).toHaveBeenCalledWith("/admin/reports");
      });

      it("then it should revalidate /feed", () => {
        expect(get.revalidatePathMock()).toHaveBeenCalledWith("/feed");
      });
    });

    describe("when removing a video", () => {
      const reportId = chance.guid();
      const videoId = chance.guid();
      const playbackId = chance.guid();

      beforeEach(async () => {
        given.updateReportSucceeds();
        given.videoExists({ id: videoId, videoPlaybackId: playbackId });
        given.videoProviderDeleteSucceeds();
        given.deleteVideoSucceeds();
        await when.putReport({ reportId, action: "remove_video", videoId });
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should mark the report actioned", () => {
        expect(get.updateReportStatusMock()).toHaveBeenCalledWith(
          reportId,
          "actioned",
          adminId
        );
      });

      it("then it should delete from the video provider", () => {
        expect(get.videoServiceDeleteMock()).toHaveBeenCalledWith(playbackId);
      });

      it("then it should delete the video from the database", () => {
        expect(get.deleteVideoMock()).toHaveBeenCalledWith(videoId);
      });
    });

    describe("when removing a video and video provider delete fails", () => {
      const reportId = chance.guid();
      const videoId = chance.guid();
      const playbackId = chance.guid();

      beforeEach(async () => {
        given.updateReportSucceeds();
        given.videoExists({ id: videoId, videoPlaybackId: playbackId });
        given.videoProviderDeleteFails(new Error("provider down"));
        given.deleteVideoSucceeds();
        await when.putReport({ reportId, action: "remove_video", videoId });
      });

      it("then it should still return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should still delete the video from the database", () => {
        expect(get.deleteVideoMock()).toHaveBeenCalledWith(videoId);
      });
    });

    describe("when removing a video without videoId", () => {
      const reportId = chance.guid();

      beforeEach(async () => {
        given.updateReportSucceeds();
        await when.putReport({ reportId, action: "remove_video" });
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should not call deleteVideo", () => {
        expect(get.deleteVideoMock()).not.toHaveBeenCalled();
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.updateReportFails(new Error("DB error"));
        await when.putReport({ reportId: chance.guid(), action: "dismiss" });
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to process report");
      });
    });
  });
});
