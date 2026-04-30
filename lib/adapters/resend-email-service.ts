import { EmailService } from "@/lib/ports/email-service";
import { Resend } from "resend";

export class ResendEmailService implements EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.AUTH_RESEND_KEY!);
  }

  async sendMagicLink(email: string, url: string): Promise<void> {
    await this.resend.emails.send({
      from: "DellClips <noreply@dellclips.com>",
      to: email,
      subject: "Sign in to DellClips",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0672CB;">Sign in to DellClips</h2>
          <p>Click the button below to sign in. This link expires in 10 minutes.</p>
          <a href="${url}" 
             style="display: inline-block; background: #0672CB; color: white; 
                    padding: 12px 32px; border-radius: 6px; text-decoration: none;
                    font-weight: bold; margin: 16px 0;">
            Sign In to DellClips
          </a>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </div>
      `,
    });
  }
}