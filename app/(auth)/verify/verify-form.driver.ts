import { BaseTestDriver } from "../../../components/__test-utils__/base-test-driver";

interface VerifyFormDriverProps {
  email?: string;
}

export class VerifyFormDriver extends BaseTestDriver<VerifyFormDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = { email: "" };
    });
  };

  given = {
    ...this._given,
    email: (email: string) => {
      this.props.email = email;
    },
  };

  when = {
    ...this._when,
    typeCode: (code: string) => this.helper.when.type("otp-input", code),
    clickSubmit: () => this.helper.when.click("verify-submit"),
  };

  get = {
    ...this._get,
    otpInput: () => this.helper.get.elementByTestId("otp-input"),
    submitButton: () => this.helper.get.elementByTestId("verify-submit"),
    errorMessage: () => this.helper.get.elementByTestId("verify-error"),
    errorMessageText: () => this.helper.get.elementsText("verify-error"),
    submitButtonText: () => this.helper.get.elementsText("verify-submit"),
  };
}
