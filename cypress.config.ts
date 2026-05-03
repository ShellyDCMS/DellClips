import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  component: {
    specPattern: "components/**/*.cy.ts",
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
