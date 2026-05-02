import {
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ============================================
// USERS
// ============================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// VIDEOS (vendor-neutral column names)
// ============================================
export const videos = pgTable(
  "videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }),
    description: text("description"),
    videoAssetId: varchar("video_asset_id", { length: 255 }).unique().notNull(),
    videoPlaybackId: varchar("video_playback_id", { length: 255 })
      .unique()
      .notNull(),
    videoUploadId: varchar("video_upload_id", { length: 255 }),
    status: varchar("status", { length: 20 }).default("processing").notNull(),
    duration: real("duration"),
    likeCount: integer("like_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_videos_user_id").on(table.userId),
    statusIdx: index("idx_videos_status").on(table.status),
    createdAtIdx: index("idx_videos_created_at").on(table.createdAt),
  })
);

// ============================================
// LIKES
// ============================================
export const likes = pgTable(
  "likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserVideo: unique().on(table.userId, table.videoId),
    videoIdIdx: index("idx_likes_video_id").on(table.videoId),
  })
);

// ============================================
// COMMENTS
// ============================================
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    videoIdIdx: index("idx_comments_video_id").on(table.videoId),
    createdAtIdx: index("idx_comments_created_at").on(table.createdAt),
  })
);

// ============================================
// REPORTS (user-driven content moderation)
// ============================================
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    reason: varchar("reason", { length: 50 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    videoIdIdx: index("idx_reports_video_id").on(table.videoId),
    statusIdx: index("idx_reports_status").on(table.status),
  })
);

// ============================================
// FOLLOWS (user-to-user subscriptions)
// ============================================
export const follows = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueFollow: unique().on(table.followerId, table.followingId),
    followerIdx: index("idx_follows_follower").on(table.followerId),
    followingIdx: index("idx_follows_following").on(table.followingId),
  })
);

// ============================================
// HASHTAGS
// ============================================
export const hashtags = pgTable(
  "hashtags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).unique().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("idx_hashtags_name").on(table.name),
  })
);

// ============================================
// VIDEO_HASHTAGS (many-to-many junction)
// ============================================
export const videoHashtags = pgTable(
  "video_hashtags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    hashtagId: uuid("hashtag_id")
      .notNull()
      .references(() => hashtags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueVideoHashtag: unique().on(table.videoId, table.hashtagId),
    videoIdIdx: index("idx_video_hashtags_video").on(table.videoId),
    hashtagIdIdx: index("idx_video_hashtags_hashtag").on(table.hashtagId),
  })
);

// ============================================
// AUTH.JS REQUIRED TABLES
// ============================================

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (table) => ({
    compoundKey: unique().on(table.provider, table.providerAccountId),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: varchar("sessionToken", { length: 255 }).primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compoundKey: unique().on(table.identifier, table.token),
  })
);