import { beforeEach, describe, expect, it } from "vitest";
import { UtilsDriver } from "../drivers/utils.driver";

let driver: UtilsDriver;

beforeEach(() => {
  driver = new UtilsDriver();
});

describe("isDellEmail", () => {
  describe("given a valid @dell.com email", () => {
    it.each(["john@dell.com", "jane.doe@dell.com", "UPPER@DELL.COM", "mixed@Dell.Com"])(
      "then '%s' should be accepted",
      (email) => {
        driver.when.checkingDellEmail(email);
        expect(driver.get.isDellEmailResult()).toBe(true);
      }
    );
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
      driver.when.checkingDellEmail(email);
      expect(driver.get.isDellEmailResult()).toBe(false);
    });
  });
});

describe("parseHashtags", () => {
  describe("given text containing hashtags", () => {
    it("then it should extract and lowercase them", () => {
      driver.when.parsingHashtags("Check out #DellTech and #Innovation");
      expect(driver.get.parsedHashtags()).toEqual(["delltech", "innovation"]);
    });
  });

  describe("given text without hashtags", () => {
    it("then it should return empty array for plain text", () => {
      driver.when.parsingHashtags("No hashtags here");
      expect(driver.get.parsedHashtags()).toEqual([]);
    });

    it("then it should return empty array for empty string", () => {
      driver.when.parsingHashtags("");
      expect(driver.get.parsedHashtags()).toEqual([]);
    });
  });

  describe("given duplicate hashtags", () => {
    it("then it should deduplicate them", () => {
      driver.when.parsingHashtags("#Dell #dell #DELL");
      expect(driver.get.parsedHashtags()).toEqual(["dell"]);
    });
  });

  describe("given hashtags with numbers and underscores", () => {
    it("then it should include them", () => {
      driver.when.parsingHashtags("#Q4_2025 #sales123");
      expect(driver.get.parsedHashtags()).toEqual(["q4_2025", "sales123"]);
    });
  });
});

describe("normalizeHashtag", () => {
  describe("given a hashtag with # prefix and mixed case", () => {
    it("then it should lowercase and remove # for '#DellTech'", () => {
      driver.when.normalizingHashtag("#DellTech");
      expect(driver.get.normalizedHashtag()).toBe("delltech");
    });

    it("then it should lowercase 'DellTech'", () => {
      driver.when.normalizingHashtag("DellTech");
      expect(driver.get.normalizedHashtag()).toBe("delltech");
    });

    it("then it should trim whitespace around '  #DellTech  '", () => {
      driver.when.normalizingHashtag("  #DellTech  ");
      expect(driver.get.normalizedHashtag()).toBe("delltech");
    });
  });
});

describe("timeAgo", () => {
  describe("given a timestamp from seconds ago", () => {
    it("then it should show seconds", () => {
      driver.when.computingTimeAgo(new Date(Date.now() - 30 * 1000));
      expect(driver.get.timeAgo()).toBe("30s ago");
    });
  });

  describe("given a timestamp from minutes ago", () => {
    it("then it should show minutes", () => {
      driver.when.computingTimeAgo(new Date(Date.now() - 5 * 60 * 1000));
      expect(driver.get.timeAgo()).toBe("5m ago");
    });
  });

  describe("given a timestamp from hours ago", () => {
    it("then it should show hours", () => {
      driver.when.computingTimeAgo(new Date(Date.now() - 3 * 60 * 60 * 1000));
      expect(driver.get.timeAgo()).toBe("3h ago");
    });
  });

  describe("given a timestamp from days ago", () => {
    it("then it should show days", () => {
      driver.when.computingTimeAgo(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      expect(driver.get.timeAgo()).toBe("7d ago");
    });
  });

  describe("given a timestamp from months ago", () => {
    it("then it should show months", () => {
      driver.when.computingTimeAgo(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));
      expect(driver.get.timeAgo()).toBe("2mo ago");
    });
  });
});

describe("displayNameFromEmail", () => {
  describe("given an email with dot-separated name", () => {
    it("then it should capitalize each part", () => {
      driver.when.computingDisplayName("shelly.goldblit@dell.com");
      expect(driver.get.displayName()).toBe("Shelly Goldblit");
    });
  });

  describe("given an email with underscore-separated name", () => {
    it("then it should capitalize each part", () => {
      driver.when.computingDisplayName("john_doe@dell.com");
      expect(driver.get.displayName()).toBe("John Doe");
    });
  });

  describe("given an email with hyphen-separated name", () => {
    it("then it should capitalize each part", () => {
      driver.when.computingDisplayName("mary-jane@dell.com");
      expect(driver.get.displayName()).toBe("Mary Jane");
    });
  });

  describe("given a single-word email", () => {
    it("then it should capitalize it", () => {
      driver.when.computingDisplayName("admin@dell.com");
      expect(driver.get.displayName()).toBe("Admin");
    });
  });

  describe("given an email with mixed separators", () => {
    it("then it should split on all separators", () => {
      driver.when.computingDisplayName("john.doe_smith@dell.com");
      expect(driver.get.displayName()).toBe("John Doe Smith");
    });
  });

  describe("given an email with uppercase letters", () => {
    it("then it should normalize to title case", () => {
      driver.when.computingDisplayName("SHELLY.GOLDBLIT@DELL.COM");
      expect(driver.get.displayName()).toBe("Shelly Goldblit");
    });
  });
});

describe("REPORT_REASONS", () => {
  describe("given the report reasons configuration", () => {
    it("then it should contain all required reason codes", () => {
      const codes = driver.get.reportReasonCodes();
      expect(codes).toContain("offensive");
      expect(codes).toContain("restricted_data");
      expect(codes).toContain("harassment");
      expect(codes).toContain("spam");
      expect(codes).toContain("other");
    });

    it("then every reason should have a descriptive label", () => {
      for (const reason of driver.get.reportReasons()) {
        expect(reason.label).toBeTruthy();
        expect(reason.label.length).toBeGreaterThan(3);
      }
    });
  });
});

describe("generateNameFromEmail", () => {
  it("given an email with dots, then it should convert to title case name", () => {
    driver.when.generatingNameFromEmail("roi.mizrachi@dell.com");
    expect(driver.get.generatedName()).toBe("Roi Mizrachi");
  });

  it("given an email with underscores, then it should convert to title case name", () => {
    driver.when.generatingNameFromEmail("john_doe@dell.com");
    expect(driver.get.generatedName()).toBe("John Doe");
  });

  it("given an email with hyphens, then it should convert to title case name", () => {
    driver.when.generatingNameFromEmail("jane-smith@dell.com");
    expect(driver.get.generatedName()).toBe("Jane Smith");
  });

  it("given an email with multiple parts, then it should capitalize each word", () => {
    driver.when.generatingNameFromEmail("john.q.public@dell.com");
    expect(driver.get.generatedName()).toBe("John Q Public");
  });

  it("given a simple email, then it should capitalize the local part", () => {
    driver.when.generatingNameFromEmail("admin@dell.com");
    expect(driver.get.generatedName()).toBe("Admin");
  });

  it("given an email with numbers, then it should remove them", () => {
    driver.when.generatingNameFromEmail("john.doe99@dell.com");
    expect(driver.get.generatedName()).toBe("John Doe");
  });

  it("given an email with all caps, then it should normalize to title case", () => {
    driver.when.generatingNameFromEmail("JOHN.DOE@dell.com");
    expect(driver.get.generatedName()).toBe("John Doe");
  });
});
