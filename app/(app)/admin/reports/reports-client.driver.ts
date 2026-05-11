import { BaseTestDriver } from "@/components/__test-utils__/base-test-driver";

interface ReportsClientDriverProps {}

export class AdminReportsClientDriver extends BaseTestDriver<ReportsClientDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    reportsResponse: (reports: any[]) => {
      this.helper.given.interceptAndMockResponse({
        method: "GET",
        url: "**/api/admin/reports",
        alias: "fetchReports",
        response: { body: { reports } },
      });
    },
    reportsFetchFails: () => {
      this.helper.given.interceptAndMockResponse({
        method: "GET",
        url: "**/api/admin/reports",
        alias: "fetchReports",
        response: { forceNetworkError: true },
      });
    },
    interceptReportPut: (ok: boolean = true) => {
      this.helper.given.interceptAndMockResponse({
        method: "PUT",
        url: "**/api/admin/reports",
        alias: "reportPut",
        response: ok
          ? { body: { success: true } }
          : { statusCode: 500, body: { error: "Failed" } },
      });
    },
    confirmDialog: (accept: boolean) => {
      cy.on("window:confirm", () => accept);
    },
  };

  when = {
    ...this._when,
    waitForFetchReports: () => this.helper.when.waitForResponse("fetchReports"),
    waitForReportPut: () => this.helper.when.waitForResponse("reportPut"),
    clickDismiss: (index: number = 0) =>
      this.helper.when.click("report-dismiss-button", index),
    clickRemoveVideo: (index: number = 0) =>
      this.helper.when.click("report-remove-button", index),
  };

  get = {
    ...this._get,
    title: () => this.helper.get.elementsText("reports-title"),
    emptyMessage: () => this.helper.get.elementByTestId("reports-empty"),
    reportItem: () => this.helper.get.elementByTestId("report-item"),
    numberOfReports: () => this.helper.get.numberOfElements("report-item"),
    reportTitle: (index: number = 0) =>
      this.helper.get.elementByTestId("report-video-title", index),
    reportTitleText: () => this.helper.get.elementsText("report-video-title"),
    reportReasonText: () => this.helper.get.elementsText("report-reason"),
    reportDescriptionText: () => this.helper.get.elementsText("report-description"),
    reportPutRequestBody: () => this.helper.get.requestBody("reportPut"),
  };
}
