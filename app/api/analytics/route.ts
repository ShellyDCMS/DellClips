import { analyticsEvents } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const { eventType, videoId, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ error: "eventType is required" }, { status: 400 });
    }

    await db.insert(analyticsEvents).values({
      userId: session?.user?.id || null,
      eventType,
      videoId: videoId || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    return NextResponse.json({ tracked: true });
  } catch (error) {
    console.error("[analytics] Error:", error);
    return NextResponse.json({ tracked: false }, { status: 500 });
  }
}
