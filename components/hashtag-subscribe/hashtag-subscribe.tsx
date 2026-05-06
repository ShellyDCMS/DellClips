"use client";

import { useState } from "react";

interface HashtagSubscribeProps {
  hashtag: string;
  initialIsSubscribed?: boolean;
}

export default function HashtagSubscribe({
  hashtag,
  initialIsSubscribed = false,
}: HashtagSubscribeProps) {
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const newState = !isSubscribed;
    setIsSubscribed(newState);

    try {
      const method = newState ? "POST" : "DELETE";
      const res = await fetch(`/api/hashtags/${hashtag}/subscribe`, {
        method,
      });

      if (!res.ok) {
        setIsSubscribed(!newState);
      }
    } catch {
      setIsSubscribed(!newState);
    }

    setIsLoading(false);
  };

  return (
    <button
      data-testid={`hashtag-subscribe-${hashtag}`}
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs
                  font-semibold transition-colors disabled:opacity-50 ${
                    isSubscribed
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-blue-400 hover:bg-gray-700"
                  }`}
    >
      #{hashtag}
      {isSubscribed ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 4v16m8-8H4"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
    </button>
  );
}
