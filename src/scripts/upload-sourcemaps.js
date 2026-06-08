#!/usr/bin/env node
const { spawnSync } = require('child_process');
const { exit } = require('process');

function run(cmd, args, env) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } });
  if (res.error) {
    console.error('failed to spawn', cmd, res.error);
    exit(2);
  }
  if (res.status !== 0) exit(res.status);
}

function getGitShaShort() {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    return null;
  }
}

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');

const releaseVersion = process.env.DD_VERSION || process.env.RELEASE || getGitShaShort() || require('../package.json').version;
const service = process.env.DD_SERVICE || process.env.npm_package_name || 'ingest-ui';
const envName = process.env.DD_ENV || process.env.NODE_ENV || 'production';
const site = process.env.DATADOG_SITE || 'datadoghq.com';
const apiKey = process.env.DATADOG_API_KEY;
const minifiedPathPrefix = process.env.DD_MINIFIED_PATH_PREFIX || '/static/js';

if (!apiKey && !dry) {
  console.error('\nDATADOG_API_KEY is not set. Set it in your environment or run with --dry-run to test.\n');
  exit(1);
}

console.log(`\nUploading sourcemaps to Datadog (service=${service}, release=${releaseVersion}, env=${envName}, site=${site})\n`);

const baseArgs = [
  'sourcemaps',
  'upload',
  'build/static/js',
  '--service',
  service,
  '--release-version',
  releaseVersion,
  '--minified-path-prefix',
  minifiedPathPrefix,
  // note: newer datadog-ci releases don't accept `--site`; provide via env
];
if (dry) baseArgs.push('--dry-run');

// Some datadog-ci versions removed the `--env` option. Provide the
// environment via `DD_ENV` instead and pass API key + site through env.
const runEnv = {
  DATADOG_API_KEY: apiKey || process.env.DATADOG_API_KEY,
  DD_ENV: envName,
  DATADOG_SITE: site,
};

// Need to sort out datadog ci npm 404 Complication
// https://github.com/DataDog/datadog-ci/issues/1073
run('npx', ['datadog-ci', ...baseArgs], runEnv);

// console.log('\nNot Run, see coments. Sorry bout that...');
