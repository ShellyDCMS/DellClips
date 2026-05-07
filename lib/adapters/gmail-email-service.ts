import { EmailService } from "@/lib/ports/email-service";
import nodemailer from "nodemailer";

export class GmailEmailService implements EmailService {
  private transporter: nodemailer.Transporter;
  private relayEmail: string;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD!,
      },
    });
    this.relayEmail = process.env.DELL_RELAY_EMAIL || "dell.clips@dell.com";
  }

  async sendMagicLink(email: string, url: string): Promise<void> {
    // Route through Dell relay mailbox
    await this.sendViaRelay(
      email,
      "DellClips Sign In",
      `<a href="${url}">Click here to sign in</a>`
    );
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    console.log(`[gmail] Sending verification code via relay to ${email}`);

    // Send to the Dell relay mailbox with structured content
    // Power Automate will parse this and forward to the recipient
    await this.transporter.sendMail({
      from: `"DellClips" <${process.env.GMAIL_USER}>`,
      to: this.relayEmail,
      subject: `DELLCLIPS_CODE: ${code} | TO: ${email}`,
      html: `
        <div style="font-family: monospace; font-size: 14px;">
          <p>--- DELLCLIPS AUTOMATED MESSAGE - DO NOT REPLY ---</p>
          <br/>
          <p><strong>RECIPIENT:</strong> ${email}</p>
          <p><strong>CODE:</strong> ${code}</p>
          <p><strong>EXPIRES:</strong> ${new Date(Date.now() + 10 * 60 * 1000).toISOString()}</p>
          <p><strong>APP:</strong> DellClips Verification</p>
          <br/>
          <p>--- END AUTOMATED MESSAGE ---</p>
        </div>
      `,
      // Also include plain text for easier Power Automate parsing
      text: [
        "--- DELLCLIPS AUTOMATED MESSAGE ---",
        `RECIPIENT: ${email}`,
        `CODE: ${code}`,
        `EXPIRES: ${new Date(Date.now() + 10 * 60 * 1000).toISOString()}`,
        `APP: DellClips Verification`,
        "--- END ---",
      ].join("\n"),
    });

    console.log(
      `[gmail] Verification code sent to relay (${this.relayEmail}) for ${email}`
    );
  }

  private async sendViaRelay(
    recipientEmail: string,
    purpose: string,
    content: string
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"DellClips" <${process.env.GMAIL_USER}>`,
      to: this.relayEmail,
      subject: `DELLCLIPS_RELAY | TO: ${recipientEmail} | ${purpose}`,
      html: `
        <div style="font-family: monospace; font-size: 14px;">
          <p>--- DELLCLIPS AUTOMATED MESSAGE - DO NOT REPLY ---</p>
          <br/>
          <p><strong>RECIPIENT:</strong> ${recipientEmail}</p>
          <p><strong>CONTENT:</strong></p>
          ${content}
          <br/>
          <p>--- END AUTOMATED MESSAGE ---</p>
        </div>
      `,
    });
  }
}
