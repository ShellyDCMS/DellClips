import {
  appConfig,
  comments,
  follows,
  hashtags,
  hashtagSubscriptions,
  likes,
  reports,
  users,
  videoHashtags,
  videos,
} from "@/drizzle/schema";
import { db } from "@/lib/db";
import type {
  CreateFollowInput,
  CreateReportInput,
  DatabaseService,
  FeedOptions,
  SearchVideosInput,
  VideoWithAuthor,
} from "@/lib/ports/database-service";
import { displayNameFromEmail } from "@/lib/utils";
import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

export class NeonDatabaseService implements DatabaseService {
  // ============================================
  // VIDEOS
  // ============================================

  async getVideoFeed(options: FeedOptions): Promise<VideoWithAuthor[]> {
    const { userId, limit = 20, offset = 0 } = options;

    let followingIds: string[] = [];
    let hashtagVideoIds: string[] = [];

    if (userId) {
      followingIds = await this.getFollowingIds(userId);

      // Get subscribed hashtag IDs
      const subscribedHashtags = await db
        .select({ hashtagId: hashtagSubscriptions.hashtagId })
        .from(hashtagSubscriptions)
        .where(eq(hashtagSubscriptions.userId, userId));
      const subscribedHashtagIds = subscribedHashtags.map((h) => h.hashtagId);

      // Get video IDs that match subscribed hashtags
      if (subscribedHashtagIds.length > 0) {
        const hashtagVideos = await db
          .select({ videoId: videoHashtags.videoId })
          .from(videoHashtags)
          .where(inArray(videoHashtags.hashtagId, subscribedHashtagIds));
        hashtagVideoIds = hashtagVideos.map((v) => v.videoId);
      }
    }

    const result = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        videoPlaybackId: videos.videoPlaybackId,
        status: videos.status,
        duration: videos.duration,
        likeCount: videos.likeCount,
        commentCount: videos.commentCount,
        createdAt: videos.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorAvatarUrl: users.image,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(eq(videos.status, "ready"))
      .orderBy(
        ...(followingIds.length > 0 || hashtagVideoIds.length > 0
          ? [
              sql`CASE
                WHEN ${videos.userId} IN (${
                  followingIds.length > 0
                    ? sql.join(
                        followingIds.map((id) => sql`${id}`),
                        sql`, `
                      )
                    : sql`NULL`
                }) THEN 0
                WHEN ${videos.id} IN (${
                  hashtagVideoIds.length > 0
                    ? sql.join(
                        hashtagVideoIds.map((id) => sql`${id}`),
                        sql`, `
                      )
                    : sql`NULL`
                }) THEN 1
                ELSE 2
              END`,
              desc(videos.createdAt),
            ]
          : [desc(videos.createdAt)])
      )
      .limit(limit)
      .offset(offset);

    return this.enrichWithHashtags(result);
  }

  async getVideoById(videoId: string): Promise<VideoWithAuthor | null> {
    const result = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        videoPlaybackId: videos.videoPlaybackId,
        status: videos.status,
        duration: videos.duration,
        likeCount: videos.likeCount,
        commentCount: videos.commentCount,
        createdAt: videos.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(eq(videos.id, videoId))
      .limit(1);

    if (result.length === 0) return null;

    const enriched = await this.enrichWithHashtags(result);
    return enriched[0];
  }

  async getVideosByUserId(userId: string): Promise<VideoWithAuthor[]> {
    const result = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        videoPlaybackId: videos.videoPlaybackId,
        status: videos.status,
        duration: videos.duration,
        likeCount: videos.likeCount,
        commentCount: videos.commentCount,
        createdAt: videos.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(and(eq(videos.userId, userId), eq(videos.status, "ready")))
      .orderBy(desc(videos.createdAt));

    return this.enrichWithHashtags(result);
  }

  async createVideoRecord(data: {
    userId: string;
    title?: string;
    description?: string;
    videoAssetId: string;
    videoPlaybackId: string;
    videoUploadId?: string;
    hashtags?: string[];
  }): Promise<{ id: string }> {
    const [video] = await db
      .insert(videos)
      .values({
        userId: data.userId,
        title: data.title,
        description: data.description,
        videoAssetId: data.videoAssetId,
        videoPlaybackId: data.videoPlaybackId,
        videoUploadId: data.videoUploadId,
      })
      .returning({ id: videos.id });

    if (data.hashtags && data.hashtags.length > 0) {
      await this.attachHashtags(video.id, data.hashtags);
    }

    return video;
  }

  async updateVideoStatus(
    videoAssetId: string,
    status: string,
    duration?: number
  ): Promise<void> {
    await db
      .update(videos)
      .set({
        status,
        ...(duration !== undefined ? { duration } : {}),
      })
      .where(eq(videos.videoAssetId, videoAssetId));
  }

  async deleteVideo(videoId: string): Promise<void> {
    await db.delete(videos).where(eq(videos.id, videoId));
  }

  // ============================================
  // LIKES
  // ============================================

  async likeVideo(userId: string, videoId: string): Promise<void> {
    await db.insert(likes).values({ userId, videoId }).onConflictDoNothing();
    await db
      .update(videos)
      .set({ likeCount: sql`${videos.likeCount} + 1` })
      .where(eq(videos.id, videoId));
  }

  async unlikeVideo(userId: string, videoId: string): Promise<void> {
    const deleted = await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.videoId, videoId)))
      .returning();

    if (deleted.length > 0) {
      await db
        .update(videos)
        .set({ likeCount: sql`GREATEST(${videos.likeCount} - 1, 0)` })
        .where(eq(videos.id, videoId));
    }
  }

  async hasUserLikedVideo(userId: string, videoId: string): Promise<boolean> {
    const result = await db
      .select({ id: likes.id })
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.videoId, videoId)))
      .limit(1);

    return result.length > 0;
  }

  // ============================================
  // COMMENTS
  // ============================================

  async getCommentsByVideoId(videoId: string) {
    const result = await db
      .select({
        id: comments.id,
        text: comments.text,
        createdAt: comments.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.videoId, videoId))
      .orderBy(desc(comments.createdAt));

    return result.map((r) => ({
      id: r.id,
      text: r.text,
      createdAt: r.createdAt,
      author: {
        id: r.authorId,
        name: r.authorName || displayNameFromEmail(r.authorEmail),
        avatarUrl: r.authorAvatarUrl,
      },
    }));
  }

  async createComment(
    userId: string,
    videoId: string,
    text: string
  ): Promise<{ id: string }> {
    const [comment] = await db
      .insert(comments)
      .values({ userId, videoId, text })
      .returning({ id: comments.id });

    await db
      .update(videos)
      .set({ commentCount: sql`${videos.commentCount} + 1` })
      .where(eq(videos.id, videoId));

    return comment;
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const deleted = await db
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
      .returning({ videoId: comments.videoId });

    if (deleted.length > 0) {
      await db
        .update(videos)
        .set({ commentCount: sql`GREATEST(${videos.commentCount} - 1, 0)` })
        .where(eq(videos.id, deleted[0].videoId));
    }
  }

  // ============================================
  // REPORTS
  // ============================================

  async createReport(input: CreateReportInput): Promise<{ id: string }> {
    const [report] = await db
      .insert(reports)
      .values({
        userId: input.userId,
        videoId: input.videoId,
        reason: input.reason,
        description: input.description,
      })
      .returning({ id: reports.id });

    return report;
  }

  async getReportsByVideoId(videoId: string) {
    const result = await db
      .select({
        id: reports.id,
        reason: reports.reason,
        description: reports.description,
        status: reports.status,
        createdAt: reports.createdAt,
        reportedById: users.id,
        reportedByName: users.name,
        reportedByEmail: users.email,
      })
      .from(reports)
      .innerJoin(users, eq(reports.userId, users.id))
      .where(eq(reports.videoId, videoId))
      .orderBy(desc(reports.createdAt));

    return result.map((r) => ({
      id: r.id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
      reportedBy: {
        id: r.reportedById,
        name: r.reportedByName,
        email: r.reportedByEmail,
      },
    }));
  }

  async getPendingReports() {
    const result = await db
      .select({
        id: reports.id,
        reason: reports.reason,
        description: reports.description,
        status: reports.status,
        createdAt: reports.createdAt,
        videoId: videos.id,
        videoTitle: videos.title,
        reportedById: users.id,
        reportedByName: users.name,
        reportedByEmail: users.email,
      })
      .from(reports)
      .innerJoin(videos, eq(reports.videoId, videos.id))
      .innerJoin(users, eq(reports.userId, users.id))
      .where(eq(reports.status, "pending"))
      .orderBy(desc(reports.createdAt));

    return result.map((r) => ({
      id: r.id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
      video: { id: r.videoId, title: r.videoTitle },
      reportedBy: {
        id: r.reportedById,
        name: r.reportedByName,
        email: r.reportedByEmail,
      },
    }));
  }

  async updateReportStatus(
    reportId: string,
    status: string,
    reviewedBy: string
  ): Promise<void> {
    await db
      .update(reports)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(reports.id, reportId));
  }

  // ============================================
  // FOLLOWS
  // ============================================

  async followUser(input: CreateFollowInput): Promise<void> {
    await db
      .insert(follows)
      .values({
        followerId: input.followerId,
        followingId: input.followingId,
      })
      .onConflictDoNothing();
  }

  async unfollowUser(input: CreateFollowInput): Promise<void> {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, input.followerId),
          eq(follows.followingId, input.followingId)
        )
      );
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .select({ id: follows.id })
      .from(follows)
      .where(
        and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
      )
      .limit(1);

    return result.length > 0;
  }

  async getFollowerCount(userId: string): Promise<number> {
    const result = await db
      .select({ value: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));

    return result[0].value;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const result = await db
      .select({ value: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return result[0].value;
  }

  async getFollowingIds(userId: string): Promise<string[]> {
    const result = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return result.map((r) => r.followingId);
  }

  // ============================================
  // SEARCH & HASHTAGS
  // ============================================

  async searchVideos(input: SearchVideosInput): Promise<VideoWithAuthor[]> {
    const { query, limit = 20, offset = 0 } = input;
    const searchTerm = `%${query.toLowerCase()}%`;

    const result = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        videoPlaybackId: videos.videoPlaybackId,
        status: videos.status,
        duration: videos.duration,
        likeCount: videos.likeCount,
        commentCount: videos.commentCount,
        createdAt: videos.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(
        and(
          eq(videos.status, "ready"),
          or(ilike(videos.title, searchTerm), ilike(videos.description, searchTerm))
        )
      )
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset);

    return this.enrichWithHashtags(result);
  }

  async getVideosByHashtag(
    hashtag: string,
    limit = 20,
    offset = 0
  ): Promise<VideoWithAuthor[]> {
    const normalizedHashtag = hashtag.toLowerCase().replace(/^#/, "");

    const result = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        videoPlaybackId: videos.videoPlaybackId,
        status: videos.status,
        duration: videos.duration,
        likeCount: videos.likeCount,
        commentCount: videos.commentCount,
        createdAt: videos.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .innerJoin(videoHashtags, eq(videos.id, videoHashtags.videoId))
      .innerJoin(hashtags, eq(videoHashtags.hashtagId, hashtags.id))
      .where(and(eq(videos.status, "ready"), eq(hashtags.name, normalizedHashtag)))
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset);

    return this.enrichWithHashtags(result);
  }

  async getTrendingHashtags(limit = 10): Promise<{ name: string; count: number }[]> {
    const result = await db
      .select({
        name: hashtags.name,
        count: count(),
      })
      .from(hashtags)
      .innerJoin(videoHashtags, eq(hashtags.id, videoHashtags.hashtagId))
      .innerJoin(videos, eq(videoHashtags.videoId, videos.id))
      .where(eq(videos.status, "ready"))
      .groupBy(hashtags.name)
      .orderBy(desc(count()))
      .limit(limit);

    return result.map((r) => ({ name: r.name, count: r.count }));
  }

  // ============================================
  // HASHTAG SUBSCRIPTIONS
  // ============================================

  async subscribeToHashtag(userId: string, hashtagName: string): Promise<void> {
    // Find or create the hashtag
    let hashtagId: string;
    const [existing] = await db
      .select({ id: hashtags.id })
      .from(hashtags)
      .where(eq(hashtags.name, hashtagName))
      .limit(1);

    if (existing) {
      hashtagId = existing.id;
    } else {
      const [created] = await db
        .insert(hashtags)
        .values({ name: hashtagName })
        .returning({ id: hashtags.id });
      hashtagId = created.id;
    }

    await db
      .insert(hashtagSubscriptions)
      .values({ userId, hashtagId })
      .onConflictDoNothing();
  }

  async unsubscribeFromHashtag(userId: string, hashtagName: string): Promise<void> {
    const [hashtag] = await db
      .select({ id: hashtags.id })
      .from(hashtags)
      .where(eq(hashtags.name, hashtagName))
      .limit(1);

    if (hashtag) {
      await db
        .delete(hashtagSubscriptions)
        .where(
          and(
            eq(hashtagSubscriptions.userId, userId),
            eq(hashtagSubscriptions.hashtagId, hashtag.id)
          )
        );
    }
  }

  async isSubscribedToHashtag(userId: string, hashtagName: string): Promise<boolean> {
    const [hashtag] = await db
      .select({ id: hashtags.id })
      .from(hashtags)
      .where(eq(hashtags.name, hashtagName))
      .limit(1);

    if (!hashtag) return false;

    const result = await db
      .select({ id: hashtagSubscriptions.id })
      .from(hashtagSubscriptions)
      .where(
        and(
          eq(hashtagSubscriptions.userId, userId),
          eq(hashtagSubscriptions.hashtagId, hashtag.id)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  async getSubscribedHashtags(userId: string): Promise<{ name: string }[]> {
    const result = await db
      .select({ name: hashtags.name })
      .from(hashtagSubscriptions)
      .innerJoin(hashtags, eq(hashtagSubscriptions.hashtagId, hashtags.id))
      .where(eq(hashtagSubscriptions.userId, userId));

    return result;
  }

  // ============================================
  // USERS
  // ============================================

  async getUserById(userId: string) {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return result[0] || null;
  }

  async getUserByEmail(email: string) {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] || null;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async attachHashtags(videoId: string, hashtagNames: string[]): Promise<void> {
    for (const rawName of hashtagNames) {
      const name = rawName.toLowerCase().replace(/^#/, "").trim();
      if (!name) continue;

      // Upsert hashtag
      const [hashtag] = await db
        .insert(hashtags)
        .values({ name })
        .onConflictDoNothing()
        .returning({ id: hashtags.id });

      // If onConflictDoNothing returned nothing, fetch the existing one
      let hashtagId = hashtag?.id;
      if (!hashtagId) {
        const existing = await db
          .select({ id: hashtags.id })
          .from(hashtags)
          .where(eq(hashtags.name, name))
          .limit(1);
        hashtagId = existing[0]?.id;
      }

      if (hashtagId) {
        await db
          .insert(videoHashtags)
          .values({ videoId, hashtagId })
          .onConflictDoNothing();
      }
    }
  }

  private async enrichWithHashtags(
    videoRows: {
      id: string;
      title: string | null;
      description: string | null;
      videoPlaybackId: string;
      status: string;
      duration: number | null;
      likeCount: number;
      commentCount: number;
      createdAt: Date;
      authorId: string;
      authorName: string | null;
      authorEmail: string;
      authorAvatarUrl: string | null;
    }[]
  ): Promise<VideoWithAuthor[]> {
    if (videoRows.length === 0) return [];

    const videoIds = videoRows.map((v) => v.id);

    const hashtagRows = await db
      .select({
        videoId: videoHashtags.videoId,
        hashtagName: hashtags.name,
      })
      .from(videoHashtags)
      .innerJoin(hashtags, eq(videoHashtags.hashtagId, hashtags.id))
      .where(inArray(videoHashtags.videoId, videoIds));

    const hashtagMap = new Map<string, string[]>();
    for (const row of hashtagRows) {
      const existing = hashtagMap.get(row.videoId) || [];
      existing.push(row.hashtagName);
      hashtagMap.set(row.videoId, existing);
    }

    return videoRows.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      videoPlaybackId: v.videoPlaybackId,
      status: v.status,
      duration: v.duration,
      likeCount: v.likeCount,
      commentCount: v.commentCount,
      createdAt: v.createdAt,
      author: {
        id: v.authorId,
        name: v.authorName || displayNameFromEmail(v.authorEmail),
        email: v.authorEmail,
        avatarUrl: v.authorAvatarUrl,
      },
      hashtags: hashtagMap.get(v.id) || [],
    }));
  }

  // ============================================
  // APP CONFIGURATION
  // ============================================

  async getConfigValue(key: string): Promise<string | null> {
    const result = await db
      .select({ value: appConfig.value })
      .from(appConfig)
      .where(eq(appConfig.key, key))
      .limit(1);

    return result[0]?.value || null;
  }

  async setConfigValue(key: string, value: string, updatedBy: string): Promise<void> {
    const [existing] = await db
      .select({ id: appConfig.id })
      .from(appConfig)
      .where(eq(appConfig.key, key))
      .limit(1);

    if (existing) {
      await db
        .update(appConfig)
        .set({ value, updatedBy, updatedAt: new Date() })
        .where(eq(appConfig.key, key));
    } else {
      await db.insert(appConfig).values({ key, value, updatedBy });
    }
  }

  async getAllConfig(): Promise<
    {
      key: string;
      value: string;
      description: string | null;
      updatedAt: Date;
    }[]
  > {
    return await db
      .select({
        key: appConfig.key,
        value: appConfig.value,
        description: appConfig.description,
        updatedAt: appConfig.updatedAt,
      })
      .from(appConfig)
      .orderBy(appConfig.key);
  }
}
