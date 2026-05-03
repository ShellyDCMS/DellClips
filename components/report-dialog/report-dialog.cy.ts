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
      get.dialog().should("be.visible");
    });

    it("then the report reasons should be displayed", () => {
      get.reportReasons().should("be.visible");
    });

    it("then all five report reason buttons should be present", () => {
      get.reasonButton("offensive").should("be.visible");
      get.reasonButton("restricted_data").should("be.visible");
      get.reasonButton("harassment").should("be.visible");
      get.reasonButton("spam").should("be.visible");
      get.reasonButton("other").should("be.visible");
    });

    it("then the description textarea should be visible", () => {
      get.descriptionInput().should("be.visible");
    });

    it("then the submit button should be disabled when no reason is selected", () => {
      get.submitButton().should("be.disabled");
    });

    it("then the cancel button should be visible", () => {
      get.cancelButton().should("be.visible");
    });
  });

  describe("given the dialog is closed", () => {
    beforeEach(() => {
      given.isOpen(false);
      when.render();
    });

    it("then the dialog should not exist in the DOM", () => {
      get.dialog().should("not.exist");
    });
  });

  describe("given a reason is selected", () => {
    beforeEach(() => {
      given.isOpen(true);
      when.render();
      when.selectReason("offensive");
    });

    it("then the submit button should be enabled", () => {
      get.submitButton().should("not.be.disabled");
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
      get.onSubmitSpy().should("have.been.calledWith", "spam", undefined);
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
      get
        .onSubmitSpy()
        .should("have.been.calledWith", "other", "This video contains misleading info");
    });
  });

  describe("given the cancel button is clicked", () => {
    beforeEach(() => {
      given.isOpen(true);
      when.render();
      when.clickCancel();
    });

    it("then the onClose callback should be called", () => {
      get.onCloseSpy().should("have.been.called");
    });
  });
});
