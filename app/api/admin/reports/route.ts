import { auth } from "@/lib/auth";
import { databaseService, videoService } from "@/lib/services";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/admin/reports — Get all pending reports
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await databaseService.getUserById(session.user.id);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reports = await databaseService.getPendingReports();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[api/admin/reports] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

// PUT /api/admin/reports — Update report status (dismiss or action)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await databaseService.getUserById(session.user.id);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reportId, action, videoId } = await request.json();

    if (!reportId || !action) {
      return NextResponse.json(
        { error: "reportId and action are required" },
        { status: 400 }
      );
    }

    if (action === "dismiss") {
      await databaseService.updateReportStatus(reportId, "dismissed", session.user.id);
    } else if (action === "remove_video") {
      // Update report status
      await databaseService.updateReportStatus(reportId, "actioned", session.user.id);

      // Delete the video from the database (cascades to likes, comments)
      if (videoId) {
        // Try to delete from video provider too
        try {
          const video = await databaseService.getVideoById(videoId);
          if (video) {
            await videoService.deleteVideo(video.videoPlaybackId);
          }
        } catch (err) {
          console.error("[admin/reports] Failed to delete from video provider:", err);
        }

        await databaseService.deleteVideo(videoId);
      }
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'dismiss' or 'remove_video'" },
        { status: 400 }
      );
    }

    revalidatePath("/admin/reports");
    revalidatePath("/feed");

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("[api/admin/reports] PUT error:", error);
    return NextResponse.json({ error: "Failed to process report" }, { status: 500 });
  }
}
