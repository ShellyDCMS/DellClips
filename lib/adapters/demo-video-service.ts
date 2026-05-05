import { UploadUrlResult, VideoService } from "@/lib/ports/video-service";

// Free demo videos from public sources (no copyright issues)
// These are publicly available test streams
const DEMO_VIDEOS = [
  {
    id: "demo-big-buck-bunny",
    playbackUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    title: "Big Buck Bunny",
  },
  {
    id: "demo-sintel",
    playbackUrl: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    title: "Sintel Trailer",
  },
  {
    id: "demo-tears-of-steel",
    playbackUrl:
      "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    title: "Tears of Steel",
  },
  {
    id: "demo-elephant-dream",
    playbackUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    title: "Elephant Dream",
  },
  {
    id: "demo-test-pattern",
    playbackUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    title: "Test Pattern",
  },
];

/**
 * Demo video service that uses free public HLS streams.
 * No Cloudflare account, credit card, or API keys needed.
 *
 * Upload creates a fake asset ID.
 * Playback returns a real, working HLS stream URL.
 * Delete is a no-op.
 */
export class DemoVideoService implements VideoService {
  async createUploadUrl(userId: string): Promise<UploadUrlResult> {
    // In demo mode, we don't actually upload anywhere.
    // We assign a random demo video ID and return a fake upload URL.
    const randomIndex = Math.floor(Math.random() * DEMO_VIDEOS.length);
    const demoVideo = DEMO_VIDEOS[randomIndex];

    console.log(
      `[demo-video] Simulating upload for user ${userId}. Assigned demo: ${demoVideo.title}`
    );

    return {
      uploadUrl: "https://demo.upload.example.com/not-real",
      assetId: demoVideo.id,
    };
  }

  getPlaybackUrl(assetId: string): string {
    const demoVideo = DEMO_VIDEOS.find((v) => v.id === assetId);

    if (demoVideo) {
      return demoVideo.playbackUrl;
    }

    // Fallback: if the assetId doesn't match any demo, return the first one
    return DEMO_VIDEOS[0].playbackUrl;
  }

  async deleteVideo(assetId: string): Promise<void> {
    console.log(`[demo-video] Simulating delete for asset: ${assetId}`);
    // No-op in demo mode
  }
}
