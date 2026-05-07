import { getSession, requireAdmin, requireAuth, requireUserId } from "@/lib/auth-helpers";
import { beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

const mockGetUserById = vi.fn();
vi.mock("@/lib/services", () => ({
  databaseService: {
    getUserById: (...args: unknown[]) => mockGetUserById(...args),
  },
}));

export class AuthHelpersDriver {
  private lastResult: any = undefined;
  private lastError: Error | null = null;

  beforeAndAfter = () => {
    beforeEach(() => {
      mockAuth.mockReset();
      mockRedirect.mockReset();
      mockGetUserById.mockReset();
      this.lastResult = undefined;
      this.lastError = null;
    });
  };

  given = {
    authenticatedUser: (session: { user: { id: string; email?: string } }) => {
      mockAuth.mockResolvedValueOnce(session);
    },
    unauthenticated: () => {
      mockAuth.mockResolvedValueOnce(null);
    },
    sessionWithNoUser: () => {
      mockAuth.mockResolvedValueOnce({ user: undefined });
    },
    sessionWithNoUserId: () => {
      mockAuth.mockResolvedValueOnce({ user: { id: undefined } });
    },
    userInDatabase: (user: { id: string; role: string }) => {
      mockGetUserById.mockResolvedValueOnce(user);
    },
    userNotInDatabase: () => {
      mockGetUserById.mockResolvedValueOnce(null);
    },
  };

  when = {
    getSession: async () => {
      try {
        this.lastResult = await getSession();
      } catch (error) {
        this.lastError = error as Error;
      }
    },
    requireAuth: async () => {
      try {
        this.lastResult = await requireAuth();
      } catch (error) {
        this.lastError = error as Error;
      }
    },
    requireAdmin: async () => {
      try {
        this.lastResult = await requireAdmin();
      } catch (error) {
        this.lastError = error as Error;
      }
    },
    requireUserId: async () => {
      try {
        this.lastResult = await requireUserId();
      } catch (error) {
        this.lastError = error as Error;
      }
    },
  };

  get = {
    lastResult: () => this.lastResult,
    lastError: () => this.lastError,
    redirectMock: () => mockRedirect,
    getUserByIdMock: () => mockGetUserById,
  };
}
