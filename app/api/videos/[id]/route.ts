import { auth } from "@/lib/auth";
import { databaseService, videoService } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

// ============================================
// GET /api/videos/:id — Get a single video
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const video = await databaseService.getVideoById(id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const hasLiked = await databaseService.hasUserLikedVideo(session.user.id, video.id);

    return NextResponse.json({
      ...video,
      playbackUrl: videoService.getPlaybackUrl(video.videoPlaybackId),
      hasLiked,
    });
  } catch (error) {
    console.error("[api/videos/[id]] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 });
  }
}

// ============================================
// DELETE /api/videos/:id — Delete own video
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const video = await databaseService.getVideoById(id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Only the video owner can delete it
    if (video.author.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from Cloudflare Stream
    try {
      await videoService.deleteVideo(video.videoPlaybackId);
    } catch (err) {
      console.error("[api/videos/[id]] Failed to delete from video provider:", err);
      // Continue deleting from DB even if provider deletion fails
    }

    // Delete from database (cascades to likes, comments, reports)
    await databaseService.deleteVideo(id);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[api/videos/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
