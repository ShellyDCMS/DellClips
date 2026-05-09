import { then } from "@shellygo/cypress-test-utils";
import Chance from "chance";
import { RenderFactory } from "../../../components/__test-utils__/renderer";
import { VerifyForm } from "./verify-form";
import { VerifyFormDriver } from "./verify-form.driver";

const chance = new Chance();

describe("VerifyForm", () => {
  const driver = new VerifyFormDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: VerifyForm,
        props: get.props() as any,
      }),
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given the form is rendered", () => {
    beforeEach(() => {
      when.render();
    });

    it("then the OTP input should be visible", () => {
      then(get.otpInput()).shouldBeVisible();
    });

    it("then the submit button should be visible", () => {
      then(get.submitButton()).shouldBeVisible();
    });

    it("then the submit button should display 'Verify & Sign In'", () => {
      then(get.submitButton()).shouldHaveText("Verify & Sign In");
    });

    it("then the OTP input should have correct placeholder", () => {
      then(get.otpInput()).shouldHaveAttribute("placeholder", "000000");
    });

    it("then the OTP input should accept numeric input mode", () => {
      then(get.otpInput()).shouldHaveAttribute("inputmode", "numeric");
    });

    it("then the OTP input should have a max length of 6", () => {
      then(get.otpInput()).shouldHaveAttribute("maxlength", "6");
    });

    it("then the submit button should be disabled when input is empty", () => {
      then(get.submitButton()).shouldBeDisabled();
    });
  });

  describe("given a valid 6-digit code is entered", () => {
    const code = chance.string({ length: 6, pool: "0123456789" });

    beforeEach(() => {
      when.render();
      when.typeCode(code);
    });

    it("then the submit button should be enabled", () => {
      then(get.submitButton()).shouldBeEnabled();
    });
  });

  describe("given a partial code is entered", () => {
    const partialCode = chance.string({ length: 3, pool: "0123456789" });

    beforeEach(() => {
      when.render();
      when.typeCode(partialCode);
    });

    it("then the submit button should remain disabled", () => {
      then(get.submitButton()).shouldBeDisabled();
    });
  });

  describe("given non-numeric characters are typed", () => {
    beforeEach(() => {
      when.render();
      when.typeCode("abc123");
    });

    it("then the OTP input should only contain the numeric characters", () => {
      then(get.otpInput()).shouldHaveValue("123");
    });

    it("then the submit button should remain disabled", () => {
      then(get.submitButton()).shouldBeDisabled();
    });
  });

  describe("given an email prop is provided", () => {
    const email = chance.email({ domain: "dell.com" });

    beforeEach(() => {
      given.email(email);
      when.render();
    });

    it("then the OTP input should be visible", () => {
      then(get.otpInput()).shouldBeVisible();
    });

    it("then the submit button should be visible", () => {
      then(get.submitButton()).shouldBeVisible();
    });
  });
});
