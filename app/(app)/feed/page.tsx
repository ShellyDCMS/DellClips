import { auth } from "@/lib/auth";
import { databaseService, videoService } from "@/lib/services";
import { redirect } from "next/navigation";
import FeedClient from "./feed-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ video?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const targetVideoId = params.video;

  // Fetch initial videos
  const videos = await databaseService.getVideoFeed({
    userId: session.user.id,
    limit: 10,
    offset: 0,
  });

  // If a specific video was requested and it's not in the feed,
  // fetch it separately and put it first
  let allVideos = [...videos];
  if (targetVideoId) {
    const targetExists = videos.some((v) => v.id === targetVideoId);
    if (!targetExists) {
      const targetVideo = await databaseService.getVideoById(targetVideoId);
      if (targetVideo) {
        allVideos = [targetVideo, ...videos];
      }
    } else {
      // Move the target video to the front
      const targetIndex = allVideos.findIndex((v) => v.id === targetVideoId);
      if (targetIndex > 0) {
        const [target] = allVideos.splice(targetIndex, 1);
        allVideos.unshift(target);
      }
    }
  }

  const enrichedVideos = await Promise.all(
    allVideos.map(async (video) => {
      const hasLiked = await databaseService.hasUserLikedVideo(
        session.user!.id!,
        video.id
      );
      const isFollowingAuthor =
        video.author.id === session.user!.id
          ? false
          : await databaseService.isFollowing(session.user!.id!, video.author.id);
      return {
        ...video,
        playbackUrl: videoService.getPlaybackUrl(video.videoPlaybackId),
        hasLiked,
        isFollowingAuthor,
        createdAt: video.createdAt.toISOString(),
      };
    })
  );

  return <FeedClient initialVideos={enrichedVideos} currentUserId={session.user.id} />;
}
