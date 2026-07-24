#!/usr/bin/env node
/* eslint-env node */

const { spawnSync } = require('child_process');

const ALLOW_MARKER = 'secret-scan: allow';
const PLACEHOLDER_PATTERN = /^(?:|null|undefined|true|false|none|redacted|changeme|placeholder|example|sample|dummy|fake|mock|test|todo|your[-_ ].*|paste[-_ ].*|<.*>)$/i;
const ENV_REFERENCE_PATTERN = /^(?:process\.env|import\.meta\.env|Cypress\.env|Deno\.env|os\.environ|getenv\(|\$\{|\$[A-Z_])/;
const SECRET_NAME_PATTERN = /(?:PASSWORD|PASSWD|SECRET|TOKEN|API[_-]?KEY|PRIVATE[_-]?KEY|CLIENT[_-]?SECRET)/i;

const formatRules = [
  {
    name: 'private key',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },
  {
    name: 'AWS access key',
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  },
  {
    name: 'GitHub token',
    pattern: /\b(?:gh[opusr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/,
  },
  {
    name: 'Slack token',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  },
  {
    name: 'JWT',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
];

function stagedDiff() {
  const result = spawnSync('git', [
    'diff',
    '--cached',
    '--no-color',
    '--unified=0',
    '--diff-filter=ACMR',
    '--',
  ], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Unable to read the staged Git diff.');
  }
  return result.stdout;
}

function unquote(value) {
  const trimmed = value.trim().replace(/[,;]$/, '').trim();
  if (
    trimmed.length >= 2
    && ((trimmed.startsWith('"') && trimmed.endsWith('"'))
      || (trimmed.startsWith("'") && trimmed.endsWith("'"))
      || (trimmed.startsWith('`') && trimmed.endsWith('`')))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function looksLikePlaceholder(value) {
  const normalized = unquote(value);
  return (
    PLACEHOLDER_PATTERN.test(normalized)
    || ENV_REFERENCE_PATTERN.test(normalized)
    || /(?:example|sample|dummy|fake|mock|placeholder|redacted|changeme|paste[-_ ])/i.test(normalized)
  );
}

function assignmentFinding(line) {
  const match = line.match(
    /(?:^|[\s"'`{,])([A-Za-z_][A-Za-z0-9_-]*(?:PASSWORD|PASSWD|SECRET|TOKEN|API[_-]?KEY|PRIVATE[_-]?KEY|CLIENT[_-]?SECRET)[A-Za-z0-9_-]*)\s*(?:=|:)\s*(.+)$/i,
  );
  if (!match || !SECRET_NAME_PATTERN.test(match[1])) {
    return null;
  }

  const value = unquote(match[2]);
  if (value.length < 8 || looksLikePlaceholder(value)) {
    return null;
  }

  return `literal assigned to ${match[1]}`;
}

function scanLine(line) {
  if (line.includes(ALLOW_MARKER)) {
    return [];
  }

  const findings = formatRules
    .filter((rule) => rule.pattern.test(line))
    .map((rule) => rule.name);
  const assignment = assignmentFinding(line);
  if (assignment) {
    findings.push(assignment);
  }
  return findings;
}

function scanDiff(diff) {
  const findings = [];
  let file = null;
  let newLine = 0;

  diff.split('\n').forEach((line) => {
    if (line.startsWith('+++ b/')) {
      file = line.slice(6);
      return;
    }

    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      newLine = Number(hunk[1]);
      return;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      scanLine(line.slice(1)).forEach((rule) => {
        findings.push({ file, line: newLine, rule });
      });
      newLine += 1;
    }
  });

  return findings;
}

function runSelfTest() {
  const shouldFail = [
    'APP_CLIENT_SECRET="real-looking-value-123456"', // secret-scan: allow
    'NEO4J_PASSWORD=correct-horse-battery-staple', // secret-scan: allow
    'token: "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"', // secret-scan: allow
    '-----BEGIN PRIVATE KEY-----', // secret-scan: allow
  ];
  const shouldPass = [
    'APP_CLIENT_SECRET="paste-client-secret-here"',
    'const token = process.env.GROUPS_TOKEN;',
    "groups_token: 'mock-groups-token'",
    'SECRET_KEY=""',
    'const label = "not sensitive";',
  ];

  const missed = shouldFail.filter((line) => scanLine(line).length === 0);
  const falsePositives = shouldPass.filter((line) => scanLine(line).length > 0);
  if (missed.length || falsePositives.length) {
    console.error(`Secret scanner self-test failed: ${missed.length} missed, ${falsePositives.length} false positives.`);
    process.exit(1);
  }
  console.log('Secret scanner self-test passed.');
}

if (process.argv.includes('--self-test')) {
  runSelfTest();
  process.exit(0);
}

try {
  const findings = scanDiff(stagedDiff());
  if (findings.length === 0) {
    console.log('Secret scan passed.');
    process.exit(0);
  }

  console.error('Commit blocked: possible secrets found in staged additions.');
  findings.forEach(({ file, line, rule }) => {
    console.error(`  ${file}:${line} (${rule})`);
  });
  console.error(`\nRemove the value, move it to an ignored environment file, or add "${ALLOW_MARKER}" only for a reviewed false positive.`);
  process.exit(1);
} catch (error) {
  console.error(`Secret scan failed to run: ${error.message}`);
  process.exit(1);
}
