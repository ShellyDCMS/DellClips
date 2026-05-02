import ReportDialog from "@/components/report-dialog";
import { CypressHelper } from "@shellygo/cypress-test-utils";

export class ReportDialogDriver {
  private helper = new CypressHelper();

  given = {
    reportDialogIsRendered: (videoId: string = "test-video-id") => {
      this.helper.given.component(ReportDialog, {
        props: {
          videoId,
          isOpen: true,
          onClose: cy.stub().as("onClose"),
          onSubmit: cy.stub().as("onSubmit"),
        },
      });
    },

    reportDialogIsClosed: () => {
      this.helper.given.component(ReportDialog, {
        props: {
          videoId: "test-video-id",
          isOpen: false,
          onClose: cy.stub(),
          onSubmit: cy.stub(),
        },
      });
    },
  };

  when = {
    selectingReason: (reason: string) => {
      this.helper.when.click("report-reason-" + reason);
    },

    typingDescription: (text: string) => {
      this.helper.when.type("report-description", text);
    },

    clickingSubmitReport: () => {
      this.helper.when.click("report-submit-button");
    },

    clickingCancel: () => {
      this.helper.when.click("report-cancel-button");
    },

    submittingReport: (reason: string, description?: string) => {
      this.when.selectingReason(reason);
      if (description) {
        this.when.typingDescription(description);
      }
      this.when.clickingSubmitReport();
    },
  };

  get = {
    dialog: () => this.helper.get.elementByTestId("report-dialog"),

    reasonOptions: () => this.helper.get.elementByTestId("report-reasons"),

    selectedReason: (reason: string) =>
      this.helper.get.elementByTestId("report-reason-" + reason),

    descriptionInput: () =>
      this.helper.get.elementByTestId("report-description"),

    submitButton: () =>
      this.helper.get.elementByTestId("report-submit-button"),

    cancelButton: () =>
      this.helper.get.elementByTestId("report-cancel-button"),

    isDialogVisible: () =>
      this.helper.get.elementByTestId("report-dialog").should("be.visible"),

    isDialogNotVisible: () =>
      this.helper.get.elementByTestId("report-dialog").should("not.exist"),

    isSubmitDisabled: () =>
      this.helper.get
        .elementByTestId("report-submit-button")
        .should("be.disabled"),
  };
}