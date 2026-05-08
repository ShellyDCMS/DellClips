import { EmailService } from "@/lib/ports/email-service";
import { databaseService } from "@/lib/services";
import { Resend } from "resend";

export class ResendEmailService implements EmailService {
  private _resend: Resend | null = null;
  private fromAddress: string;

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM || "DellClips <noreply@dellclips.app>";
  }

  private get resend(): Resend {
    if (!this._resend) {
      this._resend = new Resend(process.env.AUTH_RESEND_KEY!);
    }
    return this._resend;
  }

  private async getBccAddress(): Promise<string | undefined> {
    try {
      const enabled = await databaseService.getConfigValue("email.bcc_relay_enabled");
      if (enabled === "true") {
        const address = await databaseService.getConfigValue("email.bcc_relay_address");
        return address || undefined;
      }
    } catch (err) {
      console.error("[resend] Failed to check BCC config:", err);
    }
    return undefined;
  }

  async sendMagicLink(email: string, url: string): Promise<void> {
    const bcc = await this.getBccAddress();

    await this.resend.emails.send({
      from: this.fromAddress,
      to: email,
      ...(bcc ? { bcc } : {}),
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

    console.log(`[resend] Magic link sent to ${email}${bcc ? ` (BCC: ${bcc})` : ""}`);
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const bcc = await this.getBccAddress();

    await this.resend.emails.send({
      from: this.fromAddress,
      to: email,
      ...(bcc ? { bcc } : {}),
      subject: `${code} — Your DellClips verification code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0672CB;">Your DellClips verification code</h2>
          <p>Enter this code to sign in to DellClips:</p>
          <div style="background: #f0f0f0; border-radius: 8px; padding: 20px;
                      text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                         color: #0672CB; font-family: monospace;">
              ${code}
            </span>
          </div>
          <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log(
      `[resend] Verification code sent to ${email}${bcc ? ` (BCC: ${bcc})` : ""}`
    );
  }
}
