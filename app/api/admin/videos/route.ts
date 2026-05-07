import { auth } from "@/lib/auth";
import { databaseService } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const adminUploadSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  videoAssetId: z.string().min(1),
  videoPlaybackId: z.string().min(1),
  hashtags: z.array(z.string().max(100)).max(10).optional(),
  // Admin specifies which user to attribute the video to
  userEmail: z.string().email(),
});

// POST /api/admin/videos — Upload a video on behalf of another user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the requester is an admin
    const currentUser = await databaseService.getUserById(session.user.id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = adminUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Find the target user by email
    const targetUser = await databaseService.getUserByEmail(parsed.data.userEmail);

    if (!targetUser) {
      return NextResponse.json(
        { error: `User not found: ${parsed.data.userEmail}` },
        { status: 404 }
      );
    }

    // Create the video record attributed to the target user
    const video = await databaseService.createVideoRecord({
      userId: targetUser.id, // ← This is the key: video is attributed to them
      title: parsed.data.title,
      description: parsed.data.description,
      videoAssetId: parsed.data.videoAssetId,
      videoPlaybackId: parsed.data.videoPlaybackId,
      hashtags: parsed.data.hashtags,
    });

    console.log(
      `[admin] Video "${parsed.data.title}" created for user ${parsed.data.userEmail} by admin ${session.user.id}`
    );

    return NextResponse.json(
      { video, attributedTo: parsed.data.userEmail },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/admin/videos] POST error:", error);
    return NextResponse.json({ error: "Failed to create video" }, { status: 500 });
  }
}
