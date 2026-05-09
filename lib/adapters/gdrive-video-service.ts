import { UploadUrlResult, VideoService, WebhookResult } from "@/lib/ports/video-service";

export class GDriveVideoService implements VideoService {
  async createUploadUrl(_userId: string): Promise<UploadUrlResult> {
    console.log(
      `[gdrive] Upload not supported programmatically. Upload manually to Google Drive and use the file ID.`
    );
    return {
      uploadUrl: "https://drive.google.com/upload-manually",
      assetId: `manual-upload-${Date.now()}`,
    };
  }

  getPlaybackUrl(assetId: string): string {
    if (assetId.startsWith("gdrive-")) {
      const fileId = assetId.replace("gdrive-", "");
      // Use the preview/streaming URL instead of download URL
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    // Fallback for demo videos
    return "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
  }

  async deleteVideo(assetId: string): Promise<void> {
    console.log(
      `[gdrive] Delete not supported. Remove manually from Google Drive: ${assetId}`
    );
  }

  parseWebhook(body: string): WebhookResult {
    if (!body || body.trim() === "") {
      return { type: "verification", challenge: "" };
    }
    try {
      const data = JSON.parse(body);
      if (data.challenge) {
        return { type: "verification", challenge: data.challenge };
      }
    } catch {
      return { type: "verification", challenge: body };
    }
    return { type: "unknown" };
  }
}
