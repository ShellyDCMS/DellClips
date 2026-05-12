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

    const currentUser = await databaseService.getUserById(session.user.id);
    if (video.author.id !== session.user.id && currentUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Step 1: Delete from Cloudflare Stream
    // Use videoAssetId — this is the Cloudflare Stream UID
    const assetId = video.videoPlaybackId;
    console.log(
      `[delete] Attempting to delete video from provider. Asset ID: ${assetId}`
    );

    let providerDeleteSuccess = false;
    try {
      await videoService.deleteVideo(assetId);
      providerDeleteSuccess = true;
      console.log(`[delete] Successfully deleted ${assetId} from video provider`);
    } catch (err) {
      console.error(`[delete] FAILED to delete ${assetId} from video provider:`, err);
      // Don't return error — still delete from DB
      // But log it clearly so we can investigate
    }

    // Step 2: Delete from database
    await databaseService.deleteVideo(id);
    console.log(`[delete] Deleted video ${id} from database`);

    revalidatePath("/feed");
    revalidatePath(`/profile/${session.user.id}`);

    return NextResponse.json({
      deleted: true,
      providerDeleted: providerDeleteSuccess,
    });
  } catch (error) {
    console.error("[api/videos/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
