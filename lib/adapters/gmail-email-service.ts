import { EmailService } from "@/lib/ports/email-service";
import nodemailer from "nodemailer";

export class GmailEmailService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD!,
      },
    });
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"DellClips" <${process.env.GMAIL_USER}>`,
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
