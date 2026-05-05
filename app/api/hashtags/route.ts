import { auth } from "@/lib/auth";
import { databaseService } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

// ============================================
// GET /api/hashtags — Get trending hashtags
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const hashtags = await databaseService.getTrendingHashtags(Math.min(limit, 50));

    return NextResponse.json({ hashtags });
  } catch (error) {
    console.error("[api/hashtags] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch hashtags" }, { status: 500 });
  }
}
