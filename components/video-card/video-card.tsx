"use client";

import VideoPlayer from "@/components/video-player/video-player";
import { trackEvent } from "@/lib/analytics";
import { timeAgo } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface VideoCardProps {
  video: {
    id: string;
    title: string | null;
    description: string | null;
    playbackUrl: string;
    likeCount: number;
    commentCount: number;
    hasLiked: boolean;
    isFollowingAuthor: boolean;
    createdAt: string;
    author: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    };
    hashtags: string[];
  };
  isActive: boolean;
  currentUserId?: string;
  onLike: (videoId: string, liked: boolean) => void;
  onComment: (videoId: string) => void;
  onReport: (videoId: string) => void;
  onHashtagClick: (hashtag: string) => void;
  onProfileClick: (userId: string) => void;
}

export default function VideoCard({
  video,
  isActive,
  currentUserId,
  onLike,
  onComment,
  onReport,
  onHashtagClick,
  onProfileClick,
}: VideoCardProps) {
  const [liked, setLiked] = useState(video.hasLiked);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(video.isFollowingAuthor);

  const isOwnVideo = currentUserId === video.author.id;

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));
    trackEvent(newLiked ? "video_like" : "video_unlike", video.id);

    try {
      const method = newLiked ? "POST" : "DELETE";
      const res = await fetch(`/api/videos/${video.id}/like`, { method });
      if (!res.ok) {
        setLiked(!newLiked);
        setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
      }
    } catch {
      setLiked(!newLiked);
      setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
    }

    onLike(video.id, newLiked);
  };

  const handleQuickFollow = async () => {
    const newState = !isFollowingAuthor;
    setIsFollowingAuthor(newState);
    trackEvent(newState ? "user_follow" : "user_unfollow", undefined, {
      targetUserId: video.author.id,
    });

    try {
      const method = newState ? "POST" : "DELETE";
      const res = await fetch(`/api/users/${video.author.id}/follow`, {
        method,
      });
      if (!res.ok) {
        setIsFollowingAuthor(!newState);
      }
    } catch {
      setIsFollowingAuthor(!newState);
    }
  };

  const authorInitial =
    video.author.name?.charAt(0)?.toUpperCase() ||
    video.author.email.charAt(0).toUpperCase();

  // TikTok-style drop shadow for icons on any background
  const iconShadow = {
    filter:
      "drop-shadow(0px 1px 3px rgba(0, 0, 0, 0.8)) drop-shadow(0px 0px 6px rgba(0, 0, 0, 0.4))",
  };

  // TikTok-style text shadow for readability on any background
  const textShadow = {
    textShadow: "0px 1px 3px rgba(0, 0, 0, 0.8), 0px 0px 6px rgba(0, 0, 0, 0.4)",
  };

  return (
    <div
      data-testid="video-card"
      className="relative w-full h-full snap-start snap-always"
    >
      {/* Video Player — only mount when active */}
      {isActive ? (
        <VideoPlayer playbackUrl={video.playbackUrl} isActive={isActive} />
      ) : (
        <div
          data-testid="video-placeholder"
          className="w-full h-full bg-gray-900 flex items-center justify-center"
        >
          <div className="text-center">
            <svg
              className="w-16 h-16 text-gray-700 mx-auto"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            {video.title && (
              <p className="text-gray-600 text-sm mt-2 px-8 line-clamp-1">
                {video.title}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* RIGHT SIDE ACTIONS — TikTok style with drop shadows */}
      {/* No background overlay — just shadows for contrast */}
      {/* ============================================ */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5 z-10"
        style={{
          bottom: "max(140px, calc(env(safe-area-inset-bottom, 0px) + 140px))",
          ...iconShadow,
        }}
      >
        {/* Profile + Quick Follow */}
        <div className="flex flex-col items-center relative">
          <button
            data-testid="profile-button"
            onClick={() => onProfileClick(video.author.id)}
          >
            <div
              className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center
                          text-white font-bold text-sm border-2 border-white"
              style={iconShadow}
            >
              {video.author.avatarUrl ? (
                <Image
                  src={video.author.avatarUrl}
                  alt={video.author.name || ""}
                  width={48}
                  height={48}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                authorInitial
              )}
            </div>
          </button>
          {!isOwnVideo && (
            <button
              data-testid="quick-follow-button"
              onClick={handleQuickFollow}
              className={`absolute -bottom-2 w-5 h-5 rounded-full flex items-center
                          justify-center text-white text-[10px] font-bold ${
                            isFollowingAuthor ? "bg-gray-600" : "bg-red-500"
                          }`}
              style={iconShadow}
            >
              {isFollowingAuthor ? "✓" : "+"}
            </button>
          )}
        </div>

        {/* Like */}
        <button
          data-testid="like-button"
          onClick={handleLike}
          className="flex flex-col items-center"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              liked ? "text-red-500" : "text-white"
            }`}
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              {liked ? (
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              ) : (
                <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
              )}
            </svg>
          </div>
          <span className="text-white text-xs font-semibold" style={textShadow}>
            {likeCount}
          </span>
        </button>

        {/* Comment */}
        <button
          data-testid="comment-button"
          onClick={() => onComment(video.id)}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-white text-xs font-semibold" style={textShadow}>
            {video.commentCount}
          </span>
        </button>

        {/* More menu (report) */}
        <div className="relative">
          <button
            data-testid="more-button"
            onClick={() => setShowMenu(!showMenu)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {showMenu && (
            <div
              data-testid="more-menu"
              className="absolute right-14 bottom-0 bg-gray-900/95 rounded-lg shadow-xl
                         border border-gray-700 overflow-hidden z-20 w-48 backdrop-blur-sm"
            >
              <button
                data-testid="report-menu-item"
                onClick={() => {
                  setShowMenu(false);
                  onReport(video.id);
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-400
                           hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
                Report Video
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* BOTTOM OVERLAY — TikTok style gradient scrim */}
      {/* Gradient from black at bottom to transparent at top */}
      {/* Text container has strict max-width to avoid icon overlap */}
      {/* ============================================ */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0) 100%)",
          paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
        }}
      >
        {/* Text container — restricted width to avoid overlapping right-side icons */}
        <div
          className="px-4 pb-2"
          style={{
            maxWidth: "calc(100% - 80px)", // Leave 80px for the right icon bar
          }}
        >
          {/* Author */}
          <button
            data-testid="author-name"
            onClick={() => onProfileClick(video.author.id)}
            className="font-bold text-white text-sm hover:underline"
            style={textShadow}
          >
            @{video.author.name || video.author.email.split("@")[0]}
          </button>

          {/* Title */}
          {video.title && (
            <p
              data-testid="video-title"
              className="text-white text-sm mt-1 line-clamp-1"
              style={textShadow}
            >
              {video.title}
            </p>
          )}

          {/* Description (truncated to 2 lines) */}
          {video.description && (
            <p
              data-testid="video-description"
              className="text-gray-200 text-xs mt-1 line-clamp-2"
              style={textShadow}
            >
              {video.description}
            </p>
          )}

          {/* Hashtags (wrap, don't overflow) */}
          {video.hashtags.length > 0 && (
            <div
              data-testid="hashtags"
              className="flex flex-wrap gap-1 mt-2 overflow-hidden max-h-10"
            >
              {video.hashtags.map((tag) => (
                <button
                  key={tag}
                  data-testid={`hashtag-${tag}`}
                  onClick={() => onHashtagClick(tag)}
                  className="text-blue-300 text-xs font-semibold hover:underline
                             whitespace-nowrap"
                  style={textShadow}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className="text-gray-400 text-xs mt-1" style={textShadow}>
            {timeAgo(new Date(video.createdAt))}
          </p>
        </div>
      </div>
    </div>
  );
}
