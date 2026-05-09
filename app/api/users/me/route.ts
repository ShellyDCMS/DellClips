import { users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/users/me — Get current user's profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[api/users/me] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

const updateProfileSchema = z.object({
  name: z.string().max(255).optional(),
  bio: z.string().max(150).optional(),
  department: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  image: z.string().optional(),
});

// PUT /api/users/me — Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Validate avatar size (base64 images can be large)
    if (parsed.data.image && parsed.data.image.startsWith("data:")) {
      const sizeInBytes = (parsed.data.image.length * 3) / 4;
      const maxSizeBytes = 1 * 1024 * 1024; // 1MB max
      if (sizeInBytes > maxSizeBytes) {
        return NextResponse.json(
          { error: "Profile picture must be under 1MB" },
          { status: 400 }
        );
      }
    }

    await db
      .update(users)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    revalidatePath("/feed");
    revalidatePath("/profile/me");

    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error("[api/users/me] PUT error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
