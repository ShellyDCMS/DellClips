import { UploadUrlResult, VideoService } from "@/lib/ports/video-service";

/**
 * Google Drive video service.
 * Videos are uploaded manually to Google Drive and shared with
 * "Anyone with the link". The playback URL is the direct download link.
 *
 * No adaptive bitrate — raw MP4 served directly.
 * Good enough for demos and MVP testing.
 */
export class GDriveVideoService implements VideoService {
  async createUploadUrl(_userId: string): Promise<UploadUrlResult> {
    // Google Drive doesn't support programmatic upload without OAuth
    // Videos are uploaded manually and the file ID is recorded
    console.log(
      `[gdrive] Upload not supported programmatically. Upload manually to Google Drive and use the file ID.`
    );
    return {
      uploadUrl: "https://drive.google.com/upload-manually",
      assetId: `manual-upload-${Date.now()}`,
    };
  }

  getPlaybackUrl(assetId: string): string {
    // If the assetId is a Google Drive file ID, return the direct URL
    if (assetId.startsWith("gdrive-")) {
      const fileId = assetId.replace("gdrive-", "");
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    // If it's a demo video ID, return the Mux test stream
    return "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
  }

  async deleteVideo(assetId: string): Promise<void> {
    console.log(
      `[gdrive] Delete not supported. Remove manually from Google Drive: ${assetId}`
    );
  }
}
