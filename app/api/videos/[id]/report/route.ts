import { auth } from "@/lib/auth";
import { databaseService } from "@/lib/services";
import { REPORT_REASONS } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS.map((r) => r.code) as [string, ...string[]]),
  description: z.string().max(1000).optional(),
});

// ============================================
// POST /api/videos/:id/report — Report a video
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
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);

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

    const report = await databaseService.createReport({
      userId: session.user.id,
      videoId: id,
      reason: parsed.data.reason,
      description: parsed.data.description,
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("[api/videos/[id]/report] POST error:", error);
    return NextResponse.json({ error: "Failed to report video" }, { status: 500 });
  }
}
