import { auth } from "@/lib/auth";
import { databaseService, notificationService } from "@/lib/services";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ============================================
// GET /api/videos/:id/comments — Get comments
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
    const comments = await databaseService.getCommentsByVideoId(id);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("[api/videos/[id]/comments] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// ============================================
// POST /api/videos/:id/comments — Add comment
// ============================================
const commentSchema = z.object({
  text: z.string().min(1).max(1000),
});

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
    const body = await request.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify video exists
    const video = await databaseService.getVideoById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const comment = await databaseService.createComment(
      session.user.id,
      id,
      parsed.data.text
    );

    if (video && video.author.id !== session.user.id) {
      const commenter = await databaseService.getUserById(session.user.id);
      await notificationService.sendToUser(video.author.id, {
        title: "New Comment 💬",
        body: `${commenter?.name || "Someone"} commented on your video`,
        url: `/feed?video=${id}`,
        tag: `comment-${id}`,
      });
    }
    revalidatePath("/feed");

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("[api/videos/[id]/comments] POST error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
