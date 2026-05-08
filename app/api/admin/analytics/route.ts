import { analyticsEvents, users, videos } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { databaseService } from "@/lib/services";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await databaseService.getUserById(session.user.id);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30", 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Total users
    const [totalUsers] = await db.select({ count: count() }).from(users);

    // Total videos
    const [totalVideos] = await db
      .select({ count: count() })
      .from(videos)
      .where(eq(videos.status, "ready"));

    // Events in period
    const eventCounts = await db
      .select({
        eventType: analyticsEvents.eventType,
        count: count(),
      })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since))
      .groupBy(analyticsEvents.eventType)
      .orderBy(desc(count()));

    // Daily active users (unique users with events per day)
    const dailyActiveUsers = await db
      .select({
        date: sql<string>`DATE(${analyticsEvents.createdAt})`.as("date"),
        count: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})`.as("count"),
      })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since))
      .groupBy(sql`DATE(${analyticsEvents.createdAt})`)
      .orderBy(sql`DATE(${analyticsEvents.createdAt})`);

    // Most watched videos
    const topVideos = await db
      .select({
        videoId: analyticsEvents.videoId,
        title: videos.title,
        views: count(),
      })
      .from(analyticsEvents)
      .innerJoin(videos, eq(analyticsEvents.videoId, videos.id))
      .where(
        sql`${analyticsEvents.eventType} = 'video_view' AND ${analyticsEvents.createdAt} >= ${since}`
      )
      .groupBy(analyticsEvents.videoId, videos.title)
      .orderBy(desc(count()))
      .limit(10);

    // Most active users
    const topUsers = await db
      .select({
        userId: analyticsEvents.userId,
        email: users.email,
        name: users.name,
        eventCount: count(),
      })
      .from(analyticsEvents)
      .innerJoin(users, eq(analyticsEvents.userId, users.id))
      .where(gte(analyticsEvents.createdAt, since))
      .groupBy(analyticsEvents.userId, users.email, users.name)
      .orderBy(desc(count()))
      .limit(10);

    // Recent events
    const recentEvents = await db
      .select({
        id: analyticsEvents.id,
        eventType: analyticsEvents.eventType,
        createdAt: analyticsEvents.createdAt,
        userEmail: users.email,
        videoTitle: videos.title,
      })
      .from(analyticsEvents)
      .leftJoin(users, eq(analyticsEvents.userId, users.id))
      .leftJoin(videos, eq(analyticsEvents.videoId, videos.id))
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(20);

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      overview: {
        totalUsers: totalUsers.count,
        totalVideos: totalVideos.count,
        totalEvents: eventCounts.reduce((sum, e) => sum + e.count, 0),
      },
      eventCounts,
      dailyActiveUsers,
      topVideos,
      topUsers,
      recentEvents,
    });
  } catch (error) {
    console.error("[api/admin/analytics] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
