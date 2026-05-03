// import { LoginPageDriver } from "./drivers/login-page.driver";

// describe("Responsive Design", () => {
//   const loginPage = new LoginPageDriver();

//   context("Mobile (iPhone 14 — 390x844)", () => {
//     beforeEach(() => {
//       cy.viewport(390, 844);
//     });

//     it("should render login form correctly on mobile", () => {
//       // given
//       loginPage.given.userIsOnLoginPage();
//       // then
//       loginPage.get.emailInput().should("be.visible");
//       loginPage.get.submitButton().should("be.visible");
//       loginPage.get.pageTitle().should("be.visible");
//     });
//   });

//   context("Tablet (iPad — 768x1024)", () => {
//     beforeEach(() => {
//       cy.viewport(768, 1024);
//     });

//     it("should render login form correctly on tablet", () => {
//       // given
//       loginPage.given.userIsOnLoginPage();
//       // then
//       loginPage.get.emailInput().should("be.visible");
//       loginPage.get.submitButton().should("be.visible");
//     });
//   });

//   context("Desktop (1920x1080)", () => {
//     beforeEach(() => {
//       cy.viewport(1920, 1080);
//     });

//     it("should render login form centered on desktop", () => {
//       // given
//       loginPage.given.userIsOnLoginPage();
//       // then
//       loginPage.get.emailInput().should("be.visible");
//       loginPage.get.submitButton().should("be.visible");
//     });
//   });
// });
