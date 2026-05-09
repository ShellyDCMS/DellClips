import { auth } from "@/lib/auth";
import { databaseService } from "@/lib/services";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// ============================================
// POST /api/users/:id/follow — Follow a user
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

    // Can't follow yourself
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Verify user exists
    const targetUser = await databaseService.getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await databaseService.followUser({
      followerId: session.user.id,
      followingId: id,
    });
    revalidatePath("/feed");
    revalidatePath(`/profile/${id}`);
    return NextResponse.json({ following: true });
  } catch (error) {
    console.error("[api/users/[id]/follow] POST error:", error);
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

// ============================================
// DELETE /api/users/:id/follow — Unfollow a user
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

    await databaseService.unfollowUser({
      followerId: session.user.id,
      followingId: id,
    });
    revalidatePath("/feed");
    revalidatePath(`/profile/${id}`);
    return NextResponse.json({ following: false });
  } catch (error) {
    console.error("[api/users/[id]/follow] DELETE error:", error);
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 });
  }
}
