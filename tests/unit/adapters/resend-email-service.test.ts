import { ResendEmailService } from "@/lib/adapters/resend-email-service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock environment variables
vi.stubEnv("AUTH_RESEND_KEY", "test-resend-api-key");

// Mock the Resend SDK
const mockSend = vi.fn();
vi.mock("resend", () => {
  return {
    Resend: class {
      emails = { send: mockSend };
    },
  };
});

// Mock database service for BCC config
const mockGetConfigValue = vi.fn();
vi.mock("@/lib/services", () => ({
  databaseService: {
    getConfigValue: (...args: unknown[]) => mockGetConfigValue(...args),
  },
}));

describe("ResendEmailService", () => {
  let service: ResendEmailService;

  beforeEach(() => {
    service = new ResendEmailService();
    mockSend.mockReset();
    mockGetConfigValue.mockReset();
    mockGetConfigValue.mockResolvedValue(null);
  });

  describe("given a valid Resend configuration", () => {
    describe("when sending a verification code", () => {
      it("then it should call Resend API with correct parameters", async () => {
        mockSend.mockResolvedValueOnce({ id: "email-123" });

        await service.sendVerificationCode("john@dell.com", "123456");

        expect(mockSend).toHaveBeenCalledOnce();
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "john@dell.com",
          })
        );
      });

      it("then the email should contain the verification code", async () => {
        mockSend.mockResolvedValueOnce({ id: "email-456" });

        await service.sendVerificationCode("jane@dell.com", "654321");

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.html).toContain("654321");
      });

      it("then the email should be sent from DellClips", async () => {
        mockSend.mockResolvedValueOnce({ id: "email-789" });

        await service.sendVerificationCode("user@dell.com", "111222");

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.from).toContain("DellClips");
      });

      it("then the subject should contain the code", async () => {
        mockSend.mockResolvedValueOnce({ id: "email-sub" });

        await service.sendVerificationCode("user@dell.com", "123456");

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.subject).toContain("123456");
      });
    });

    describe("when sending a magic link", () => {
      it("then it should call Resend API with the URL in the body", async () => {
        mockSend.mockResolvedValueOnce({ id: "email-ml" });

        await service.sendMagicLink(
          "user@dell.com",
          "https://app.test/auth/callback?token=abc"
        );

        expect(mockSend).toHaveBeenCalledOnce();
        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.to).toBe("user@dell.com");
        expect(callArgs.html).toContain("https://app.test/auth/callback?token=abc");
      });
    });

    describe("when Resend API fails", () => {
      it("then it should propagate the error", async () => {
        mockSend.mockRejectedValueOnce(new Error("API rate limit exceeded"));

        await expect(
          service.sendVerificationCode("user@dell.com", "999999")
        ).rejects.toThrow("API rate limit exceeded");
      });
    });
  });

  describe("given BCC relay is enabled", () => {
    beforeEach(() => {
      mockGetConfigValue.mockImplementation(async (key: string) => {
        if (key === "email.bcc_relay_enabled") return "true";
        if (key === "email.bcc_relay_address") return "relay@dell.com";
        return null;
      });
    });

    describe("when sending a verification code", () => {
      it("then it should include the BCC address", async () => {
        mockSend.mockResolvedValueOnce({ id: "email-bcc" });

        await service.sendVerificationCode("user@dell.com", "123456");

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.bcc).toBe("relay@dell.com");
      });
    });

    describe("when sending a magic link", () => {
      it("then it should include the BCC address", async () => {
        mockSend.mockResolvedValueOnce({ id: "email-bcc-ml" });

        await service.sendMagicLink("user@dell.com", "https://app.test/auth/callback");

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.bcc).toBe("relay@dell.com");
      });
    });
  });

  describe("given BCC relay is disabled", () => {
    beforeEach(() => {
      mockGetConfigValue.mockImplementation(async (key: string) => {
        if (key === "email.bcc_relay_enabled") return "false";
        return null;
      });
    });

    describe("when sending a verification code", () => {
      it("then it should not include a BCC address", async () => {
        mockSend.mockResolvedValueOnce({ id: "email-no-bcc" });

        await service.sendVerificationCode("user@dell.com", "123456");

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.bcc).toBeUndefined();
      });
    });
  });

  describe("given BCC config lookup fails", () => {
    beforeEach(() => {
      mockGetConfigValue.mockRejectedValue(new Error("DB unavailable"));
    });

    describe("when sending a verification code", () => {
      it("then it should still send the email without BCC", async () => {
        mockSend.mockResolvedValueOnce({ id: "email-fallback" });

        await service.sendVerificationCode("user@dell.com", "123456");

        expect(mockSend).toHaveBeenCalledOnce();
        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.bcc).toBeUndefined();
      });
    });
  });
});
