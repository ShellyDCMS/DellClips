"use client";

import { useSharedVideo } from "@/components/shared-video-player/shared-video-context";
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
  const { isPlaying, isMuted, togglePlay, toggleMute } = useSharedVideo();
  const [liked, setLiked] = useState(video.hasLiked);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(video.isFollowingAuthor);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title || "");
  const [editDescription, setEditDescription] = useState(video.description || "");
  const [editHashtags, setEditHashtags] = useState(
    video.hashtags.map((t) => `#${t}`).join(" ")
  );
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [displayTitle, setDisplayTitle] = useState(video.title);
  const [displayDescription, setDisplayDescription] = useState(video.description);
  const [displayHashtags, setDisplayHashtags] = useState(video.hashtags);

  const isOwnVideo = currentUserId === video.author.id;

  const handleEditSave = async () => {
    if (isSavingEdit) return;
    setIsSavingEdit(true);
    setEditError("");

    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          hashtags: editHashtags,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setDisplayTitle(editTitle || null);
      setDisplayDescription(editDescription || null);
      const newTags = editHashtags
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, "").trim().toLowerCase())
        .filter(Boolean);
      setDisplayHashtags(newTags);
      setShowEditDialog(false);
      trackEvent("video_edit", video.id);
    } catch (err) {
      setEditError((err as Error).message);
    }

    setIsSavingEdit(false);
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteConfirm(false);
        // Reload the feed to remove the deleted video
        window.location.reload();
      } else {
        const data = await res.json();
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to delete video:", err);
      alert("Failed to delete video. Please try again.");
    }

    setIsDeleting(false);
  };
  const handleLike = async () => {
    if (isOwnVideo) return;
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
      {/* Inactive cards: opaque placeholder hides the shared video underneath */}
      {!isActive && (
        <div
          data-testid="video-placeholder"
          className="absolute inset-0 bg-gray-900 flex items-center justify-center z-0"
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

      {/* Active card: tap-area + mute button + play overlay over the shared video */}
      {isActive && (
        <>
          <div
            data-testid="video-player"
            className="absolute inset-0 z-0 cursor-pointer"
            onClick={togglePlay}
          />

          <button
            data-testid="mute-button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="absolute right-4 z-20 w-12 h-12 bg-black/50 rounded-full
                       flex items-center justify-center backdrop-blur-sm
                       hover:bg-black/70 active:bg-black/80 transition-colors
                       touch-manipulation"
            style={{
              top: "max(16px, env(safe-area-inset-top, 16px))",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            {isMuted ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>

          {!isPlaying && (
            <div
              data-testid="play-overlay"
              className="absolute inset-0 z-10 flex flex-col items-center justify-center
                         pointer-events-none"
            >
              <div
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center
                           backdrop-blur-sm mb-3"
              >
                <svg
                  className="w-8 h-8 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-white/60 text-xs">Tap to play</p>
            </div>
          )}
        </>
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
                <span data-testid="author-avatar" className="w-full h-full block">
                  <Image
                    src={video.author.avatarUrl}
                    alt={video.author.name || ""}
                    width={48}
                    height={48}
                    className="w-full h-full rounded-full object-cover"
                  />
                </span>
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
          disabled={isOwnVideo}
          className={`flex flex-col items-center ${isOwnVideo ? "opacity-40 cursor-not-allowed" : ""}`}
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
              {/* Edit — only shown for own videos */}
              {isOwnVideo && (
                <button
                  data-testid="edit-menu-item"
                  onClick={() => {
                    setShowMenu(false);
                    setShowEditDialog(true);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-white
                   hover:bg-gray-800 transition-colors flex items-center gap-2
                   border-b border-gray-800"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Edit Video
                </button>
              )}

              {/* Delete — only shown for own videos */}
              {isOwnVideo && (
                <button
                  data-testid="delete-menu-item"
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-red-400
                   hover:bg-gray-800 transition-colors flex items-center gap-2
                   border-b border-gray-800"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                  Delete Video
                </button>
              )}

              {/* Report — shown for OTHER people's videos */}
              {!isOwnVideo && (
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
              )}
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
          {displayTitle && (
            <p
              data-testid="video-title"
              className="text-white text-sm mt-1 line-clamp-1"
              style={textShadow}
            >
              {displayTitle}
            </p>
          )}

          {/* Description (truncated to 2 lines) */}
          {displayDescription && (
            <p
              data-testid="video-description"
              className="text-gray-200 text-xs mt-1 line-clamp-2"
              style={textShadow}
            >
              {displayDescription}
            </p>
          )}

          {/* Hashtags (wrap, don't overflow) */}
          {displayHashtags.length > 0 && (
            <div
              data-testid="hashtags"
              className="flex flex-wrap gap-1 mt-2 overflow-hidden max-h-10"
            >
              {displayHashtags.map((tag) => (
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

      {/* Edit Dialog */}
      {showEditDialog && (
        <div
          data-testid="edit-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm mx-4 border border-gray-700 w-full">
            <h3 className="text-white font-bold text-lg mb-4">Edit Video</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  data-testid="edit-title-input"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={500}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                             text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Video title"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  data-testid="edit-description-input"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                             text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                             resize-none"
                  placeholder="Video description"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Hashtags</label>
                <input
                  data-testid="edit-hashtags-input"
                  type="text"
                  value={editHashtags}
                  onChange={(e) => setEditHashtags(e.target.value)}
                  maxLength={500}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                             text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#tag1 #tag2"
                />
              </div>
            </div>

            {editError && (
              <p data-testid="edit-error" className="text-red-400 text-sm mt-3">
                {editError}
              </p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                data-testid="edit-cancel-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditDialog(false);
                  setEditError("");
                }}
                disabled={isSavingEdit}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg text-sm
                           hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                data-testid="edit-save-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditSave();
                }}
                disabled={isSavingEdit}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold
                           hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSavingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          data-testid="delete-confirm-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm mx-4 border border-gray-700">
            <h3 className="text-white font-bold text-lg mb-2">Delete Video?</h3>
            <p className="text-gray-400 text-sm mb-1">
              {video.title && (
                <span className="text-white">&ldquo;{video.title}&rdquo;</span>
              )}
            </p>
            <p className="text-gray-500 text-xs mb-4">
              This will permanently delete the video, all likes, and all comments. This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                data-testid="delete-cancel-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg text-sm
                     hover:bg-gray-700 transition-colors
                     disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                data-testid="delete-confirm-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold
                     hover:bg-red-700 transition-colors
                     disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
