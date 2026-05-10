import {
  displayNameFromEmail,
  generateNameFromEmail,
  isDellEmail,
  normalizeHashtag,
  parseHashtags,
  REPORT_REASONS,
  timeAgo,
} from "@/lib/utils";

export class UtilsDriver {
  private isDellEmailResult = false;
  private parseHashtagsResult: string[] = [];
  private normalizeHashtagResult = "";
  private timeAgoResult = "";
  private displayNameResult = "";
  private generatedNameResult = "";

  when = {
    checkingDellEmail: (email: string) => {
      this.isDellEmailResult = isDellEmail(email);
    },
    parsingHashtags: (text: string) => {
      this.parseHashtagsResult = parseHashtags(text);
    },
    normalizingHashtag: (tag: string) => {
      this.normalizeHashtagResult = normalizeHashtag(tag);
    },
    computingTimeAgo: (date: Date) => {
      this.timeAgoResult = timeAgo(date);
    },
    computingDisplayName: (email: string) => {
      this.displayNameResult = displayNameFromEmail(email);
    },
    generatingNameFromEmail: (email: string) => {
      this.generatedNameResult = generateNameFromEmail(email);
    },
  };

  get = {
    isDellEmailResult: () => this.isDellEmailResult,
    parsedHashtags: () => this.parseHashtagsResult,
    normalizedHashtag: () => this.normalizeHashtagResult,
    timeAgo: () => this.timeAgoResult,
    displayName: () => this.displayNameResult,
    generatedName: () => this.generatedNameResult,
    reportReasonCodes: () => REPORT_REASONS.map((r) => r.code),
    reportReasons: () => REPORT_REASONS,
  };
}
