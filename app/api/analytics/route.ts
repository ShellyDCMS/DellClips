import { analyticsEvents } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const { eventType, videoId, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ error: "eventType is required" }, { status: 400 });
    }

    // Validate videoId is a valid UUID before inserting
    // Cloudflare UIDs are NOT valid PostgreSQL UUIDs
    const isValidUuid =
      videoId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId);

    try {
      await db.insert(analyticsEvents).values({
        userId: session?.user?.id || null,
        eventType,
        videoId: isValidUuid ? videoId : null,
        metadata: metadata
          ? JSON.stringify({
              ...metadata,
              ...(videoId && !isValidUuid ? { rawVideoId: videoId } : {}),
            })
          : videoId && !isValidUuid
            ? JSON.stringify({ rawVideoId: videoId })
            : null,
      });
    } catch (dbError) {
      // If the insert fails (e.g., foreign key violation),
      // retry without the videoId
      console.warn("[analytics] FK error, retrying without videoId:", dbError);
      await db.insert(analyticsEvents).values({
        userId: session?.user?.id || null,
        eventType,
        videoId: null,
        metadata: metadata
          ? JSON.stringify({ ...metadata, rawVideoId: videoId })
          : JSON.stringify({ rawVideoId: videoId }),
      });
    }

    return NextResponse.json({ tracked: true });
  } catch (error) {
    console.error("[analytics] Error:", error);
    // Analytics should NEVER return 500 — it must not break the app
    return NextResponse.json({ tracked: false }, { status: 200 });
  }
}
