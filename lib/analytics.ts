type EventType =
  | "page_view"
  | "video_view"
  | "video_watch_complete"
  | "video_like"
  | "video_unlike"
  | "video_comment"
  | "video_report"
  | "video_upload"
  | "user_follow"
  | "user_unfollow"
  | "hashtag_subscribe"
  | "hashtag_unsubscribe"
  | "search"
  | "app_install";

export async function trackEvent(
  eventType: EventType,
  videoId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, videoId, metadata }),
    });
  } catch {
    // Silently fail — analytics should never break the app
  }
}
