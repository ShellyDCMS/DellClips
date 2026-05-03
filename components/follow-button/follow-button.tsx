"use client";

import { useState } from "react";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
}

export default function FollowButton({
  userId: _userId,
  initialIsFollowing = false,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  const handleClick = async () => {
    // TODO: Call API route
    setIsFollowing(!isFollowing);
  };

  return (
    <button
      data-testid="follow-button"
      onClick={handleClick}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
        isFollowing
          ? "bg-gray-700 text-white hover:bg-red-600"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
