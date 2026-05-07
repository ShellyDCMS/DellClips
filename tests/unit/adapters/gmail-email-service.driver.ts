import { GmailEmailService } from "@/lib/adapters/gmail-email-service";
import { beforeEach, vi } from "vitest";

const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: mockSendMail,
    }),
  },
}));

vi.stubEnv("GMAIL_USER", "dellclips@gmail.com");
vi.stubEnv("GMAIL_APP_PASSWORD", "test-app-password");

export class GmailEmailServiceDriver {
  private service!: GmailEmailService;
  private lastError: Error | null = null;
  private lastCallArgs: Record<string, any> | null = null;

  beforeAndAfter = () => {
    beforeEach(() => {
      mockSendMail.mockReset();
      this.service = new GmailEmailService();
      this.lastError = null;
      this.lastCallArgs = null;
    });
  };

  given = {
    sendMailSucceeds: (messageId: string) => {
      mockSendMail.mockResolvedValueOnce({ messageId });
    },
    sendMailFails: (errorMessage: string) => {
      mockSendMail.mockRejectedValueOnce(new Error(errorMessage));
    },
  };

  when = {
    sendVerificationCode: async (email: string, code: string) => {
      try {
        await this.service.sendVerificationCode(email, code);
        this.lastCallArgs = mockSendMail.mock.calls[0]?.[0] ?? null;
      } catch (error) {
        this.lastError = error as Error;
      }
    },
  };

  get = {
    sendMailMock: () => mockSendMail,
    lastCallArgs: () => this.lastCallArgs,
    lastError: () => this.lastError,
  };
}
