import LoginForm from "@/components/login-form";
import { CypressHelper } from "@shellygo/cypress-test-utils";

export class LoginFormDriver {
  private helper = new CypressHelper();

  // ============================================
  // GIVEN — Setup preconditions
  // ============================================
  given = {
    /**
     * Mount the LoginForm component in isolation
     */
    loginFormIsRendered: () => {
      this.helper.given.component(LoginForm);
    },
  };

  // ============================================
  // WHEN — User actions
  // ============================================
  when = {
    /**
     * Type an email address into the email input
     */
    typingEmail: (email: string) => {
      this.helper.when.type("email-input", email);
    },

    /**
     * Clear the email input
     */
    clearingEmail: () => {
      this.helper.when.clear("email-input");
    },

    /**
     * Click the submit button
     */
    clickingSubmit: () => {
      this.helper.when.click("submit-button");
    },

    /**
     * Submit the form with a specific email
     */
    submittingEmail: (email: string) => {
      this.when.typingEmail(email);
      this.when.clickingSubmit();
    },
  };

  // ============================================
  // GET — Query state for assertions
  // ============================================
  get = {
    /**
     * Get the email input element
     */
    emailInput: () => this.helper.get.elementByTestId("email-input"),

    /**
     * Get the submit button element
     */
    submitButton: () => this.helper.get.elementByTestId("submit-button"),

    /**
     * Get the error message text
     */
    errorMessage: () => this.helper.get.elementByTestId("error-message"),

    /**
     * Get the loading indicator
     */
    loadingIndicator: () => this.helper.get.elementByTestId("loading-indicator"),

    /**
     * Check if error message is visible
     */
    isErrorVisible: () =>
      this.helper.get.elementByTestId("error-message").should("be.visible"),

    /**
     * Check if error message is not visible
     */
    isErrorNotVisible: () =>
      this.helper.get.elementByTestId("error-message").should("not.exist"),

    /**
     * Check if submit button is disabled
     */
    isSubmitDisabled: () =>
      this.helper.get.elementByTestId("submit-button").should("be.disabled"),

    /**
     * Check if submit button is enabled
     */
    isSubmitEnabled: () =>
      this.helper.get
        .elementByTestId("submit-button")
        .should("not.be.disabled"),

    /**
     * Get the current email input value
     */
    emailInputValue: () =>
      this.helper.get.elementByTestId("email-input").invoke("val"),
  };
}