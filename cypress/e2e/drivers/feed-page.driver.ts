export class FeedPageDriver {
  given = {
    userVisitsFeedPage: () => {
      cy.visit("/feed");
    },

    userVisitsProtectedRoute: (route: string) => {
      cy.visit(route);
    },
  };

  when = {
    // Will be expanded when feed UI is built
  };

  get = {
    isRedirectedToLogin: () => cy.url().should("include", "/login"),

    isOnFeedPage: () => cy.url().should("include", "/feed"),

    welcomeMessage: () => cy.get('[data-testid="welcome-message"]'),
  };
}