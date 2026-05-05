import { auth } from "@/lib/auth";
import { videoService } from "@/lib/services";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uploadUrl, assetId } = await videoService.createUploadUrl(session.user.id);

    return NextResponse.json({ uploadUrl, assetId });
  } catch (error) {
    console.error("[api/video/upload-url] Error:", error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
