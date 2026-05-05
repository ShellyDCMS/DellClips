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

describe("ResendEmailService", () => {
  let service: ResendEmailService;

  beforeEach(() => {
    service = new ResendEmailService();
    mockSend.mockReset();
  });

  describe("given a valid Resend configuration", () => {
    describe("when sending a verification code", () => {
      it("then it should call Resend API with correct parameters", async () => {
        // given
        mockSend.mockResolvedValueOnce({ id: "email-123" });

        // when
        await service.sendVerificationCode("john@dell.com", "123456");

        // then
        expect(mockSend).toHaveBeenCalledOnce();
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "john@dell.com",
          })
        );
      });

      it("then the email should contain the verification code", async () => {
        // given
        mockSend.mockResolvedValueOnce({ id: "email-456" });

        // when
        await service.sendVerificationCode("jane@dell.com", "654321");

        // then
        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.html).toContain("654321");
      });

      it("then the email should be sent from DellClips", async () => {
        // given
        mockSend.mockResolvedValueOnce({ id: "email-789" });

        // when
        await service.sendVerificationCode("user@dell.com", "111222");

        // then
        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.from).toContain("DellClips");
      });
    });

    describe("when Resend API fails", () => {
      it("then it should propagate the error", async () => {
        // given
        mockSend.mockRejectedValueOnce(new Error("API rate limit exceeded"));

        // when / then
        await expect(
          service.sendVerificationCode("user@dell.com", "999999")
        ).rejects.toThrow("API rate limit exceeded");
      });
    });
  });
});
