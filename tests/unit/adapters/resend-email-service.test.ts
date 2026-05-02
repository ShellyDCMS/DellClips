import { ResendEmailService } from "@/lib/adapters/resend-email-service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock environment variables
vi.stubEnv("AUTH_RESEND_KEY", "test-resend-api-key");

// Mock the Resend SDK
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

describe("ResendEmailService", () => {
  let service: ResendEmailService;

  beforeEach(() => {
    service = new ResendEmailService();
    mockSend.mockReset();
  });

  describe("given a valid Resend configuration", () => {
    describe("when sending a magic link", () => {
      it("then it should call Resend API with correct parameters", async () => {
        // given
        mockSend.mockResolvedValueOnce({ id: "email-123" });

        // when
        await service.sendMagicLink(
          "john@dell.com",
          "https://app.com/verify?token=abc123"
        );

        // then
        expect(mockSend).toHaveBeenCalledOnce();
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "john@dell.com",
            subject: "Sign in to DellClips",
          })
        );
      });

      it("then the email should contain the magic link URL", async () => {
        // given
        mockSend.mockResolvedValueOnce({ id: "email-456" });
        const magicLinkUrl = "https://app.com/verify?token=xyz789";

        // when
        await service.sendMagicLink("jane@dell.com", magicLinkUrl);

        // then
        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.html).toContain(magicLinkUrl);
      });

      it("then the email should be sent from DellClips", async () => {
        // given
        mockSend.mockResolvedValueOnce({ id: "email-789" });

        // when
        await service.sendMagicLink("user@dell.com", "https://link");

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
          service.sendMagicLink("user@dell.com", "https://link")
        ).rejects.toThrow("API rate limit exceeded");
      });
    });
  });
});
