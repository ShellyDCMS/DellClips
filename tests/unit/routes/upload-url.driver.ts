import { POST } from "@/app/api/video/upload-url/route";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockCreateUploadUrl = vi.fn();
vi.mock("@/lib/services", () => ({
  videoService: {
    createUploadUrl: (...args: unknown[]) => mockCreateUploadUrl(...args),
  },
}));

export class UploadUrlDriver {
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
    uploadUrl: (result: { uploadUrl: string; assetId: string }) => {
      mockCreateUploadUrl.mockResolvedValue(result);
    },
    uploadUrlFails: (error: Error) => {
      mockCreateUploadUrl.mockRejectedValue(error);
    },
  };

  when = {
    createUploadUrl: async () => {
      this.lastResponse = await POST();
      this.lastBody = await this.lastResponse.json();
    },
  };

  get = {
    status: () => this.lastResponse!.status,
    body: () => this.lastBody,
    createUploadUrlMock: () => mockCreateUploadUrl,
  };
}
