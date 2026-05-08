import { BaseTestDriver } from "@/components/__test-utils__/base-test-driver";

interface AnalyticsClientDriverProps {}

export class AnalyticsClientDriver extends BaseTestDriver<AnalyticsClientDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    analyticsResponse: (data: Record<string, unknown>) => {
      this.helper.given.interceptAndMockResponse({
        url: "**/api/admin/analytics**",
        alias: "fetchAnalytics",
        response: { body: data },
      });
    },
    analyticsNetworkError: () => {
      this.helper.given.interceptAndMockResponse({
        url: "**/api/admin/analytics**",
        alias: "fetchAnalytics",
        response: { forceNetworkError: true },
      });
    },
  };

  when = {
    ...this._when,
    waitForAnalytics: () => this.helper.when.waitForResponse("fetchAnalytics"),
  };

  get = {
    ...this._get,
    loadingIndicator: () => this.helper.get.elementByTestId("analytics-loading"),
    container: () => this.helper.get.elementByTestId("analytics-container"),
    title: () => this.helper.get.elementByTestId("analytics-title"),
    titleText: () => this.helper.get.elementsText("analytics-title"),
    periodSelect: () => this.helper.get.elementByTestId("analytics-period-select"),
    overview: () => this.helper.get.elementByTestId("analytics-overview"),
    totalUsersText: () => this.helper.get.elementsText("overview-total-users"),
    totalVideosText: () => this.helper.get.elementsText("overview-total-videos"),
    totalEventsText: () => this.helper.get.elementsText("overview-total-events"),
    eventBreakdown: () => this.helper.get.elementByTestId("event-breakdown"),
    topVideos: () => this.helper.get.elementByTestId("top-videos"),
    noViewsMessage: () => this.helper.get.elementByTestId("no-views-message"),
    noViewsMessageText: () => this.helper.get.elementsText("no-views-message"),
    topUsers: () => this.helper.get.elementByTestId("top-users"),
    noActivityMessage: () => this.helper.get.elementByTestId("no-activity-message"),
    noActivityMessageText: () => this.helper.get.elementsText("no-activity-message"),
    recentActivity: () => this.helper.get.elementByTestId("recent-activity"),
    analyticsRequestQueryParams: () =>
      this.helper.get.requestQueryParams("fetchAnalytics"),
  };
}
