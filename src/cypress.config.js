/* eslint-env node */
const { defineConfig } = require("cypress");

const serviceUserAgent = process.env.CYPRESS_SERVICE_USER_AGENT;

module.exports = defineConfig({
  chromeWebSecurity: false,
  watchForFileChanges: true,
  experimentalStudio: true,
  ...(serviceUserAgent ? { userAgent: serviceUserAgent } : {}),
  env: {
    authInfo: process.env.CYPRESS_AUTH_INFO,
    authSearchKeyword: process.env.CYPRESS_AUTH_SEARCH_KEYWORD,
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://127.0.0.1:9595",
    testIsolation: false,
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
});
