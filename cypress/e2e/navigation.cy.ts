import { FeedPageDriver } from "./drivers/feed-page.driver";
import { LoginPageDriver } from "./drivers/login-page.driver";

describe("Navigation & Protected Routes", () => {
  const loginPage = new LoginPageDriver();
  const feedPage = new FeedPageDriver();

  it("should redirect root to login when not authenticated", () => {
    // given
    loginPage.given.userVisitsHomePage();
    // then
    loginPage.get.isOnLoginPage();
  });

  it("should redirect feed to login when not authenticated", () => {
    // given
    feedPage.given.userVisitsFeedPage();
    // then
    feedPage.get.isRedirectedToLogin();
  });

  it("should redirect upload to login when not authenticated", () => {
    // given
    feedPage.given.userVisitsProtectedRoute("/upload");
    // then
    feedPage.get.isRedirectedToLogin();
  });

  it("should allow access to login page without authentication", () => {
    // given
    loginPage.given.userIsOnLoginPage();
    // then
    loginPage.get.isOnLoginPage();
    loginPage.get.pageTitle().should("be.visible");
  });
});