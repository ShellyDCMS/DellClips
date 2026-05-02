import {
    isDellEmail,
    normalizeHashtag,
    parseHashtags,
    REPORT_REASONS,
    timeAgo,
} from "@/lib/utils";
import { describe, expect, it } from "vitest";

describe("isDellEmail", () => {
  describe("given a valid @dell.com email", () => {
    it.each([
      "john@dell.com",
      "jane.doe@dell.com",
      "UPPER@DELL.COM",
      "mixed@Dell.Com",
    ])("then '%s' should be accepted", (email) => {
      expect(isDellEmail(email)).toBe(true);
    });
  });

  describe("given a non-dell email", () => {
    it.each([
      "john@gmail.com",
      "john@dell.org",
      "john@notdell.com",
      "john@dell.com.evil.com",
      "",
      "dell.com@gmail.com",
      "user@subdomain.dell.com",
    ])("then '%s' should be rejected", (email) => {
      expect(isDellEmail(email)).toBe(false);
    });
  });
});

describe("parseHashtags", () => {
  describe("given text containing hashtags", () => {
    it("then it should extract and lowercase them", () => {
      // given
      const text = "Check out #DellTech and #Innovation";
      // when
      const result = parseHashtags(text);
      // then
      expect(result).toEqual(["delltech", "innovation"]);
    });
  });

  describe("given text without hashtags", () => {
    it("then it should return empty array", () => {
      expect(parseHashtags("No hashtags here")).toEqual([]);
      expect(parseHashtags("")).toEqual([]);
    });
  });

  describe("given duplicate hashtags", () => {
    it("then it should deduplicate them", () => {
      expect(parseHashtags("#Dell #dell #DELL")).toEqual(["dell"]);
    });
  });

  describe("given hashtags with numbers and underscores", () => {
    it("then it should include them", () => {
      expect(parseHashtags("#Q4_2025 #sales123")).toEqual([
        "q4_2025",
        "sales123",
      ]);
    });
  });
});

describe("normalizeHashtag", () => {
  describe("given a hashtag with # prefix and mixed case", () => {
    it("then it should lowercase and remove #", () => {
      expect(normalizeHashtag("#DellTech")).toBe("delltech");
      expect(normalizeHashtag("DellTech")).toBe("delltech");
      expect(normalizeHashtag("  #DellTech  ")).toBe("delltech");
    });
  });
});

describe("timeAgo", () => {
  describe("given a timestamp from seconds ago", () => {
    it("then it should show seconds", () => {
      const date = new Date(Date.now() - 30 * 1000);
      expect(timeAgo(date)).toBe("30s ago");
    });
  });

  describe("given a timestamp from minutes ago", () => {
    it("then it should show minutes", () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(timeAgo(date)).toBe("5m ago");
    });
  });

  describe("given a timestamp from hours ago", () => {
    it("then it should show hours", () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(timeAgo(date)).toBe("3h ago");
    });
  });

  describe("given a timestamp from days ago", () => {
    it("then it should show days", () => {
      const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      expect(timeAgo(date)).toBe("7d ago");
    });
  });

  describe("given a timestamp from months ago", () => {
    it("then it should show months", () => {
      const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      expect(timeAgo(date)).toBe("2mo ago");
    });
  });
});

describe("REPORT_REASONS", () => {
  describe("given the report reasons configuration", () => {
    it("then it should contain all required reason codes", () => {
      const codes = REPORT_REASONS.map((r) => r.code);
      expect(codes).toContain("offensive");
      expect(codes).toContain("restricted_data");
      expect(codes).toContain("harassment");
      expect(codes).toContain("spam");
      expect(codes).toContain("other");
    });

    it("then every reason should have a descriptive label", () => {
      for (const reason of REPORT_REASONS) {
        expect(reason.label).toBeTruthy();
        expect(reason.label.length).toBeGreaterThan(3);
      }
    });
  });
});