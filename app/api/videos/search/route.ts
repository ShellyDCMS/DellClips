import { auth } from "@/lib/auth";
import { databaseService, videoService } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

// ============================================
// GET /api/videos/search?q=...&hashtag=... — Search videos
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const hashtag = searchParams.get("hashtag") || "";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let videos;

    if (hashtag) {
      videos = await databaseService.getVideosByHashtag(
        hashtag,
        Math.min(limit, 50),
        offset
      );
    } else if (query) {
      videos = await databaseService.searchVideos({
        query,
        limit: Math.min(limit, 50),
        offset,
      });
    } else {
      return NextResponse.json(
        { error: "Provide 'q' or 'hashtag' parameter" },
        { status: 400 }
      );
    }

    const enrichedVideos = videos.map((video) => ({
      ...video,
      playbackUrl: videoService.getPlaybackUrl(video.videoPlaybackId),
    }));

    return NextResponse.json({
      videos: enrichedVideos,
      hasMore: videos.length === limit,
    });
  } catch (error) {
    console.error("[api/videos/search] GET error:", error);
    return NextResponse.json({ error: "Failed to search videos" }, { status: 500 });
  }
}
