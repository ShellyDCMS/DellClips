"use client";

import CommentSection from "@/components/comment-section/comment-section";
import ReportDialog from "@/components/report-dialog/report-dialog";
import VideoFeed from "@/components/video-feed/video-feed";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

interface FeedClientProps {
  initialVideos: Video[];
  currentUserId: string;
}

export default function FeedClient({ initialVideos, currentUserId }: FeedClientProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!new URLSearchParams(window.location.search).has("debug")) return;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    script.onload = () => {
      (window as unknown as { eruda?: { init: () => void } }).eruda?.init();
    };
    document.body.appendChild(script);
  }, []);
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const [reportVideoId, setReportVideoId] = useState<string | null>(null);
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);

  const handleOpenComments = (videoId: string) => {
    setCommentVideoId(videoId);
  };

  const handleCloseComments = () => {
    setCommentVideoId(null);
  };

  const handleOpenReport = (videoId: string) => {
    setReportVideoId(videoId);
  };

  const handleCloseReport = () => {
    setReportVideoId(null);
  };

  const handleHashtagClick = (hashtag: string) => {
    router.push(`/search?hashtag=${encodeURIComponent(hashtag)}`);
  };

  const handleReportSubmit = async (reason: string, description?: string) => {
    if (!reportVideoId) return;

    try {
      await fetch(`/api/videos/${reportVideoId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, description }),
      });
    } catch (error) {
      console.error("Failed to report video:", error);
    }

    setReportVideoId(null);
  };

  const handleProfileClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  return (
    <>
      <VideoFeed
        initialVideos={initialVideos}
        currentUserId={currentUserId}
        isGlobalMuted={isGlobalMuted}
        onToggleMute={() => setIsGlobalMuted((prev) => !prev)}
        onOpenComments={handleOpenComments}
        onOpenReport={handleOpenReport}
        onHashtagClick={handleHashtagClick}
        onProfileClick={handleProfileClick}
      />

      <CommentSection
        videoId={commentVideoId || ""}
        isOpen={!!commentVideoId}
        onClose={handleCloseComments}
      />

      <ReportDialog
        videoId={reportVideoId || ""}
        isOpen={!!reportVideoId}
        onClose={handleCloseReport}
        onSubmit={handleReportSubmit}
      />
    </>
  );
}
