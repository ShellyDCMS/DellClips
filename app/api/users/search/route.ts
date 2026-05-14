import { auth } from "@/lib/auth";
import { databaseService } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

// ============================================
// GET /api/users/search?q=... — Search users by name or email
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ users: [] });
    }

    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
    const users = await databaseService.searchUsers(query.trim(), limit);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[api/users/search] GET error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
