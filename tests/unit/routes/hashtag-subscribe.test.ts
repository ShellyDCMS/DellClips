import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock database service
const mockSubscribeToHashtag = vi.fn();
const mockUnsubscribeFromHashtag = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    subscribeToHashtag: (...args: unknown[]) => mockSubscribeToHashtag(...args),
    unsubscribeFromHashtag: (...args: unknown[]) => mockUnsubscribeFromHashtag(...args),
  },
}));

import { POST, DELETE } from "@/app/api/hashtags/[name]/subscribe/route";
import { NextRequest } from "next/server";

function createRequest(method: string): NextRequest {
  return new NextRequest(
    new URL("/api/hashtags/delltech/subscribe", "http://localhost:3000"),
    {
      method,
    }
  );
}

function createParams(name: string): { params: Promise<{ name: string }> } {
  return { params: Promise.resolve({ name }) };
}

describe("POST /api/hashtags/[name]/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await POST(createRequest("POST"), createParams("delltech"));

      // then
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when subscribing to a hashtag", () => {
      it("then it should call subscribeToHashtag and return subscribed true", async () => {
        // given
        mockSubscribeToHashtag.mockResolvedValue(undefined);

        // when
        const response = await POST(createRequest("POST"), createParams("DellTech"));

        // then
        const body = await response.json();
        expect(body.subscribed).toBe(true);
        expect(mockSubscribeToHashtag).toHaveBeenCalledWith("user-1", "delltech");
      });
    });

    describe("when the hashtag has a leading #", () => {
      it("then it should strip the # and normalize", async () => {
        // given
        mockSubscribeToHashtag.mockResolvedValue(undefined);

        // when
        const response = await POST(createRequest("POST"), createParams("#Engineering"));

        // then
        expect(response.status).toBe(200);
        expect(mockSubscribeToHashtag).toHaveBeenCalledWith("user-1", "engineering");
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockSubscribeToHashtag.mockRejectedValue(new Error("DB error"));

        // when
        const response = await POST(createRequest("POST"), createParams("delltech"));

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to subscribe");
      });
    });
  });
});

describe("DELETE /api/hashtags/[name]/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await DELETE(createRequest("DELETE"), createParams("delltech"));

      // then
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when unsubscribing from a hashtag", () => {
      it("then it should call unsubscribeFromHashtag and return subscribed false", async () => {
        // given
        mockUnsubscribeFromHashtag.mockResolvedValue(undefined);

        // when
        const response = await DELETE(createRequest("DELETE"), createParams("DellTech"));

        // then
        const body = await response.json();
        expect(body.subscribed).toBe(false);
        expect(mockUnsubscribeFromHashtag).toHaveBeenCalledWith("user-1", "delltech");
      });
    });

    describe("when the hashtag has a leading #", () => {
      it("then it should strip the # and normalize", async () => {
        // given
        mockUnsubscribeFromHashtag.mockResolvedValue(undefined);

        // when
        const response = await DELETE(
          createRequest("DELETE"),
          createParams("#Engineering")
        );

        // then
        expect(response.status).toBe(200);
        expect(mockUnsubscribeFromHashtag).toHaveBeenCalledWith("user-1", "engineering");
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockUnsubscribeFromHashtag.mockRejectedValue(new Error("DB error"));

        // when
        const response = await DELETE(createRequest("DELETE"), createParams("delltech"));

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to unsubscribe");
      });
    });
  });
});
