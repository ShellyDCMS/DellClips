import { EmailService } from "@/lib/ports/email-service";
import { Resend } from "resend";

export class ResendEmailService implements EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.AUTH_RESEND_KEY!);
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from: "DellClips <noreply@dellclips.com>",
      to: email,
      subject: `${code} — Your DellClips sign-in code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0672CB;">Sign in to DellClips</h2>
          <p>Enter this code on the verification page to sign in:</p>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0672CB;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px;">
            This code expires in 10 minutes. If you didn't request this, you can safely ignore it.
          </p>
        </div>
      `,
    });
  }
}
