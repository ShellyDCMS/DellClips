import { auth } from "@/lib/auth";
import { databaseService, videoService } from "@/lib/services";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
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

    // Only the video owner or an admin can delete
    const currentUser = await databaseService.getUserById(session.user.id);
    if (video.author.id !== session.user.id && currentUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Step 1: Delete from Cloudflare Stream
    try {
      // Use the asset ID (Cloudflare Stream UID) for deletion
      await videoService.deleteVideo(video.videoPlaybackId);
      console.log(
        `[delete] Video ${video.videoPlaybackId} deleted from Cloudflare Stream`
      );
    } catch (err) {
      // Log but don't fail — we still want to remove from our database
      // The video might have already been deleted from Cloudflare,
      // or it might be a demo/gdrive video that doesn't exist there
      console.error(
        "[delete] Failed to delete from video provider (continuing with DB deletion):",
        err
      );
    }

    // Step 2: Delete from database (cascades to likes, comments, reports)
    await databaseService.deleteVideo(id);
    console.log(`[delete] Video ${id} deleted from database`);

    revalidatePath("/feed");
    revalidatePath(`/profile/${session.user.id}`);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[api/videos/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
