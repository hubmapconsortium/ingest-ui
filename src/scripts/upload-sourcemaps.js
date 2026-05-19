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
  '--env',
  envName,
  '--site',
  site,
];
if (dry) baseArgs.push('--dry-run');

// Need to sort out datadog ci npm 404 Complication
// https://github.com/DataDog/datadog-ci/issues/1073
// Submit New bug if necessary, related to AWS sitch
// run('npx', ['datadog-ci', ...baseArgs], {});

console.log('\nNot Run, see coments. Sorry bout that...');
