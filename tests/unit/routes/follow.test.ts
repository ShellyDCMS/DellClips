import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock database service
const mockGetUserById = vi.fn();
const mockFollowUser = vi.fn();
const mockUnfollowUser = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getUserById: (...args: unknown[]) => mockGetUserById(...args),
    followUser: (...args: unknown[]) => mockFollowUser(...args),
    unfollowUser: (...args: unknown[]) => mockUnfollowUser(...args),
  },
}));

import { POST, DELETE } from "@/app/api/videos/[id]/follow/route";
import { NextRequest } from "next/server";

function createRequest(method: string): NextRequest {
  return new NextRequest(
    new URL("/api/videos/user-2/follow", "http://localhost:3000"),
    { method }
  );
}

function createParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/videos/[id]/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await POST(createRequest("POST"), createParams("user-2"));

      // then
      expect(response.status).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when trying to follow themselves", () => {
      it("then it should return 400", async () => {
        // when
        const response = await POST(createRequest("POST"), createParams("user-1"));

        // then
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe("Cannot follow yourself");
      });
    });

    describe("when the target user does not exist", () => {
      it("then it should return 404", async () => {
        // given
        mockGetUserById.mockResolvedValue(null);

        // when
        const response = await POST(createRequest("POST"), createParams("nonexistent"));

        // then
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toBe("User not found");
      });
    });

    describe("when the target user exists", () => {
      it("then it should follow the user and return following true", async () => {
        // given
        mockGetUserById.mockResolvedValue({ id: "user-2", name: "Jane" });
        mockFollowUser.mockResolvedValue(undefined);

        // when
        const response = await POST(createRequest("POST"), createParams("user-2"));

        // then
        const body = await response.json();
        expect(body.following).toBe(true);
        expect(mockFollowUser).toHaveBeenCalledWith({
          followerId: "user-1",
          followingId: "user-2",
        });
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockGetUserById.mockResolvedValue({ id: "user-2" });
        mockFollowUser.mockRejectedValue(new Error("DB error"));

        // when
        const response = await POST(createRequest("POST"), createParams("user-2"));

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to follow user");
      });
    });
  });
});

describe("DELETE /api/videos/[id]/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await DELETE(createRequest("DELETE"), createParams("user-2"));

      // then
      expect(response.status).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when unfollowing a user", () => {
      it("then it should unfollow and return following false", async () => {
        // given
        mockUnfollowUser.mockResolvedValue(undefined);

        // when
        const response = await DELETE(createRequest("DELETE"), createParams("user-2"));

        // then
        const body = await response.json();
        expect(body.following).toBe(false);
        expect(mockUnfollowUser).toHaveBeenCalledWith({
          followerId: "user-1",
          followingId: "user-2",
        });
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockUnfollowUser.mockRejectedValue(new Error("DB error"));

        // when
        const response = await DELETE(createRequest("DELETE"), createParams("user-2"));

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to unfollow user");
      });
    });
  });
});
