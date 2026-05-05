"use client";

import { timeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface CommentSectionProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentSection({
  videoId,
  isOpen,
  onClose,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !videoId) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/videos/${videoId}/comments`);
        const data = await res.json();
        if (!cancelled) setComments(data.comments || []);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
      if (!cancelled) setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment.trim() }),
      });

      if (res.ok) {
        setNewComment("");
        const refreshRes = await fetch(`/api/videos/${videoId}/comments`);
        const refreshData = await refreshRes.json();
        setComments(refreshData.comments || []);
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="comment-section"
      className="fixed inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-2xl
                 max-h-[70vh] flex flex-col border-t border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h3 className="text-white font-bold">Comments ({comments.length})</h3>
        <button
          data-testid="close-comments"
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} data-testid="comment-item" className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0
                              flex items-center justify-center text-white text-xs font-bold"
              >
                {comment.author.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-semibold">
                    {comment.author.name || "Anonymous"}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {timeAgo(new Date(comment.createdAt))}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-0.5">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-gray-800 flex gap-2"
      >
        <input
          data-testid="comment-input"
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full
                     text-white placeholder-gray-500 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-50"
        />
        <button
          data-testid="submit-comment"
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold
                     hover:bg-blue-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Post
        </button>
      </form>
    </div>
  );
}
