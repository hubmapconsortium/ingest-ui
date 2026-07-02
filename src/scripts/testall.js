#!/usr/bin/env node
/* eslint-env node */

const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const visual = args.includes('-v') || args.includes('--visual');
const help = args.includes('-h') || args.includes('--help');

const serviceUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';

const uiBaseUrl = 'http://127.0.0.1:9696';
const uiGuiBaseUrl = 'http://127.0.0.1:9595';

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

function printHelp() {
  console.log(`
Usage:
  npm run testall
  npm run testall -- -v

Options:
  -v, --visual   Open Cypress GUI with the single testall.cy.js spec.
  -h, --help     Show this help.

Headless mode expects the local app on ${uiBaseUrl}.
Visual mode expects the local app on ${uiGuiBaseUrl}.
Click ${testallSpec} to run the UI suite, then the Services suite.
`);
}

if (help) {
  printHelp();
  process.exit(0);
}

if (visual) {
  run('npx', [
    'cypress',
    'open',
    '--e2e',
    '--config',
    JSON.stringify({
      baseUrl: uiGuiBaseUrl,
      specPattern: testallSpec,
    }),
  ], {
    env: {
      CYPRESS_BASE_URL: uiGuiBaseUrl,
      CYPRESS_SERVICE_USER_AGENT: serviceUserAgent,
    },
  });

  process.exit(0);
}

run('npx', [
  'cypress',
  'run',
  '--browser',
  'chrome',
  '--spec',
  testallSpec,
  '--config',
  `baseUrl=${uiBaseUrl}`,
], {
  env: {
    CYPRESS_BASE_URL: uiBaseUrl,
    CYPRESS_SERVICE_USER_AGENT: serviceUserAgent,
  },
});
