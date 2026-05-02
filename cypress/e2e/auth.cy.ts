import { LoginPageDriver } from "./drivers/login-page.driver";
import { VerifyPageDriver } from "./drivers/verify-page.driver";

describe("Authentication", () => {
  const loginPage = new LoginPageDriver();
  const verifyPage = new VerifyPageDriver();

  describe("Login Page", () => {
    it("should redirect unauthenticated users to login", () => {
      // given
      loginPage.given.userVisitsHomePage();
      // then
      loginPage.get.isOnLoginPage();
    });

    it("should display DellClips branding", () => {
      // given
      loginPage.given.userIsOnLoginPage();
      // then
      loginPage.get.pageTitle().should("be.visible");
      loginPage.get.pageSubtitle().should("be.visible");
    });

    it("should show email input and submit button", () => {
      // given
      loginPage.given.userIsOnLoginPage();
      // then
      loginPage.get.emailInput().should("be.visible");
      loginPage.get.submitButton().should("be.visible");
    });

    it("should reject non-dell email addresses", () => {
      // given
      loginPage.given.userIsOnLoginPage();
      // when
      loginPage.when.submittingEmail("user@gmail.com");
      // then
      loginPage.get.isErrorMessageVisible();
    });

    it("should show loading state when submitting dell email", () => {
      // given
      loginPage.given.userIsOnLoginPage();
      loginPage.given.authEndpointIsSlow();
      // when
      loginPage.when.submittingEmail("john@dell.com");
      // then
      loginPage.get.loadingIndicator().should("be.visible");
    });

    it("should navigate to verify page after valid submission", () => {
      // given
      loginPage.given.userIsOnLoginPage();
      loginPage.given.authEndpointSucceeds();
      // when
      loginPage.when.submittingEmail("john@dell.com");
      // then
      loginPage.get.isOnVerifyPage();
    });
  });

  describe("Verify Page", () => {
    it("should show check email message", () => {
      // given
      verifyPage.given.userIsOnVerifyPage();
      // then
      verifyPage.get.pageTitle().should("be.visible");
    });

    it("should show expiry information", () => {
      // given
      verifyPage.given.userIsOnVerifyPage();
      // then
      verifyPage.get.expiryInfo().should("be.visible");
      verifyPage.get.spamFolderHint().should("be.visible");
    });

    it("should navigate back to login when clicking back link", () => {
      // given
      verifyPage.given.userIsOnVerifyPage();
      // when
      verifyPage.when.clickingBackToSignIn();
      // then
      verifyPage.get.isOnLoginPage();
    });
  });
});