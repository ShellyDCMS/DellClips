import { auth } from "@/lib/auth";
import { databaseService, videoService } from "@/lib/services";
import { redirect } from "next/navigation";
import FeedClient from "./feed-client";

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch initial videos on the server
  const videos = await databaseService.getVideoFeed({
    userId: session.user.id,
    limit: 10,
    offset: 0,
  });

  // Enrich with playback URLs and like status
  const enrichedVideos = await Promise.all(
    videos.map(async (video) => {
      const hasLiked = await databaseService.hasUserLikedVideo(
        session.user!.id!,
        video.id
      );
      return {
        ...video,
        playbackUrl: videoService.getPlaybackUrl(video.videoPlaybackId),
        hasLiked,
        createdAt: video.createdAt.toISOString(),
      };
    })
  );

  return <FeedClient initialVideos={enrichedVideos} />;
}
