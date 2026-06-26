/* eslint-env node */
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  chromeWebSecurity: false,
  watchForFileChanges: true,
  experimentalStudio: true,
  env: {
    authInfo: process.env.CYPRESS_AUTH_INFO,
    authSearchKeyword: process.env.CYPRESS_AUTH_SEARCH_KEYWORD,
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:8585",
    //excludeSpecPattern: "**/entity/create/*.cy.js",
    testIsolation:false,
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
});
