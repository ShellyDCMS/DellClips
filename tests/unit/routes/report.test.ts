import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock database service
const mockGetVideoById = vi.fn();
const mockCreateReport = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getVideoById: (...args: unknown[]) => mockGetVideoById(...args),
    createReport: (...args: unknown[]) => mockCreateReport(...args),
  },
}));

// Mock utils
vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return { ...actual };
});

import { POST } from "@/app/api/videos/[id]/report/route";
import { NextRequest } from "next/server";

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new URL("/api/videos/video-1/report", "http://localhost:3000"),
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }
  );
}

function createParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/videos/[id]/report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      // when
      const response = await POST(
        createPostRequest({ reason: "offensive" }),
        createParams("video-1")
      );

      // then
      expect(response.status).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    });

    describe("when sending a valid report with a known reason", () => {
      it("then it should create the report and return 201", async () => {
        // given
        mockGetVideoById.mockResolvedValue({ id: "video-1" });
        mockCreateReport.mockResolvedValue({ id: "report-new" });

        // when
        const response = await POST(
          createPostRequest({ reason: "offensive", description: "Bad content" }),
          createParams("video-1")
        );

        // then
        expect(response.status).toBe(201);
        const body = await response.json();
        expect(body.report.id).toBe("report-new");
      });

      it("then it should pass the correct data to createReport", async () => {
        // given
        mockGetVideoById.mockResolvedValue({ id: "video-1" });
        mockCreateReport.mockResolvedValue({ id: "report-new" });

        // when
        await POST(
          createPostRequest({ reason: "spam", description: "Misleading" }),
          createParams("video-1")
        );

        // then
        expect(mockCreateReport).toHaveBeenCalledWith({
          userId: "user-1",
          videoId: "video-1",
          reason: "spam",
          description: "Misleading",
        });
      });
    });

    describe("when sending a report without a description", () => {
      it("then it should still succeed", async () => {
        // given
        mockGetVideoById.mockResolvedValue({ id: "video-1" });
        mockCreateReport.mockResolvedValue({ id: "report-new" });

        // when
        const response = await POST(
          createPostRequest({ reason: "harassment" }),
          createParams("video-1")
        );

        // then
        expect(response.status).toBe(201);
      });
    });

    describe("when sending an invalid reason", () => {
      it("then it should return 400", async () => {
        // when
        const response = await POST(
          createPostRequest({ reason: "invalid_reason" }),
          createParams("video-1")
        );

        // then
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe("Invalid request");
      });
    });

    describe("when sending a request without a reason", () => {
      it("then it should return 400", async () => {
        // when
        const response = await POST(
          createPostRequest({}),
          createParams("video-1")
        );

        // then
        expect(response.status).toBe(400);
      });
    });

    describe("when the video does not exist", () => {
      it("then it should return 404", async () => {
        // given
        mockGetVideoById.mockResolvedValue(null);

        // when
        const response = await POST(
          createPostRequest({ reason: "offensive" }),
          createParams("nonexistent")
        );

        // then
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error).toBe("Video not found");
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        // given
        mockGetVideoById.mockResolvedValue({ id: "video-1" });
        mockCreateReport.mockRejectedValue(new Error("DB error"));

        // when
        const response = await POST(
          createPostRequest({ reason: "offensive" }),
          createParams("video-1")
        );

        // then
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to report video");
      });
    });
  });
});
