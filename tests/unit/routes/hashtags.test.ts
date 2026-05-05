import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock database service
const mockGetTrendingHashtags = vi.fn();
vi.mock("@/lib/services", () => ({
  databaseService: {
    getTrendingHashtags: (...args: unknown[]) => mockGetTrendingHashtags(...args),
  },
}));

import { GET } from "@/app/api/hashtags/route";
import { NextRequest } from "next/server";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/hashtags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await GET(createRequest("/api/hashtags"));

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

    describe("when requesting with default limit", () => {
      it("then it should call getTrendingHashtags with limit 10", async () => {
        // given
        mockGetTrendingHashtags.mockResolvedValue([]);

        // when
        await GET(createRequest("/api/hashtags"));

        // then
        expect(mockGetTrendingHashtags).toHaveBeenCalledWith(10);
      });

      it("then it should return hashtags", async () => {
        // given
        const mockHashtags = [
          { name: "delltech", count: 15 },
          { name: "engineering", count: 10 },
        ];
        mockGetTrendingHashtags.mockResolvedValue(mockHashtags);

        // when
        const response = await GET(createRequest("/api/hashtags"));

        // then
        const body = await response.json();
        expect(body.hashtags).toEqual(mockHashtags);
      });
    });

    describe("when requesting with a custom limit", () => {
      it("then it should respect the limit parameter", async () => {
        // given
        mockGetTrendingHashtags.mockResolvedValue([]);

        // when
        await GET(createRequest("/api/hashtags?limit=5"));

        // then
        expect(mockGetTrendingHashtags).toHaveBeenCalledWith(5);
      });
    });

    describe("when requesting with a limit exceeding 50", () => {
      it("then it should cap the limit at 50", async () => {
        // given
        mockGetTrendingHashtags.mockResolvedValue([]);

        // when
        await GET(createRequest("/api/hashtags?limit=100"));

        // then
        expect(mockGetTrendingHashtags).toHaveBeenCalledWith(50);
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockGetTrendingHashtags.mockRejectedValue(new Error("DB error"));

        // when
        const response = await GET(createRequest("/api/hashtags"));

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to fetch hashtags");
      });
    });
  });
});
