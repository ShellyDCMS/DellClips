export interface UploadUrlResult {
  uploadUrl: string;
  assetId: string;
}

export interface WebhookResult {
  type: "verification" | "video_ready" | "video_error" | "unknown";
  challenge?: string;
  assetId?: string;
  duration?: number;
  errorReason?: string;
}

export interface VideoService {
  createUploadUrl(userId: string): Promise<UploadUrlResult>;
  getPlaybackUrl(assetId: string): string;
  deleteVideo(assetId: string): Promise<void>;
  parseWebhook(body: string): WebhookResult;
  verifyWebhookSignature(body: string, signatureHeader: string): boolean;
}
