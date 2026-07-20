#!/usr/bin/env node
/* eslint-env node */

const { spawnSync } = require('child_process');

const serviceUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';
const testallSpec = 'cypress/e2e/testall.cy.js';

function env(extra = {}) {
  const nextEnv = { ...process.env, ...extra };
  delete nextEnv.ELECTRON_RUN_AS_NODE;
  return nextEnv;
}

function run(command, commandArgs, options = {}) {
  console.log(`\n> ${[command, ...commandArgs].join(' ')}\n`);

  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    env: env(options.env),
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run('npx', [
  'cypress',
  'open',
  '--e2e',
  '--config',
  JSON.stringify({
    specPattern: testallSpec,
  }),
], {
  env: {
    CYPRESS_SERVICE_USER_AGENT: serviceUserAgent,
  },
});
