"use client";

import VideoPlayer from "@/components/video-player/video-player";
import { timeAgo } from "@/lib/utils";
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
  onLike: (videoId: string, liked: boolean) => void;
  onComment: (videoId: string) => void;
  onReport: (videoId: string) => void;
  onHashtagClick: (hashtag: string) => void;
  onProfileClick: (userId: string) => void;
}

export default function VideoCard({
  video,
  isActive,
  onLike,
  onComment,
  onReport,
  onHashtagClick,
  onProfileClick,
}: VideoCardProps) {
  const [liked, setLiked] = useState(video.hasLiked);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    try {
      const method = newLiked ? "POST" : "DELETE";
      const res = await fetch(`/api/videos/${video.id}/like`, { method });
      if (!res.ok) {
        // Revert on failure
        setLiked(!newLiked);
        setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
      }
    } catch {
      setLiked(!newLiked);
      setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
    }

    onLike(video.id, newLiked);
  };

  const authorInitial =
    video.author.name?.charAt(0)?.toUpperCase() ||
    video.author.email.charAt(0).toUpperCase();

  return (
    <div
      data-testid="video-card"
      className="relative w-full h-full snap-start snap-always"
    >
      {/* Video Player */}
      <VideoPlayer playbackUrl={video.playbackUrl} isActive={isActive} />

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10">
        {/* Profile */}
        <button
          data-testid="profile-button"
          onClick={() => onProfileClick(video.author.id)}
          className="flex flex-col items-center"
        >
          <div className="w-11 h-11 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white">
            {video.author.avatarUrl ? (
              <img
                src={video.author.avatarUrl}
                alt={video.author.name || ""}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              authorInitial
            )}
          </div>
        </button>

        {/* Like */}
        <button
          data-testid="like-button"
          onClick={handleLike}
          className="flex flex-col items-center"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center ${
              liked ? "text-red-500" : "text-white"
            }`}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              {liked ? (
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              ) : (
                <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
              )}
            </svg>
          </div>
          <span className="text-white text-xs font-semibold">{likeCount}</span>
        </button>

        {/* Comment */}
        <button
          data-testid="comment-button"
          onClick={() => onComment(video.id)}
          className="flex flex-col items-center"
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-white text-xs font-semibold">{video.commentCount}</span>
        </button>

        {/* More menu (report) */}
        <div className="relative">
          <button
            data-testid="more-button"
            onClick={() => setShowMenu(!showMenu)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {showMenu && (
            <div
              data-testid="more-menu"
              className="absolute right-12 bottom-0 bg-gray-900 rounded-lg shadow-xl
                         border border-gray-700 overflow-hidden z-20 w-48"
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

      {/* Bottom overlay — author info + description */}
      <div
        className="absolute bottom-0 left-0 right-16 p-4 z-10
                      bg-gradient-to-t from-black/80 via-black/40 to-transparent"
      >
        {/* Author */}
        <button
          data-testid="author-name"
          onClick={() => onProfileClick(video.author.id)}
          className="font-bold text-white text-sm hover:underline"
        >
          @{video.author.name || video.author.email.split("@")[0]}
        </button>

        {/* Title */}
        {video.title && (
          <p data-testid="video-title" className="text-white text-sm mt-1">
            {video.title}
          </p>
        )}

        {/* Description (truncated) */}
        {video.description && (
          <p
            data-testid="video-description"
            className="text-gray-300 text-xs mt-1 line-clamp-2"
          >
            {video.description}
          </p>
        )}

        {/* Hashtags */}
        {video.hashtags.length > 0 && (
          <div data-testid="hashtags" className="flex flex-wrap gap-1 mt-2">
            {video.hashtags.map((tag) => (
              <button
                key={tag}
                data-testid={`hashtag-${tag}`}
                onClick={() => onHashtagClick(tag)}
                className="text-blue-400 text-xs font-semibold hover:underline"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-gray-500 text-xs mt-1">{timeAgo(new Date(video.createdAt))}</p>
      </div>
    </div>
  );
}
