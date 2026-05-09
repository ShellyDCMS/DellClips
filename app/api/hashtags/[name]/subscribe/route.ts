import { auth } from "@/lib/auth";
import { databaseService } from "@/lib/services";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// POST /api/hashtags/:name/subscribe — Subscribe to a hashtag
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await params;
    const normalizedName = name.toLowerCase().replace(/^#/, "");

    await databaseService.subscribeToHashtag(session.user.id, normalizedName);
    revalidatePath("/feed");
    revalidatePath("/search");
    return NextResponse.json({ subscribed: true });
  } catch (error) {
    console.error("[api/hashtags/subscribe] POST error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

// DELETE /api/hashtags/:name/subscribe — Unsubscribe from a hashtag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await params;
    const normalizedName = name.toLowerCase().replace(/^#/, "");

    await databaseService.unsubscribeFromHashtag(session.user.id, normalizedName);
    revalidatePath("/feed");
    revalidatePath("/search");
    return NextResponse.json({ subscribed: false });
  } catch (error) {
    console.error("[api/hashtags/subscribe] DELETE error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
