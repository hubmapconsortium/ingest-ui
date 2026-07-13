#!/usr/bin/env node
/* eslint-env node */

const https = require('https');
const { spawnSync } = require('child_process');

const tokenEndpoint = process.env.GLOBUS_AUTH_TOKEN_ENDPOINT || 'https://auth.globus.org/v2/oauth2/token';
const clientId = process.env.GLOBUS_CLIENT_ID;
const clientSecret = process.env.GLOBUS_CLIENT_SECRET;
const refreshToken = process.env.GLOBUS_GROUPS_REFRESH_TOKEN || process.env.GLOBUS_REFRESH_TOKEN;
const sessionDisplayName = process.env.CYPRESS_SESSION_DISPLAYNAME
  || process.env.GLOBUS_SESSION_DISPLAYNAME
  || process.env.GLOBUS_TEST_SESSION_DISPLAYNAME;
const targetResourceServer = process.env.GLOBUS_GROUPS_RESOURCE_SERVER || 'groups.api.globus.org';

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
}

function requestAccessToken() {
  requireEnv(clientId, 'GLOBUS_CLIENT_ID');
  requireEnv(clientSecret, 'GLOBUS_CLIENT_SECRET');
  requireEnv(refreshToken, 'GLOBUS_GROUPS_REFRESH_TOKEN or GLOBUS_REFRESH_TOKEN');
  requireEnv(sessionDisplayName, 'CYPRESS_SESSION_DISPLAYNAME or GLOBUS_SESSION_DISPLAYNAME');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }).toString();
  const endpoint = new URL(tokenEndpoint);
  const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  return new Promise((resolve, reject) => {
    const request = https.request({
      method: 'POST',
      hostname: endpoint.hostname,
      path: `${endpoint.pathname}${endpoint.search}`,
      headers: {
        Authorization: `Basic ${authorization}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (response) => {
      let responseBody = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        responseBody += chunk;
      });
      response.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(responseBody);
        } catch (error) {
          reject(new Error(`Globus token response was not JSON. HTTP ${response.statusCode}.`));
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Globus token refresh failed. HTTP ${response.statusCode}: ${parsed.error || parsed.error_description || 'unknown error'}`));
          return;
        }

        resolve(parsed);
      });
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

function selectGroupsAccessToken(tokenResponse) {
  const tokenCandidates = [
    tokenResponse,
    ...(Array.isArray(tokenResponse.other_tokens) ? tokenResponse.other_tokens : []),
  ];

  const resourceServerMatch = tokenCandidates.find((token) => {
    return token?.access_token && token.resource_server === targetResourceServer;
  });

  if (resourceServerMatch) {
    return resourceServerMatch.access_token;
  }

  const groupsScopeMatch = tokenCandidates.find((token) => {
    return token?.access_token && String(token.scope || '').includes('groups');
  });

  if (groupsScopeMatch) {
    return groupsScopeMatch.access_token;
  }

  if (tokenResponse.access_token) {
    return tokenResponse.access_token;
  }

  throw new Error(`Globus token response did not include an access token for ${targetResourceServer}.`);
}

function runCypress(accessToken) {
  const result = spawnSync(process.execPath, ['./scripts/test-cypress.js'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      CYPRESS_GLOBUS_TOKEN: accessToken,
      CYPRESS_SESSION_DISPLAYNAME: sessionDisplayName,
    },
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status || 0);
}

requestAccessToken()
  .then((tokenResponse) => {
    console.log(`Refreshed Globus access token for Cypress session ${sessionDisplayName}.`);
    runCypress(selectGroupsAccessToken(tokenResponse));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
