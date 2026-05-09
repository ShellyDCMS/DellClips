import { GET, PUT } from "@/app/api/admin/config/route";
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
const mockGetAllConfig = vi.fn();
const mockSetConfigValue = vi.fn();
const mockGetConfigValue = vi.fn();

vi.mock("@/lib/services", () => ({
  databaseService: {
    getUserById: (...args: unknown[]) => mockGetUserById(...args),
    getAllConfig: (...args: unknown[]) => mockGetAllConfig(...args),
    setConfigValue: (...args: unknown[]) => mockSetConfigValue(...args),
    getConfigValue: (...args: unknown[]) => mockGetConfigValue(...args),
  },
}));

export class AdminConfigDriver {
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
    allConfig: (config: any[]) => {
      mockGetAllConfig.mockResolvedValue(config);
    },
    allConfigFails: (error: Error) => {
      mockGetAllConfig.mockRejectedValue(error);
    },
    setConfigSucceeds: () => {
      mockSetConfigValue.mockResolvedValue(undefined);
    },
    setConfigFails: (error: Error) => {
      mockSetConfigValue.mockRejectedValue(error);
    },
  };

  when = {
    getConfig: async () => {
      this.lastResponse = await GET();
      this.lastBody = await this.lastResponse.json();
    },
    putConfig: async (body: Record<string, unknown>) => {
      const request = new NextRequest(
        new URL("/api/admin/config", "http://localhost:3000"),
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
    setConfigValueMock: () => mockSetConfigValue,
  };
}
