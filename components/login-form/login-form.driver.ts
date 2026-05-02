import { BaseTestDriver } from "../__test-utils__/base-test-driver";

interface LoginFormDriverProps {
  // LoginForm has no props — it's a self-contained form component
}

export class LoginFormDriver extends BaseTestDriver<LoginFormDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
  };

  when = {
    ...this._when,
    typeEmail: (email: string) => this.helper.when.type("email-input", email),
    clickSubmit: () => this.helper.when.click("submit-button"),
    submitEmail: (email: string) => {
      this.helper.when.type("email-input", email);
      this.helper.when.click("submit-button");
    },
  };

  get = {
    ...this._get,
    emailInput: () => this.helper.get.elementByTestId("email-input"),
    submitButton: () => this.helper.get.elementByTestId("submit-button"),
    errorMessage: () => this.helper.get.elementByTestId("error-message"),
    errorMessageText: () => this.helper.get.elementsText("error-message"),
    loadingIndicator: () => this.helper.get.elementByTestId("loading-indicator"),
  };
}
