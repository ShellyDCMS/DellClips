export interface CreateReportInput {
  userId: string;
  videoId: string;
  reason: string;
  description?: string;
}

export interface CreateFollowInput {
  followerId: string;
  followingId: string;
}

export interface SearchVideosInput {
  query: string;
  limit?: number;
  offset?: number;
}

export interface VideoWithAuthor {
  id: string;
  title: string | null;
  description: string | null;
  videoPlaybackId: string;
  status: string;
  duration: number | null;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  hashtags: string[];
}

export interface FeedOptions {
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface DatabaseService {
  // Videos
  getVideoFeed(options: FeedOptions): Promise<VideoWithAuthor[]>;
  getVideoById(videoId: string): Promise<VideoWithAuthor | null>;
  getVideosByUserId(userId: string): Promise<VideoWithAuthor[]>;
  createVideoRecord(data: {
    userId: string;
    title?: string;
    description?: string;
    videoAssetId: string;
    videoPlaybackId: string;
    videoUploadId?: string;
    hashtags?: string[];
  }): Promise<{ id: string }>;
  updateVideoStatus(videoAssetId: string, status: string, duration?: number): Promise<void>;
  deleteVideo(videoId: string): Promise<void>;

  // Likes
  likeVideo(userId: string, videoId: string): Promise<void>;
  unlikeVideo(userId: string, videoId: string): Promise<void>;
  hasUserLikedVideo(userId: string, videoId: string): Promise<boolean>;

  // Comments
  getCommentsByVideoId(videoId: string): Promise<{
    id: string;
    text: string;
    createdAt: Date;
    author: { id: string; name: string | null; avatarUrl: string | null };
  }[]>;
  createComment(userId: string, videoId: string, text: string): Promise<{ id: string }>;
  deleteComment(commentId: string, userId: string): Promise<void>;

  // Reports
  createReport(input: CreateReportInput): Promise<{ id: string }>;
  getReportsByVideoId(videoId: string): Promise<{
    id: string;
    reason: string;
    description: string | null;
    status: string;
    createdAt: Date;
    reportedBy: { id: string; name: string | null; email: string };
  }[]>;
  getPendingReports(): Promise<{
    id: string;
    reason: string;
    description: string | null;
    status: string;
    createdAt: Date;
    video: { id: string; title: string | null };
    reportedBy: { id: string; name: string | null; email: string };
  }[]>;
  updateReportStatus(reportId: string, status: string, reviewedBy: string): Promise<void>;

  // Follows
  followUser(input: CreateFollowInput): Promise<void>;
  unfollowUser(input: CreateFollowInput): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  getFollowingIds(userId: string): Promise<string[]>;

  // Search & Hashtags
  searchVideos(input: SearchVideosInput): Promise<VideoWithAuthor[]>;
  getVideosByHashtag(hashtag: string, limit?: number, offset?: number): Promise<VideoWithAuthor[]>;
  getTrendingHashtags(limit?: number): Promise<{ name: string; count: number }[]>;

  // Users
  getUserById(userId: string): Promise<{
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
    createdAt: Date;
  } | null>;
  getUserByEmail(email: string): Promise<{ id: string; email: string; name: string | null } | null>;
}