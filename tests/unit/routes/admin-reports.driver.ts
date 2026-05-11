import { GET, PUT } from "@/app/api/admin/reports/route";
import { NextRequest } from "next/server";
import { beforeEach, vi } from "vitest";

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockGetUserById = vi.fn();
const mockGetPendingReports = vi.fn();
const mockUpdateReportStatus = vi.fn();
const mockGetVideoById = vi.fn();
const mockDeleteVideo = vi.fn();
const mockVideoServiceDelete = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getUserById: (...args: unknown[]) => mockGetUserById(...args),
    getPendingReports: (...args: unknown[]) => mockGetPendingReports(...args),
    updateReportStatus: (...args: unknown[]) => mockUpdateReportStatus(...args),
    getVideoById: (...args: unknown[]) => mockGetVideoById(...args),
    deleteVideo: (...args: unknown[]) => mockDeleteVideo(...args),
  },
  videoService: {
    deleteVideo: (...args: unknown[]) => mockVideoServiceDelete(...args),
  },
}));

export class AdminReportsDriver {
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
    userWithRole: (userId: string, role: string) => {
      mockGetUserById.mockResolvedValue({ id: userId, role });
    },
    userNotFound: () => {
      mockGetUserById.mockResolvedValue(null);
    },
    pendingReports: (reports: any[]) => {
      mockGetPendingReports.mockResolvedValue(reports);
    },
    pendingReportsFails: (error: Error) => {
      mockGetPendingReports.mockRejectedValue(error);
    },
    updateReportSucceeds: () => {
      mockUpdateReportStatus.mockResolvedValue(undefined);
    },
    updateReportFails: (error: Error) => {
      mockUpdateReportStatus.mockRejectedValue(error);
    },
    videoExists: (video: any) => {
      mockGetVideoById.mockResolvedValue(video);
    },
    videoNotFound: () => {
      mockGetVideoById.mockResolvedValue(null);
    },
    deleteVideoSucceeds: () => {
      mockDeleteVideo.mockResolvedValue(undefined);
    },
    videoProviderDeleteFails: (error: Error) => {
      mockVideoServiceDelete.mockRejectedValue(error);
    },
    videoProviderDeleteSucceeds: () => {
      mockVideoServiceDelete.mockResolvedValue(undefined);
    },
  };

  when = {
    getReports: async () => {
      this.lastResponse = await GET();
      this.lastBody = await this.lastResponse.json();
    },
    putReport: async (body: Record<string, unknown>) => {
      const request = new NextRequest(
        new URL("/api/admin/reports", "http://localhost:3000"),
        {
          method: "PUT",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );
      this.lastResponse = await PUT(request);
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    updateReportStatusMock: () => mockUpdateReportStatus,
    deleteVideoMock: () => mockDeleteVideo,
    videoServiceDeleteMock: () => mockVideoServiceDelete,
    revalidatePathMock: () => mockRevalidatePath,
  };
}
