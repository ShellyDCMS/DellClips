import { UploadUrlResult, VideoService } from "@/lib/ports/video-service";

export class CloudflareVideoService implements VideoService {
  private accountId: string;
  private apiToken: string;

  constructor() {
    this.accountId = process.env.CF_ACCOUNT_ID!;
    this.apiToken = process.env.CF_STREAM_TOKEN!;
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
    return `https://customer-${this.accountId}.cloudflarestream.com/${assetId}/manifest/video.m3u8`;
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
}