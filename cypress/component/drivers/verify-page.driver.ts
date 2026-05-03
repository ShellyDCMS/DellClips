export class VerifyPageDriver {
  given = {
    userIsOnVerifyPage: () => {
      cy.visit("/verify");
    },
  };

  when = {
    clickingBackToSignIn: () => {
      cy.contains("Back to sign in").click();
    },
  };

  get = {
    pageTitle: () => cy.contains("Check your email"),

    expiryInfo: () => cy.contains("10 minutes"),

    spamFolderHint: () => cy.contains("spam folder"),

    backToSignInLink: () => cy.contains("Back to sign in"),

    isOnLoginPage: () => cy.url().should("include", "/login"),

    isOnVerifyPage: () => cy.url().should("include", "/verify"),
  };
}
