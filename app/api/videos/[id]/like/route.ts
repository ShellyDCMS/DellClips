import { auth } from "@/lib/auth";
import { databaseService } from "@/lib/services";
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

    // Verify video exists
    const video = await databaseService.getVideoById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    await databaseService.likeVideo(session.user.id, id);

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

    return NextResponse.json({ liked: false });
  } catch (error) {
    console.error("[api/videos/[id]/like] DELETE error:", error);
    return NextResponse.json({ error: "Failed to unlike video" }, { status: 500 });
  }
}
