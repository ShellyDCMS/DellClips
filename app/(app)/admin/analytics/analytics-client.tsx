"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  period: { days: number; since: string };
  overview: { totalUsers: number; totalVideos: number; totalEvents: number };
  eventCounts: { eventType: string; count: number }[];
  dailyActiveUsers: { date: string; count: number }[];
  topVideos: { videoId: string; title: string | null; views: number }[];
  topUsers: { userId: string; email: string; name: string | null; eventCount: number }[];
  recentEvents: {
    id: string;
    eventType: string;
    createdAt: string;
    userEmail: string | null;
    videoTitle: string | null;
  }[];
}

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?days=${days}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
      if (!cancelled) setLoading(false);
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading || !data) {
    return (
      <div
        data-testid="analytics-loading"
        className="h-full flex items-center justify-center"
      >
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      data-testid="analytics-container"
      className="h-full overflow-y-auto px-4 pt-12 pb-20"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 data-testid="analytics-title" className="text-white text-xl font-bold">
          Analytics
        </h1>
        <select
          data-testid="analytics-period-select"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5
                     border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div data-testid="analytics-overview" className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Users", value: data.overview.totalUsers, emoji: "👥" },
          { label: "Total Videos", value: data.overview.totalVideos, emoji: "🎬" },
          { label: "Total Events", value: data.overview.totalEvents, emoji: "📊" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center"
          >
            <p className="text-2xl mb-1">{card.emoji}</p>
            <p
              data-testid={`overview-${card.label.toLowerCase().replace(/ /g, "-")}`}
              className="text-white font-bold text-xl"
            >
              {card.value}
            </p>
            <p className="text-gray-500 text-xs">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Event Breakdown */}
      <div
        data-testid="event-breakdown"
        className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6"
      >
        <h2 className="text-white font-bold text-sm mb-3">Event Breakdown</h2>
        <div className="space-y-2">
          {data.eventCounts.map((event) => (
            <div key={event.eventType} className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">
                {event.eventType.replace(/_/g, " ")}
              </span>
              <span className="text-white font-semibold text-sm">{event.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Active Users */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h2 className="text-white font-bold text-sm mb-3">Daily Active Users</h2>
        <div className="flex items-end gap-1 h-32">
          {data.dailyActiveUsers.map((day) => {
            const maxCount = Math.max(...data.dailyActiveUsers.map((d) => d.count), 1);
            const height = (day.count / maxCount) * 100;
            return (
              <div
                key={day.date}
                className="flex-1 bg-blue-600 rounded-t-sm min-h-[2px]"
                style={{ height: `${height}%` }}
                title={`${day.date}: ${day.count} users`}
              />
            );
          })}
        </div>
      </div>

      {/* Top Videos */}
      <div
        data-testid="top-videos"
        className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6"
      >
        <h2 className="text-white font-bold text-sm mb-3">Top Videos</h2>
        <div className="space-y-2">
          {data.topVideos.map((video, i) => (
            <div key={video.videoId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs w-4">{i + 1}.</span>
                <span className="text-gray-300 text-sm truncate max-w-[200px]">
                  {video.title || "Untitled"}
                </span>
              </div>
              <span className="text-white font-semibold text-sm">
                {video.views} views
              </span>
            </div>
          ))}
          {data.topVideos.length === 0 && (
            <p data-testid="no-views-message" className="text-gray-500 text-sm">
              No views yet
            </p>
          )}
        </div>
      </div>

      {/* Most Active Users */}
      <div
        data-testid="top-users"
        className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6"
      >
        <h2 className="text-white font-bold text-sm mb-3">Most Active Users</h2>
        <div className="space-y-2">
          {data.topUsers.map((u, i) => (
            <div key={u.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs w-4">{i + 1}.</span>
                <span className="text-gray-300 text-sm">
                  {u.name || u.email.split("@")[0]}
                </span>
              </div>
              <span className="text-white font-semibold text-sm">
                {u.eventCount} actions
              </span>
            </div>
          ))}
          {data.topUsers.length === 0 && (
            <p data-testid="no-activity-message" className="text-gray-500 text-sm">
              No activity yet
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        data-testid="recent-activity"
        className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6"
      >
        <h2 className="text-white font-bold text-sm mb-3">Recent Activity</h2>
        <div className="space-y-2">
          {data.recentEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-2 text-xs">
              <span className="text-gray-600 whitespace-nowrap">
                {new Date(event.createdAt).toLocaleTimeString()}
              </span>
              <span className="text-gray-400">
                {event.userEmail?.split("@")[0] || "anon"}{" "}
                <span className="text-blue-400">
                  {event.eventType.replace(/_/g, " ")}
                </span>
                {event.videoTitle && (
                  <span className="text-gray-500">
                    {" "}
                    on &ldquo;{event.videoTitle}&rdquo;
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
