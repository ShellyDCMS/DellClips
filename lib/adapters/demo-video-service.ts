import { UploadUrlResult, VideoService } from "@/lib/ports/video-service";

// All streams from Mux's public test infrastructure (most reliable)
// Source: https://test-streams.mux.dev
const DEMO_VIDEOS = [
  {
    id: "demo-1",
    playbackUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    title: "Big Buck Bunny",
  },
  {
    id: "demo-2",
    playbackUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    title: "Q4 Engineering Highlights",
  },
  {
    id: "demo-3",
    playbackUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    title: "New Hire Onboarding Tips",
  },
  {
    id: "demo-4",
    playbackUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    title: "Sales Team Q3 Wins",
  },
  {
    id: "demo-5",
    playbackUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    title: "How to Use DellClips",
  },
];

export class DemoVideoService implements VideoService {
  async createUploadUrl(userId: string): Promise<UploadUrlResult> {
    const randomIndex = Math.floor(Math.random() * DEMO_VIDEOS.length);
    const demoVideo = DEMO_VIDEOS[randomIndex];

    console.log(
      `[demo-video] Simulating upload for user ${userId}. Assigned: ${demoVideo.title}`
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
    return DEMO_VIDEOS[0].playbackUrl;
  }

  async deleteVideo(assetId: string): Promise<void> {
    console.log(`[demo-video] Simulating delete for asset: ${assetId}`);
  }
}
