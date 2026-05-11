import { RenderFactory } from "@/components/__test-utils__/renderer";
import { then } from "@shellygo/cypress-test-utils";
import Chance from "chance";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import AdminReportsClient from "./reports-client";
import { AdminReportsClientDriver } from "./reports-client.driver";

const chance = new Chance();

const makeReport = (overrides: Record<string, unknown> = {}) => ({
  id: chance.guid(),
  reason: "spam",
  description: chance.sentence(),
  status: "pending",
  createdAt: new Date().toISOString(),
  video: { id: chance.guid(), title: chance.sentence({ words: 3 }) },
  reportedBy: { id: chance.guid(), name: chance.name(), email: chance.email() },
  ...overrides,
});

describe("AdminReportsClient", () => {
  const driver = new AdminReportsClientDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  const mockRouter = {
    back: () => {},
    forward: () => {},
    push: () => {},
    replace: () => {},
    refresh: () => {},
    prefetch: () => Promise.resolve(),
  };

  beforeEach(() => {
    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: AdminReportsClient,
        props: get.props() as any,
      }),
      wrappers: () => [{ type: AppRouterContext.Provider, props: { value: mockRouter } }],
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given there are no pending reports", () => {
    beforeEach(() => {
      given.reportsResponse([]);
      when.render();
      when.waitForFetchReports();
    });

    it("then the empty message should be visible", () => {
      then(get.emptyMessage()).shouldBeVisible();
    });

    it("then there should be no report items", () => {
      then(get.reportItem()).shouldNotExist();
    });

    it("then the title should include Reported Videos", () => {
      then(get.title()).shouldInclude("Reported Videos");
    });
  });

  describe("given a list of pending reports", () => {
    const reportOne = makeReport();
    const reportTwo = makeReport({ reason: "harassment" });

    beforeEach(() => {
      given.reportsResponse([reportOne, reportTwo]);
      when.render();
      when.waitForFetchReports();
    });

    it("then there should be two report items", () => {
      then(get.numberOfReports()).shouldEqual(2);
    });

    it("then the first report video title should be displayed", () => {
      then(get.reportTitleText()).shouldInclude(reportOne.video.title as string);
    });

    it("then the reason label should be displayed", () => {
      then(get.reportReasonText()).shouldInclude("spam");
    });

    it("then the description should be displayed", () => {
      then(get.reportDescriptionText()).shouldInclude(reportOne.description);
    });
  });

  describe("given a report with no title", () => {
    const report = makeReport({ video: { id: chance.guid(), title: null } });

    beforeEach(() => {
      given.reportsResponse([report]);
      when.render();
      when.waitForFetchReports();
    });

    it("then it should show the Untitled video fallback", () => {
      then(get.reportTitleText()).shouldInclude("Untitled video");
    });
  });

  describe("given the user confirms a dismiss action", () => {
    const report = makeReport();

    beforeEach(() => {
      given.reportsResponse([report]);
      given.interceptReportPut(true);
      given.confirmDialog(true);
      when.render();
      when.waitForFetchReports();
      when.clickDismiss();
      when.waitForReportPut();
    });

    it("then it should send a PUT with action=dismiss", () => {
      then(get.reportPutRequestBody()).shouldDeepNestedInclude({
        reportId: report.id,
        action: "dismiss",
      });
    });

    it("then the report should be removed from the list", () => {
      then(get.reportItem()).shouldNotExist();
    });
  });

  describe("given the user confirms a remove_video action", () => {
    const report = makeReport();

    beforeEach(() => {
      given.reportsResponse([report]);
      given.interceptReportPut(true);
      given.confirmDialog(true);
      when.render();
      when.waitForFetchReports();
      when.clickRemoveVideo();
      when.waitForReportPut();
    });

    it("then it should send a PUT with action=remove_video and videoId", () => {
      then(get.reportPutRequestBody()).shouldDeepNestedInclude({
        reportId: report.id,
        action: "remove_video",
        videoId: report.video.id,
      });
    });

    it("then the report should be removed from the list", () => {
      then(get.reportItem()).shouldNotExist();
    });
  });
});
