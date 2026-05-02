import { LoginFormDriver } from "./drivers/login-form.driver";

describe("LoginForm Component", () => {
  const driver = new LoginFormDriver();

  beforeEach(() => {
    // given
    driver.given.loginFormIsRendered();
  });

  it("should render email input with correct attributes", () => {
    // then
    driver.get.emailInput().should("be.visible");
    driver.get.emailInput().should("have.attr", "required");
  });

  it("should render enabled submit button", () => {
    // then
    driver.get.submitButton().should("be.visible");
    driver.get.isSubmitEnabled();
  });

  it("should show error for non-dell email", () => {
    // when
    driver.when.submittingEmail("user@gmail.com");
    // then
    driver.get.isErrorVisible();
  });

  it("should not show error for dell email", () => {
    // when
    driver.when.typingEmail("john@dell.com");
    // then
    driver.get.isErrorNotVisible();
  });

  it("should accept keyboard input in email field", () => {
    // when
    driver.when.typingEmail("john.doe@dell.com");
    // then
    driver.get.emailInputValue().should("eq", "john.doe@dell.com");
  });

  it("should handle uppercase dell emails", () => {
    // when
    driver.when.submittingEmail("JOHN@DELL.COM");
    // then
    driver.get.isErrorNotVisible();
  });
});