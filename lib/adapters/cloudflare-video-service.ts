import { UploadUrlResult, VideoService, WebhookResult } from "@/lib/ports/video-service";

export class CloudflareVideoService implements VideoService {
  private accountId: string;
  private apiToken: string;
  private customerSubdomain: string;

  constructor() {
    this.accountId = process.env.CF_ACCOUNT_ID!;
    this.apiToken = process.env.CF_STREAM_TOKEN!;
    this.customerSubdomain = process.env.CF_STREAM_CUSTOMER_SUBDOMAIN!;
  }

  async createUploadUrl(userId: string): Promise<UploadUrlResult> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxDurationSeconds: 60,
          meta: { userId },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare Stream error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      uploadUrl: data.result.uploadURL,
      assetId: data.result.uid,
    };
  }

  getPlaybackUrl(assetId: string): string {
    return `https://customer-${this.customerSubdomain}.cloudflarestream.com/${assetId}/manifest/video.m3u8`;
  }

  async deleteVideo(assetId: string): Promise<void> {
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/${assetId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      }
    );
  }

  parseWebhook(body: string): WebhookResult {
    // Handle empty body (connectivity check)
    if (!body || body.trim() === "") {
      return { type: "verification", challenge: "" };
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      // Non-JSON body — treat as plain text challenge
      return { type: "verification", challenge: body };
    }

    // Cloudflare challenge-response verification
    if (data.type === "webhook_callback_verification" || data.challenge) {
      return { type: "verification", challenge: data.challenge || "" };
    }

    // Cloudflare Stream video ready
    if (data.readyToStream === true || data.status?.state === "ready") {
      return {
        type: "video_ready",
        assetId: data.uid,
        duration: data.duration,
      };
    }

    // Cloudflare Stream video error
    if (data.status?.state === "error") {
      return {
        type: "video_error",
        assetId: data.uid,
        errorReason: data.status?.errorReasonCode,
      };
    }

    // Unknown event
    return { type: "unknown", assetId: data.uid };
  }
}
