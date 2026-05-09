import { auth } from "@/lib/auth";
import { databaseService, videoService } from "@/lib/services";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";
export const dynamic = "force-dynamic";
export const revalidate = 0;
// ============================================
// GET /api/videos — Fetch video feed
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const videos = await databaseService.getVideoFeed({
      userId: session.user.id,
      limit: Math.min(limit, 50), // Cap at 50
      offset,
    });

    const enrichedVideos = await Promise.all(
      videos.map(async (video) => {
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
        };
      })
    );

    return NextResponse.json({
      videos: enrichedVideos,
      hasMore: videos.length === limit,
    });
  } catch (error) {
    console.error("[api/videos] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

// ============================================
// POST /api/videos — Create a new video record
// ============================================
const createVideoSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  videoAssetId: z.string().min(1),
  videoPlaybackId: z.string().min(1),
  videoUploadId: z.string().optional(),
  hashtags: z.array(z.string().max(100)).max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createVideoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const video = await databaseService.createVideoRecord({
      userId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      videoAssetId: parsed.data.videoAssetId,
      videoPlaybackId: parsed.data.videoPlaybackId,
      videoUploadId: parsed.data.videoUploadId,
      hashtags: parsed.data.hashtags,
    });

    revalidatePath("/feed");
    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("[api/videos] POST error:", error);
    return NextResponse.json({ error: "Failed to create video" }, { status: 500 });
  }
}
