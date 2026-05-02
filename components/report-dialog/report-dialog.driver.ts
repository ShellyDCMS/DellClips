import { BaseTestDriver } from '../__test-utils__/base-test-driver';

interface ReportDialogDriverProps {
  videoId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (reason: string, description?: string) => void;
}

export class ReportDialogDriver extends BaseTestDriver<ReportDialogDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    videoId: (videoId: string) => {
      this.props.videoId = videoId;
    },
    isOpen: (value: boolean = true) => {
      this.props.isOpen = value;
    },
    onCloseSpy: () => {
      this.props.onClose = this.helper.given.spy('onClose');
    },
    onSubmitSpy: () => {
      this.props.onSubmit = this.helper.given.spy('onSubmit');
    },
  };

  when = {
    ...this._when,
    selectReason: (reasonCode: string) => this.helper.when.click(`report-reason-${reasonCode}`),
    typeDescription: (text: string) => this.helper.when.type('report-description', text),
    clickSubmit: () => this.helper.when.click('report-submit-button'),
    clickCancel: () => this.helper.when.click('report-cancel-button'),
  };

  get = {
    ...this._get,
    dialog: () => this.helper.get.elementByTestId('report-dialog'),
    reportReasons: () => this.helper.get.elementByTestId('report-reasons'),
    reasonButton: (reasonCode: string) => this.helper.get.elementByTestId(`report-reason-${reasonCode}`),
    descriptionInput: () => this.helper.get.elementByTestId('report-description'),
    submitButton: () => this.helper.get.elementByTestId('report-submit-button'),
    cancelButton: () => this.helper.get.elementByTestId('report-cancel-button'),
    onCloseSpy: () => this.helper.get.spy('onClose'),
    onSubmitSpy: () => this.helper.get.spy('onSubmit'),
  };
}
