// Report reason constants
export const REPORT_REASONS = [
  { code: "offensive", label: "Offensive or inappropriate content" },
  { code: "restricted_data", label: "Contains restricted or confidential Dell data" },
  { code: "harassment", label: "Harassment or bullying" },
  { code: "spam", label: "Spam or misleading content" },
  { code: "other", label: "Other" },
] as const;

export type ReportReasonCode = (typeof REPORT_REASONS)[number]["code"];

// Hashtag helpers
export function parseHashtags(text: string): string[] {
  const matches = text.match(/#[\w]+/g);
  if (!matches) return [];
  return [...new Set(matches.map((tag) => tag.toLowerCase().replace(/^#/, "")))];
}

export function normalizeHashtag(tag: string): string {
  return tag.trim().toLowerCase().replace(/^#/, "");
}

// Time formatting
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Email validation
export function isDellEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@dell.com");
}
