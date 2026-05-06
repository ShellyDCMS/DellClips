"use client";

import { useState } from "react";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
}

export default function FollowButton({
  userId,
  initialIsFollowing = false,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const newState = !isFollowing;
    setIsFollowing(newState); // Optimistic update

    try {
      const method = newState ? "POST" : "DELETE";
      const res = await fetch(`/api/users/${userId}/follow`, { method });

      if (!res.ok) {
        setIsFollowing(!newState); // Revert on failure
      }
    } catch {
      setIsFollowing(!newState); // Revert on failure
    }

    setIsLoading(false);
  };

  return (
    <button
      data-testid="follow-button"
      onClick={handleClick}
      disabled={isLoading}
      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors
                  disabled:opacity-50 ${
                    isFollowing
                      ? "bg-gray-700 text-white hover:bg-red-600"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
