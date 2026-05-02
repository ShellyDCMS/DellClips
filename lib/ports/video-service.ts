export interface UploadUrlResult {
  uploadUrl: string;
  assetId: string;
}

export interface VideoService {
  createUploadUrl(userId: string): Promise<UploadUrlResult>;
  getPlaybackUrl(assetId: string): string;
  deleteVideo(assetId: string): Promise<void>;
}
