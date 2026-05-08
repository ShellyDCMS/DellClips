import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { AdminAnalyticsDriver } from "./admin-analytics.driver";

const chance = new Chance();

describe("GET /api/admin/analytics", () => {
  const driver = new AdminAnalyticsDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.getAnalytics();
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
      await when.getAnalytics();
    });

    it("then it should return 403", () => {
      expect(get.status()).toBe(403);
    });

    it("then it should return Forbidden error", () => {
      expect(get.body().error).toBe("Forbidden");
    });
  });

  describe("given a user that is not found", () => {
    const userId = chance.guid();

    beforeEach(async () => {
      given.authenticatedUser(userId);
      given.userNotFound();
      await when.getAnalytics();
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

    describe("when fetching analytics with default days", () => {
      beforeEach(async () => {
        // 7 query results: totalUsers, totalVideos, eventCounts,
        // dailyActiveUsers, topVideos, topUsers, recentEvents
        given.dbQueryResults([
          [{ count: 10 }],
          [{ count: 5 }],
          [{ eventType: "video_view", count: 3 }],
          [{ date: "2025-05-01", count: 2 }],
          [],
          [],
          [],
        ]);
        await when.getAnalytics();
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then the period should default to 30 days", () => {
        expect(get.body().period.days).toBe(30);
      });

      it("then overview should contain totalUsers", () => {
        expect(get.body().overview.totalUsers).toBe(10);
      });

      it("then overview should contain totalVideos", () => {
        expect(get.body().overview.totalVideos).toBe(5);
      });

      it("then overview should contain totalEvents from eventCounts sum", () => {
        expect(get.body().overview.totalEvents).toBe(3);
      });

      it("then eventCounts should be returned", () => {
        expect(get.body().eventCounts).toEqual([{ eventType: "video_view", count: 3 }]);
      });

      it("then dailyActiveUsers should be returned", () => {
        expect(get.body().dailyActiveUsers).toEqual([{ date: "2025-05-01", count: 2 }]);
      });
    });

    describe("when fetching analytics with custom days parameter", () => {
      beforeEach(async () => {
        given.dbQueryResults([[{ count: 1 }], [{ count: 1 }], [], [], [], [], []]);
        await when.getAnalytics("/api/admin/analytics?days=7");
      });

      it("then the period should be 7 days", () => {
        expect(get.body().period.days).toBe(7);
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        // Empty results — the proxy will resolve to empty arrays,
        // but if the route itself throws we test the catch path.
        // To force an error we provide no results so totalUsers[0]
        // will be undefined, causing totalUsers.count to throw.
        given.dbQueryResults([]);
        await when.getAnalytics();
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to fetch analytics");
      });
    });
  });
});
