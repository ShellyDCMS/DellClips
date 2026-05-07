"use client";

import HashtagSubscribe from "@/components/hashtag-subscribe/hashtag-subscribe";
import SearchBar from "@/components/search-bar/search-bar";
import { useRouter } from "next/navigation";

interface Video {
  id: string;
  title: string | null;
  description: string | null;
  playbackUrl: string;
  videoPlaybackId: string;
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
}

interface SearchClientProps {
  initialVideos: Video[];
  hashtag: string;
  query: string;
  isSubscribed: boolean;
  trendingHashtags: { name: string; count: number }[];
  subscribedHashtags: string[];
  currentUserId: string;
}

export default function SearchClient({
  initialVideos,
  hashtag,
  query,
  isSubscribed,
  trendingHashtags,
  subscribedHashtags,
  currentUserId: _currentUserId,
}: SearchClientProps) {
  const router = useRouter();

  const handleSearch = (q: string) => {
    if (q.startsWith("#")) {
      router.push(`/search?hashtag=${encodeURIComponent(q.slice(1))}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div data-testid="search-client" className="h-full overflow-y-auto pb-20">
      {/* Search Bar */}
      <div className="sticky top-0 z-30 bg-black px-4 pt-4 pb-2">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Active Hashtag Header with Subscribe */}
      {hashtag && (
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 data-testid="hashtag-header" className="text-white text-lg font-bold">
            #{hashtag}
          </h1>
          <HashtagSubscribe hashtag={hashtag} initialIsSubscribed={isSubscribed} />
        </div>
      )}

      {/* Query Header */}
      {query && !hashtag && (
        <div className="px-4 py-3">
          <h1 data-testid="query-header" className="text-white text-lg font-bold">
            Results for &ldquo;{query}&rdquo;
          </h1>
        </div>
      )}

      {/* Your Subscribed Hashtags */}
      {!hashtag && !query && subscribedHashtags.length > 0 && (
        <div className="px-4 py-3">
          <h2
            data-testid="subscriptions-header"
            className="text-white text-sm font-bold mb-2"
          >
            Your Subscriptions
          </h2>
          <div className="flex flex-wrap gap-2">
            {subscribedHashtags.map((tag) => (
              <button
                key={tag}
                onClick={() => router.push(`/search?hashtag=${encodeURIComponent(tag)}`)}
                className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs
                           font-semibold hover:bg-blue-700 transition-colors"
              >
                #{tag} ✓
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Hashtags */}
      {!hashtag && !query && (
        <div className="px-4 py-3">
          <h2 data-testid="trending-header" className="text-white text-sm font-bold mb-2">
            Trending
          </h2>
          <div className="space-y-2">
            {trendingHashtags.map((tag) => (
              <button
                key={tag.name}
                onClick={() =>
                  router.push(`/search?hashtag=${encodeURIComponent(tag.name)}`)
                }
                className="flex items-center justify-between w-full px-3 py-2
                           bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span className="text-blue-400 text-sm font-semibold">#{tag.name}</span>
                <span className="text-gray-500 text-xs">
                  {tag.count} {tag.count === 1 ? "video" : "videos"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {(hashtag || query) && (
        <div className="px-4 py-2">
          {initialVideos.length === 0 ? (
            <div className="text-center py-12">
              <p data-testid="no-results" className="text-gray-500">
                No videos found
              </p>
            </div>
          ) : (
            <div data-testid="search-results-grid" className="grid grid-cols-2 gap-2">
              {initialVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => router.push(`/feed`)}
                  className="aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden
                             relative hover:opacity-80 transition-opacity"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div
                    className="absolute bottom-0 left-0 right-0 p-2
                                  bg-gradient-to-t from-black/80 to-transparent"
                  >
                    <p className="text-white text-xs line-clamp-2">{video.title}</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">
                      ❤️ {video.likeCount} 💬 {video.commentCount}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
