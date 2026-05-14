"use client";

import HashtagSubscribe from "@/components/hashtag-subscribe/hashtag-subscribe";
import SearchBar from "@/components/search-bar/search-bar";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  hashtags: string[];
}

interface UserResult {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
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

type DiscoverTab = "hashtags" | "people";

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
  const [activeTab, setActiveTab] = useState<DiscoverTab>("hashtags");
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setUserResults([]);
      setIsSearchingUsers(false);
      return;
    }
    setIsSearchingUsers(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setUserResults(data.users || []);
      }
    } catch (err) {
      console.error("Failed to search users:", err);
    }
    setIsSearchingUsers(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(userQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [userQuery, searchUsers]);

  const handleSearch = (q: string) => {
    if (q.startsWith("#")) {
      router.push(`/search?hashtag=${encodeURIComponent(q.slice(1))}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  // Compute hashtag cloud sizes
  const maxCount = Math.max(...trendingHashtags.map((t) => t.count), 1);
  const minCount = Math.min(...trendingHashtags.map((t) => t.count), 1);
  const getTagSize = (count: number) => {
    if (maxCount === minCount) return 1;
    const normalized = (count - minCount) / (maxCount - minCount);
    return 0.75 + normalized * 1.5; // rem: 0.75 to 2.25
  };

  return (
    <div data-testid="search-client" className="h-full overflow-y-auto pb-20">
      {/* Search Bar */}
      <div
        className="sticky top-0 z-30 bg-black px-4 pb-2"
        style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}
      >
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

      {/* Discover Home — Tabs + Content */}
      {!hashtag && !query && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-800 mx-4 mt-2">
            <button
              data-testid="tab-hashtags"
              onClick={() => setActiveTab("hashtags")}
              className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors
                ${
                  activeTab === "hashtags"
                    ? "text-white border-b-2 border-white"
                    : "text-gray-500"
                }`}
            >
              Hashtags
            </button>
            <button
              data-testid="tab-people"
              onClick={() => setActiveTab("people")}
              className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors
                ${
                  activeTab === "people"
                    ? "text-white border-b-2 border-white"
                    : "text-gray-500"
                }`}
            >
              People
            </button>
          </div>

          {/* Hashtags Tab */}
          {activeTab === "hashtags" && (
            <div className="px-4 pt-4">
              {/* Subscribed Hashtags */}
              {subscribedHashtags.length > 0 && (
                <div className="mb-5">
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
                        onClick={() =>
                          router.push(`/search?hashtag=${encodeURIComponent(tag)}`)
                        }
                        className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs
                                   font-semibold hover:bg-blue-700 transition-colors"
                      >
                        #{tag} ✓
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtag Cloud */}
              <h2
                data-testid="trending-header"
                className="text-white text-sm font-bold mb-3"
              >
                Trending
              </h2>
              {trendingHashtags.length > 0 ? (
                <div
                  data-testid="hashtag-cloud"
                  className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-4
                             px-2 bg-gray-900/50 rounded-2xl"
                >
                  {trendingHashtags.map((tag) => {
                    const size = getTagSize(tag.count);
                    return (
                      <button
                        key={tag.name}
                        onClick={() =>
                          router.push(`/search?hashtag=${encodeURIComponent(tag.name)}`)
                        }
                        className="text-blue-400 font-semibold hover:text-blue-300
                                   transition-colors whitespace-nowrap"
                        style={{ fontSize: `${size}rem` }}
                        title={`${tag.count} ${tag.count === 1 ? "video" : "videos"}`}
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  No trending hashtags yet
                </p>
              )}
            </div>
          )}

          {/* People Tab */}
          {activeTab === "people" && (
            <div className="px-4 pt-4">
              <div className="relative mb-4">
                <input
                  data-testid="user-search-input"
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-full
                             text-white text-sm placeholder-gray-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {userQuery && (
                  <button
                    onClick={() => {
                      setUserQuery("");
                      setUserResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500
                               hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                )}
              </div>

              {isSearchingUsers ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : userQuery && userResults.length === 0 ? (
                <p
                  data-testid="no-user-results"
                  className="text-gray-500 text-sm text-center py-8"
                >
                  No users found
                </p>
              ) : userResults.length > 0 ? (
                <div data-testid="user-results" className="space-y-1">
                  {userResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => router.push(`/profile/${user.id}`)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
                                 hover:bg-gray-800 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-full bg-gray-700 flex items-center
                                      justify-center text-white font-bold text-sm flex-shrink-0"
                      >
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.name || ""}
                            width={40}
                            height={40}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()
                        )}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {user.name || user.email.split("@")[0]}
                        </p>
                        <p className="text-gray-500 text-xs truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="w-12 h-12 text-gray-700 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">Search for people to follow</p>
                </div>
              )}
            </div>
          )}
        </>
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
