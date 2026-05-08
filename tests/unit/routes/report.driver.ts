import { POST } from "@/app/api/videos/[id]/report/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockGetVideoById = vi.fn();
const mockCreateReport = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getVideoById: (...args: unknown[]) => mockGetVideoById(...args),
    createReport: (...args: unknown[]) => mockCreateReport(...args),
  },
}));

vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return { ...actual };
});

export class ReportDriver {
  private lastResponse: Response | null = null;
  private lastBody: any = null;

  beforeAndAfter = () => {
    beforeEach(() => {
      vi.clearAllMocks();
      this.lastResponse = null;
      this.lastBody = null;
    });
  };

  given = {
    unauthenticated: () => {
      mockAuth.mockResolvedValue(null);
    },
    authenticatedUser: (userId: string) => {
      mockAuth.mockResolvedValue({ user: { id: userId } });
    },
    video: (video: any) => {
      mockGetVideoById.mockResolvedValue(video);
    },
    videoNotFound: () => {
      mockGetVideoById.mockResolvedValue(null);
    },
    createReport: (result: any) => {
      mockCreateReport.mockResolvedValue(result);
    },
    createReportFails: (error: Error) => {
      mockCreateReport.mockRejectedValue(error);
    },
  };

  when = {
    report: async (videoId: string, body: Record<string, unknown>) => {
      const request = new NextRequest(
        new URL(`/api/videos/${videoId}/report`, "http://localhost:3000"),
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );
      this.lastResponse = await POST(request, {
        params: Promise.resolve({ id: videoId }),
      });
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    createReportMock: () => mockCreateReport,
  };
}
