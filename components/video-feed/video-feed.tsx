"use client";

import VideoCard from "@/components/video-card/video-card";
import { useCallback, useEffect, useRef, useState } from "react";

interface Video {
  id: string;
  title: string | null;
  description: string | null;
  playbackUrl: string;
  videoPlaybackId: string;
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
}

interface VideoFeedProps {
  initialVideos: Video[];
  currentUserId?: string;
  isGlobalMuted: boolean;
  onToggleMute: () => void;
  onOpenComments: (videoId: string) => void;
  onOpenReport: (videoId: string) => void;
  onHashtagClick: (hashtag: string) => void;
  onProfileClick: (userId: string) => void;
}

export default function VideoFeed({
  initialVideos,
  currentUserId,
  isGlobalMuted,
  onToggleMute,
  onOpenComments,
  onOpenReport,
  onHashtagClick,
  onProfileClick,
}: VideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for scroll-snap detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5, // ← Changed from 0.6 to 0.5 (more reliable on iOS)
        rootMargin: "0px", // ← Explicit root margin
      }
    );

    const items = container.querySelectorAll("[data-index]");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [videos]);

  // Load more videos when near the end
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/videos?offset=${videos.length}&limit=10`);
      const data = await res.json();

      if (data.videos && data.videos.length > 0) {
        setVideos((prev) => [...prev, ...data.videos]);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more videos:", error);
    }
    setIsLoading(false);
  }, [videos.length, isLoading, hasMore]);

  // Keep a stable ref to loadMore for the effect below
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Trigger load more when approaching the last video
  useEffect(() => {
    if (activeIndex >= videos.length - 2 && hasMore) {
      loadMoreRef.current();
    }
  }, [activeIndex, videos.length, hasMore]);

  const handleLike = (_videoId: string, _liked: boolean) => {
    // Optimistic update already handled in VideoCard
  };

  if (videos.length === 0) {
    return (
      <div
        data-testid="empty-feed"
        className="h-full flex flex-col items-center justify-center text-center px-4"
      >
        <div className="text-6xl mb-4">🎬</div>
        <h2 className="text-xl font-bold text-white mb-2">No videos yet</h2>
        <p className="text-gray-400 text-sm">
          Be the first to upload a video to DellClips!
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="video-feed"
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory
               scrollbar-hide overscroll-none"
      style={{
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "none",
      }}
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          data-index={index}
          className="h-full w-full snap-start snap-always"
        >
          <VideoCard
            video={video}
            isActive={index === activeIndex}
            currentUserId={currentUserId}
            isGlobalMuted={isGlobalMuted}
            onToggleMute={onToggleMute}
            onLike={handleLike}
            onComment={onOpenComments}
            onReport={onOpenReport}
            onHashtagClick={onHashtagClick}
            onProfileClick={onProfileClick}
          />
        </div>
      ))}

      {/* Spacer at the end to prevent iOS scroll snap lock */}
      <div className="h-1 w-full snap-start" aria-hidden="true" />

      {isLoading && (
        <div className="h-20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
