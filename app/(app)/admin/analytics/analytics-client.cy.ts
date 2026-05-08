import { then } from "@shellygo/cypress-test-utils";
import Chance from "chance";
import { RenderFactory } from "@/components/__test-utils__/renderer";
import AnalyticsClient from "./analytics-client";
import { AnalyticsClientDriver } from "./analytics-client.driver";

const chance = new Chance();

const createMockAnalyticsData = () => ({
  period: { days: 30, since: new Date().toISOString() },
  overview: {
    totalUsers: chance.integer({ min: 1, max: 500 }),
    totalVideos: chance.integer({ min: 1, max: 200 }),
    totalEvents: chance.integer({ min: 1, max: 10000 }),
  },
  eventCounts: [
    { eventType: "video_view", count: chance.integer({ min: 1, max: 100 }) },
    { eventType: "video_like", count: chance.integer({ min: 1, max: 50 }) },
  ],
  dailyActiveUsers: [{ date: "2025-05-01", count: chance.integer({ min: 1, max: 20 }) }],
  topVideos: [
    {
      videoId: chance.guid(),
      title: chance.sentence({ words: 3 }),
      views: chance.integer({ min: 1, max: 1000 }),
    },
  ],
  topUsers: [
    {
      userId: chance.guid(),
      email: chance.email(),
      name: chance.name(),
      eventCount: chance.integer({ min: 1, max: 500 }),
    },
  ],
  recentEvents: [
    {
      id: chance.guid(),
      eventType: "video_view",
      createdAt: new Date().toISOString(),
      userEmail: chance.email(),
      videoTitle: chance.sentence({ words: 3 }),
    },
  ],
});

describe("AnalyticsClient", () => {
  const driver = new AnalyticsClientDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  beforeEach(() => {
    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: AnalyticsClient,
        props: get.props() as any,
      }),
    });
    given.renderer(renderFactory.createRenderer());
  });

  describe("given analytics data is loaded successfully", () => {
    const mockData = createMockAnalyticsData();

    beforeEach(() => {
      given.analyticsResponse(mockData);
      when.render();
      when.waitForAnalytics();
    });

    it("then the analytics container should be visible", () => {
      then(get.container()).shouldBeVisible();
    });

    it("then the title should display Analytics", () => {
      then(get.titleText()).shouldInclude("Analytics");
    });

    it("then the period select should be visible", () => {
      then(get.periodSelect()).shouldBeVisible();
    });

    it("then the overview section should be visible", () => {
      then(get.overview()).shouldBeVisible();
    });

    it("then the total users count should be displayed", () => {
      then(get.totalUsersText()).shouldInclude(String(mockData.overview.totalUsers));
    });

    it("then the total videos count should be displayed", () => {
      then(get.totalVideosText()).shouldInclude(String(mockData.overview.totalVideos));
    });

    it("then the total events count should be displayed", () => {
      then(get.totalEventsText()).shouldInclude(String(mockData.overview.totalEvents));
    });

    it("then the event breakdown section should be visible", () => {
      then(get.eventBreakdown()).shouldBeVisible();
    });

    it("then the top videos section should be visible", () => {
      then(get.topVideos()).shouldBeVisible();
    });

    it("then the top users section should be visible", () => {
      then(get.topUsers()).shouldBeVisible();
    });

    it("then the recent activity section should be visible", () => {
      then(get.recentActivity()).shouldBeVisible();
    });
  });

  describe("given analytics data has no top videos", () => {
    const mockData = createMockAnalyticsData();
    const dataWithNoVideos = { ...mockData, topVideos: [] };

    beforeEach(() => {
      given.analyticsResponse(dataWithNoVideos);
      when.render();
      when.waitForAnalytics();
    });

    it("then the no views message should be visible", () => {
      then(get.noViewsMessage()).shouldBeVisible();
    });

    it("then the no views message should display correct text", () => {
      then(get.noViewsMessageText()).shouldInclude("No views yet");
    });
  });

  describe("given analytics data has no top users", () => {
    const mockData = createMockAnalyticsData();
    const dataWithNoUsers = { ...mockData, topUsers: [] };

    beforeEach(() => {
      given.analyticsResponse(dataWithNoUsers);
      when.render();
      when.waitForAnalytics();
    });

    it("then the no activity message should be visible", () => {
      then(get.noActivityMessage()).shouldBeVisible();
    });

    it("then the no activity message should display correct text", () => {
      then(get.noActivityMessageText()).shouldInclude("No activity yet");
    });
  });
});
