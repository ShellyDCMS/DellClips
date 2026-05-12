"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteVideoButtonProps {
  videoId: string;
  videoTitle: string | null;
}

export default function DeleteVideoButton({
  videoId,
  videoTitle,
}: DeleteVideoButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowConfirm(false);
        router.refresh();
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

  return (
    <>
      {/* Delete icon button — overlays on video thumbnail */}
      <button
        data-testid="delete-video-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowConfirm(true);
        }}
        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full
                   flex items-center justify-center z-10
                   hover:bg-red-600 transition-colors"
        title="Delete video"
      >
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div
          data-testid="delete-video-confirm-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm mx-4 border border-gray-700">
            <h3 className="text-white font-bold text-lg mb-2">Delete Video?</h3>
            <p className="text-gray-400 text-sm mb-4">
              Are you sure you want to delete
              {videoTitle ? ` "${videoTitle}"` : " this video"}? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                data-testid="delete-video-cancel"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                disabled={isDeleting}
                className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm
                           hover:bg-gray-700 transition-colors
                           disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                data-testid="delete-video-confirm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold
                           hover:bg-red-700 transition-colors
                           disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
