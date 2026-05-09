import { then } from "@shellygo/cypress-test-utils";
import { RenderFactory } from "../__test-utils__/renderer";
import LoginForm from "./login-form";
import { LoginFormDriver } from "./login-form.driver";

describe("LoginForm", () => {
  const driver = new LoginFormDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: LoginForm,
        props: get.props() as any,
      }),
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given the form is rendered", () => {
    beforeEach(() => {
      when.render();
    });

    it("then the email input should be visible", () => {
      then(get.emailInput()).shouldBeVisible();
    });

    it("then the submit button should be visible", () => {
      then(get.submitButton()).shouldBeVisible();
    });

    it('then the submit button should display "Continue with Email"', () => {
      then(get.submitButton()).shouldHaveText("Continue with Email");
    });

    it("then the email input should have correct placeholder", () => {
      then(get.emailInput()).shouldHaveAttribute("placeholder", "yourname@dell.com");
    });
  });

  describe("given a non-dell email is submitted", () => {
    beforeEach(() => {
      when.render();
      when.submitEmail("user@gmail.com");
    });

    it("then an error message should be displayed", () => {
      then(get.errorMessage()).shouldBeVisible();
    });

    it("then the error should mention @dell.com", () => {
      then(get.errorMessageText()).shouldInclude("@dell.com");
    });
  });

  describe("given an empty form is submitted", () => {
    beforeEach(() => {
      when.render();
    });

    it("then the native HTML validation should prevent submission", () => {
      then(get.emailInput()).shouldHaveAttribute("required", "required");
    });
  });
});
