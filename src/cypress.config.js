const { defineConfig } = require("cypress");

module.exports = defineConfig({
  chromeWebSecurity: false,
  watchForFileChanges: true,
  experimentalStudio: true,
  e2e: {
    //excludeSpecPattern: "**/entity/create/*.cy.js",
    testIsolation:false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
