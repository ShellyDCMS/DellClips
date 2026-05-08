import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock database service
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

import { GET, PUT } from "@/app/api/admin/config/route";
import { NextRequest } from "next/server";

function createPutRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL("/api/admin/config", "http://localhost:3000"), {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/admin/config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      const response = await GET();

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("given an authenticated non-admin user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockGetUserById.mockResolvedValue({ id: "user-1", role: "user" });
    });

    it("then it should return 403", async () => {
      const response = await GET();

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Forbidden");
    });
  });

  describe("given an authenticated admin user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
      mockGetUserById.mockResolvedValue({ id: "admin-1", role: "admin" });
    });

    it("then it should return config values", async () => {
      const mockConfig = [
        {
          key: "email.bcc_relay_enabled",
          value: "true",
          description: "Enable BCC",
          updatedAt: new Date(),
        },
      ];
      mockGetAllConfig.mockResolvedValue(mockConfig);

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.config).toHaveLength(1);
      expect(body.config[0].key).toBe("email.bcc_relay_enabled");
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        mockGetAllConfig.mockRejectedValue(new Error("DB error"));

        const response = await GET();

        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to fetch config");
      });
    });
  });
});

describe("PUT /api/admin/config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given an unauthenticated user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("then it should return 401", async () => {
      const response = await PUT(createPutRequest({ key: "k", value: "v" }));

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("given an authenticated non-admin user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockGetUserById.mockResolvedValue({ id: "user-1", role: "user" });
    });

    it("then it should return 403", async () => {
      const response = await PUT(createPutRequest({ key: "k", value: "v" }));

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Forbidden");
    });
  });

  describe("given an authenticated admin user", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
      mockGetUserById.mockResolvedValue({ id: "admin-1", role: "admin" });
    });

    describe("when sending a valid key and value", () => {
      it("then it should update the config and return success", async () => {
        mockSetConfigValue.mockResolvedValue(undefined);

        const response = await PUT(
          createPutRequest({ key: "email.bcc_relay_enabled", value: "true" })
        );

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.updated).toBe(true);
        expect(body.key).toBe("email.bcc_relay_enabled");
        expect(body.value).toBe("true");
      });

      it("then it should call setConfigValue with correct arguments", async () => {
        mockSetConfigValue.mockResolvedValue(undefined);

        await PUT(createPutRequest({ key: "app.feature", value: "enabled" }));

        expect(mockSetConfigValue).toHaveBeenCalledWith(
          "app.feature",
          "enabled",
          "admin-1"
        );
      });
    });

    describe("when the key is missing", () => {
      it("then it should return 400", async () => {
        const response = await PUT(createPutRequest({ value: "v" }));

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe("key and value are required");
      });
    });

    describe("when the value is undefined", () => {
      it("then it should return 400", async () => {
        const response = await PUT(createPutRequest({ key: "k" }));

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe("key and value are required");
      });
    });

    describe("when the database throws an error", () => {
      it("then it should return 500", async () => {
        mockSetConfigValue.mockRejectedValue(new Error("DB error"));

        const response = await PUT(createPutRequest({ key: "k", value: "v" }));

        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe("Failed to update config");
      });
    });
  });
});
