import { auth } from "@/lib/auth";
import type { VideoWithAuthor } from "@/lib/ports/database-service";
import { databaseService, videoService } from "@/lib/services";
import { redirect } from "next/navigation";
import SearchClient from "./search-client";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; hashtag?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = params.q || "";
  const hashtag = params.hashtag || "";

  let videos: VideoWithAuthor[];
  let isSubscribed = false;

  if (hashtag) {
    videos = await databaseService.getVideosByHashtag(hashtag);
    isSubscribed = await databaseService.isSubscribedToHashtag(session.user.id, hashtag);
  } else if (query) {
    videos = await databaseService.searchVideos({ query });
  } else {
    videos = [];
  }

  const trendingHashtags = await databaseService.getTrendingHashtags(10);
  const subscribedHashtags = await databaseService.getSubscribedHashtags(session.user.id);

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

  return (
    <SearchClient
      initialVideos={enrichedVideos}
      hashtag={hashtag}
      query={query}
      isSubscribed={isSubscribed}
      trendingHashtags={trendingHashtags}
      subscribedHashtags={subscribedHashtags.map((h) => h.name)}
      currentUserId={session.user.id}
    />
  );
}
