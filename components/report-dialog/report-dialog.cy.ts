import { then } from "@shellygo/cypress-test-utils";
import { RenderFactory } from "../__test-utils__/renderer";
import ReportDialog from "./report-dialog";
import { ReportDialogDriver } from "./report-dialog.driver";

describe("ReportDialog", () => {
  const driver = new ReportDialogDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    given.videoId("video-123");
    given.onCloseSpy();
    given.onSubmitSpy();

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: ReportDialog,
        props: get.props() as any,
      }),
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given the dialog is open", () => {
    beforeEach(() => {
      given.isOpen(true);
      when.render();
    });

    it("then the dialog should be visible", () => {
      then(get.dialog()).shouldBeVisible();
    });

    it("then the report reasons should be displayed", () => {
      then(get.reportReasons()).shouldBeVisible();
    });

    it("then all five report reason buttons should be present", () => {
      then(get.reasonButton("offensive")).shouldBeVisible();
      then(get.reasonButton("restricted_data")).shouldBeVisible();
      then(get.reasonButton("harassment")).shouldBeVisible();
      then(get.reasonButton("spam")).shouldBeVisible();
      then(get.reasonButton("other")).shouldBeVisible();
    });

    it("then the description textarea should be visible", () => {
      then(get.descriptionInput()).shouldBeVisible();
    });

    it("then the submit button should be disabled when no reason is selected", () => {
      then(get.submitButton()).shouldBeDisabled();
    });

    it("then the cancel button should be visible", () => {
      then(get.cancelButton()).shouldBeVisible();
    });
  });

  describe("given the dialog is closed", () => {
    beforeEach(() => {
      given.isOpen(false);
      when.render();
    });

    it("then the dialog should not exist in the DOM", () => {
      then(get.dialog()).shouldNotExist();
    });
  });

  describe("given a reason is selected", () => {
    beforeEach(() => {
      given.isOpen(true);
      when.render();
      when.selectReason("offensive");
    });

    it("then the submit button should be enabled", () => {
      then(get.submitButton()).shouldBeEnabled();
    });
  });

  describe("given a reason is selected and submit is clicked", () => {
    beforeEach(() => {
      given.isOpen(true);
      when.render();
      when.selectReason("spam");
      when.clickSubmit();
    });

    it("then the onSubmit callback should be called with the reason", () => {
      then(get.onSubmitSpy()).shouldHaveBeenCalledWith("spam", undefined);
    });
  });

  describe("given a reason and description are provided and submit is clicked", () => {
    beforeEach(() => {
      given.isOpen(true);
      when.render();
      when.selectReason("other");
      when.typeDescription("This video contains misleading info");
      when.clickSubmit();
    });

    it("then the onSubmit callback should be called with reason and description", () => {
      then(get.onSubmitSpy()).shouldHaveBeenCalledWith(
        "other",
        "This video contains misleading info"
      );
    });
  });

  describe("given the cancel button is clicked", () => {
    beforeEach(() => {
      given.isOpen(true);
      when.render();
      when.clickCancel();
    });

    it("then the onClose callback should be called", () => {
      then(get.onCloseSpy()).shouldHaveBeenCalled();
    });
  });
});
