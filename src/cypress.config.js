/* eslint-env node */
const { defineConfig } = require("cypress");

const serviceUserAgent = process.env.CYPRESS_SERVICE_USER_AGENT;

module.exports = defineConfig({
  chromeWebSecurity: false,
  watchForFileChanges: true,
  experimentalStudio: true,
  retries: {
    runMode: 2,
    openMode: 2,
  },
  ...(serviceUserAgent ? { userAgent: serviceUserAgent } : {}),
  env: {
    authAccounts: process.env.CYPRESS_AUTH_ACCOUNTS,
    authRole: process.env.CYPRESS_AUTH_ROLE,
    authSearchKeyword: process.env.CYPRESS_AUTH_SEARCH_KEYWORD,
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://127.0.0.1:8585",
    testIsolation: false,
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
});
