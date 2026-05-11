import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "test-public-key");
vi.stubEnv("VAPID_PRIVATE_KEY", "test-private-key");
vi.stubEnv("VAPID_EMAIL", "mailto:test@dell.com");

const {
  mockSendNotification,
  mockSetVapidDetails,
  mockSelectFrom,
  mockWhere,
  mockDeleteWhere,
  subscriptionsByQuery,
} = vi.hoisted(() => ({
  mockSendNotification: vi.fn(),
  mockSetVapidDetails: vi.fn(),
  mockSelectFrom: vi.fn(),
  mockWhere: vi.fn(),
  mockDeleteWhere: vi.fn(),
  subscriptionsByQuery: { all: [] as any[], forUser: [] as any[] },
}));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: (...args: unknown[]) => mockSetVapidDetails(...args),
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        mockSelectFrom(table);
        return {
          where: (...args: unknown[]) => {
            mockWhere(...args);
            return Promise.resolve(subscriptionsByQuery.forUser);
          },
          then: (resolve: (rows: any[]) => any) =>
            resolve(subscriptionsByQuery.all),
        };
      },
    }),
    delete: () => ({
      where: (...args: unknown[]) => {
        mockDeleteWhere(...args);
        return Promise.resolve(undefined);
      },
    }),
  },
}));

vi.mock("@/drizzle/schema", () => ({
  pushSubscriptions: {
    id: "id",
    userId: "userId",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (a: unknown, b: unknown) => ({ _eq: [a, b] }),
}));

import { WebPushNotificationService } from "@/lib/adapters/web-push-notification-service";

const aSub = (overrides: Partial<any> = {}) => ({
  id: `sub-${Math.random().toString(36).slice(2, 8)}`,
  endpoint: `https://push.example.com/${Math.random().toString(36).slice(2)}`,
  p256dh: "p256dh-key",
  auth: "auth-key",
  ...overrides,
});

describe("WebPushNotificationService", () => {
  let service: WebPushNotificationService;

  beforeEach(() => {
    mockSendNotification.mockReset();
    mockSelectFrom.mockReset();
    mockWhere.mockReset();
    mockDeleteWhere.mockReset();
    subscriptionsByQuery.all = [];
    subscriptionsByQuery.forUser = [];
    service = new WebPushNotificationService();
  });

  describe("given VAPID configuration", () => {
    it("then it should configure web-push on import", () => {
      expect(mockSetVapidDetails).toHaveBeenCalled();
    });
  });

  describe("sendToUser", () => {
    const userId = "user-123";

    describe("given the user has subscriptions", () => {
      const sub1 = aSub();
      const sub2 = aSub();

      beforeEach(() => {
        subscriptionsByQuery.forUser = [sub1, sub2];
        mockSendNotification.mockResolvedValue(undefined);
      });

      it("then it should send a notification to each subscription", async () => {
        await service.sendToUser(userId, { title: "Hi", body: "Hello" });
        expect(mockSendNotification).toHaveBeenCalledTimes(2);
      });

      it("then it should include the title and body in the payload", async () => {
        await service.sendToUser(userId, { title: "Hi", body: "Hello" });
        const payload = JSON.parse(mockSendNotification.mock.calls[0][1]);
        expect(payload.title).toBe("Hi");
        expect(payload.body).toBe("Hello");
      });

      it("then it should default the url to /feed", async () => {
        await service.sendToUser(userId, { title: "T", body: "B" });
        const payload = JSON.parse(mockSendNotification.mock.calls[0][1]);
        expect(payload.data.url).toBe("/feed");
      });

      it("then it should pass through a custom url", async () => {
        await service.sendToUser(userId, {
          title: "T",
          body: "B",
          url: "/feed?video=abc",
        });
        const payload = JSON.parse(mockSendNotification.mock.calls[0][1]);
        expect(payload.data.url).toBe("/feed?video=abc");
      });

      it("then it should pass through the tag", async () => {
        await service.sendToUser(userId, {
          title: "T",
          body: "B",
          tag: "like-1",
        });
        const payload = JSON.parse(mockSendNotification.mock.calls[0][1]);
        expect(payload.tag).toBe("like-1");
      });

      it("then it should send to the correct push endpoint", async () => {
        await service.sendToUser(userId, { title: "T", body: "B" });
        expect(mockSendNotification.mock.calls[0][0]).toEqual({
          endpoint: sub1.endpoint,
          keys: { p256dh: sub1.p256dh, auth: sub1.auth },
        });
      });
    });

    describe("given the user has no subscriptions", () => {
      beforeEach(() => {
        subscriptionsByQuery.forUser = [];
      });

      it("then it should not call web-push", async () => {
        await service.sendToUser(userId, { title: "T", body: "B" });
        expect(mockSendNotification).not.toHaveBeenCalled();
      });
    });

    describe("given a subscription returns 410 Gone", () => {
      const expired = aSub();

      beforeEach(() => {
        subscriptionsByQuery.forUser = [expired];
        mockSendNotification.mockRejectedValueOnce({ statusCode: 410 });
      });

      it("then it should delete the expired subscription", async () => {
        await service.sendToUser(userId, { title: "T", body: "B" });
        expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
      });
    });

    describe("given a subscription returns 404 Not Found", () => {
      const expired = aSub();

      beforeEach(() => {
        subscriptionsByQuery.forUser = [expired];
        mockSendNotification.mockRejectedValueOnce({ statusCode: 404 });
      });

      it("then it should delete the expired subscription", async () => {
        await service.sendToUser(userId, { title: "T", body: "B" });
        expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
      });
    });

    describe("given a subscription returns a non-removal error", () => {
      const sub = aSub();

      beforeEach(() => {
        subscriptionsByQuery.forUser = [sub];
        mockSendNotification.mockRejectedValueOnce({ statusCode: 500 });
      });

      it("then it should not delete the subscription", async () => {
        await service.sendToUser(userId, { title: "T", body: "B" });
        expect(mockDeleteWhere).not.toHaveBeenCalled();
      });

      it("then it should not throw", async () => {
        await expect(
          service.sendToUser(userId, { title: "T", body: "B" })
        ).resolves.toBeUndefined();
      });
    });
  });

  describe("sendToAll", () => {
    describe("given multiple subscriptions exist", () => {
      const sub1 = aSub();
      const sub2 = aSub();
      const sub3 = aSub();

      beforeEach(() => {
        subscriptionsByQuery.all = [sub1, sub2, sub3];
        mockSendNotification.mockResolvedValue(undefined);
      });

      it("then it should send to every subscription", async () => {
        await service.sendToAll({ title: "Broadcast", body: "All" });
        expect(mockSendNotification).toHaveBeenCalledTimes(3);
      });
    });

    describe("given a subscription has expired", () => {
      const expired = aSub();

      beforeEach(() => {
        subscriptionsByQuery.all = [expired];
        mockSendNotification.mockRejectedValueOnce({ statusCode: 410 });
      });

      it("then it should remove the expired subscription", async () => {
        await service.sendToAll({ title: "T", body: "B" });
        expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
      });
    });
  });
});
