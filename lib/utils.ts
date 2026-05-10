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

// Display name from email (e.g. "shelly.goldblit@dell.com" → "Shelly Goldblit")
export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0];
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Generate a display name from an email address.
 * Examples:
 *   "roi.mizrachi@dell.com"     → "Roi Mizrachi"
 *   "shelly.goldblit@dell.com"  → "Shelly Goldblit"
 *   "john_doe@dell.com"         → "John Doe"
 *   "jane-smith@dell.com"       → "Jane Smith"
 *   "admin@dell.com"            → "Admin"
 *   "john.q.public@dell.com"    → "John Q Public"
 */
export function generateNameFromEmail(email: string): string {
  const localPart = email.split("@")[0];

  return (
    localPart
      .replace(/[._-]/g, " ") // Replace dots, underscores, hyphens with spaces
      .replace(/\d+/g, "") // Remove numbers
      .trim()
      .split(/\s+/) // Split by whitespace
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
      .join(" ")
      .trim() || email.split("@")[0]
  ); // Fallback to raw local part if empty
}
