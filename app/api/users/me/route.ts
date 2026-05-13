import { users } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
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

    // Compress avatar server-side with sharp
    let imageToSave = parsed.data.image;
    if (imageToSave && imageToSave.startsWith("data:")) {
      try {
        const base64Data = imageToSave.split(",")[1];
        const inputBuffer = Buffer.from(base64Data, "base64");
        const compressedBuffer = await sharp(inputBuffer)
          .resize(256, 256, { fit: "cover" })
          .jpeg({ quality: 70 })
          .toBuffer();
        imageToSave = `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`;
      } catch (compressError) {
        console.error("[api/users/me] Image compression error:", compressError);
        return NextResponse.json(
          { error: "Failed to process profile picture" },
          { status: 400 }
        );
      }
    }

    await db
      .update(users)
      .set({
        ...parsed.data,
        ...(imageToSave !== undefined ? { image: imageToSave } : {}),
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
