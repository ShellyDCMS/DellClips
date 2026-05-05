import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock video service
const mockCreateUploadUrl = vi.fn();
vi.mock("@/lib/services", () => ({
  videoService: {
    createUploadUrl: (...args: unknown[]) => mockCreateUploadUrl(...args),
  },
}));

import { POST } from "@/app/api/video/upload-url/route";

describe("POST /api/video/upload-url", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await POST();

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

    describe("when creating an upload URL succeeds", () => {
      it("then it should return the upload URL and asset ID", async () => {
        // given
        mockCreateUploadUrl.mockResolvedValue({
          uploadUrl: "https://upload.example.com/abc",
          assetId: "asset-123",
        });

        // when
        const response = await POST();

        // then
        const body = await response.json();
        expect(body.uploadUrl).toBe("https://upload.example.com/abc");
        expect(body.assetId).toBe("asset-123");
      });

      it("then it should pass the user ID to the video service", async () => {
        // given
        mockCreateUploadUrl.mockResolvedValue({
          uploadUrl: "https://upload.example.com/abc",
          assetId: "asset-123",
        });

        // when
        await POST();

        // then
        expect(mockCreateUploadUrl).toHaveBeenCalledWith("user-1");
      });
    });

    describe("when the video service throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockCreateUploadUrl.mockRejectedValue(new Error("Service error"));

        // when
        const response = await POST();

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to create upload URL");
      });
    });
  });
});
