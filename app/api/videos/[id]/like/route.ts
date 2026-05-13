import { auth } from "@/lib/auth";
import { databaseService, notificationService } from "@/lib/services";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// ============================================
// POST /api/videos/:id/like — Like a video
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Prevent self-likes
    const video = await databaseService.getVideoById(id);
    if (video && video.author.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot like your own video" },
        { status: 403 }
      );
    }

    await databaseService.likeVideo(session.user.id, id);
    if (video && video.author.id !== session.user.id) {
      const liker = await databaseService.getUserById(session.user.id);
      await notificationService.sendToUser(video.author.id, {
        title: "New Like ❤️",
        body: `${liker?.name || "Someone"} liked your video "${video.title || "Untitled"}"`,
        url: `/feed?video=${id}`,
        tag: `like-${id}`,
      });
    }
    revalidatePath("/feed");

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("[api/videos/[id]/like] POST error:", error);
    return NextResponse.json({ error: "Failed to like video" }, { status: 500 });
  }
}

// ============================================
// DELETE /api/videos/:id/like — Unlike a video
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

    await databaseService.unlikeVideo(session.user.id, id);
    revalidatePath("/feed");

    return NextResponse.json({ liked: false });
  } catch (error) {
    console.error("[api/videos/[id]/like] DELETE error:", error);
    return NextResponse.json({ error: "Failed to unlike video" }, { status: 500 });
  }
}
