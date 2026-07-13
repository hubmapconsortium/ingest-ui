# Test commands

The supported local test commands are:

```sh
npm run test:v
npm run test:c
npm run test:all
```

## `npm run test:v`

Runs the non-interactive Vitest suite.

```sh
npm run test:v
```

This covers the React migration smoke tests under `src/App.test.jsx` and the
form/action unit tests under `src/tests/`.

## `npm run test:c`

Opens Cypress against the current unified spec:

```sh
npm run start -- --host 127.0.0.1 --port 8585
npm run test:c
```

Cypress defaults to `http://127.0.0.1:8585`. If that port is unavailable, start
Vite on a different testing port and pass the matching base URL:

```sh
npm run start -- --host 127.0.0.1 --port 9696
CYPRESS_BASE_URL=http://127.0.0.1:9696 npm run test:c
```

`npm run test:c` opens only `cypress/e2e/testall.cy.js`, which imports the
current form, bulk upload, and DEV service Cypress specs.

For DEV service specs and real authenticated smoke specs, keep real tokens local
and untracked. This repo follows the SenNet Cypress CI approach of passing a
valid Globus groups token plus the matching session display name into Cypress.

Copy `cypress.example.env.json` to `cypress.env.json`, set `token` to a valid
Globus groups token, set `session_displayname` to the matching user display
name, and keep that file untracked.

```sh
cp cypress.example.env.json cypress.env.json
npm run test:c
```

You can also pass the same values from the shell:

```sh
export CYPRESS_GLOBUS_TOKEN="paste-valid-globus-groups-token-here"
export CYPRESS_SESSION_DISPLAYNAME="cypress-dev@example.org"
npm run test:c
```

To generate a fresh access token from the Globus Auth API before opening
Cypress, provide local-only Globus OAuth credentials and run:

```sh
export GLOBUS_CLIENT_ID="..."
export GLOBUS_CLIENT_SECRET="..."
export GLOBUS_GROUPS_REFRESH_TOKEN="..."
export GLOBUS_SESSION_DISPLAYNAME="cypress-dev@example.org"
npm run test:c:globus
```

`npm run test:c:globus` performs a refresh-token grant against
`https://auth.globus.org/v2/oauth2/token`, selects the groups access token, and
passes it to Cypress as `CYPRESS_GLOBUS_TOKEN`. It does not write the refreshed
access token to disk.

The helper converts those SenNet-style fields into the app's expected
`localStorage.info` shape:

`{ "name": session_displayname, "email": session_displayname, "groups_token": token }`

`CYPRESS_AUTH_INFO` with a full `info` JSON payload is still supported as a
fallback for local debugging.

## `npm run test:all`

Runs Vitest first, then opens Cypress:

```sh
npm run start -- --host 127.0.0.1 --port 8585
npm run test:all
```

## Related verification commands

```sh
npm run verify:react19
npm run verify:docker-config
npm run verify:docker-build
```

## Notes

- Keep `8585` as the default local testing port when possible. This matches the
  Vite default and `REACT_APP_URL` values used by redirect-sensitive auth flows.
- `token` and `session_displayname` must be valid for authenticated service
  specs.
- `GLOBUS_CLIENT_ID`, `GLOBUS_CLIENT_SECRET`, and
  `GLOBUS_GROUPS_REFRESH_TOKEN` are only needed for `npm run test:c:globus`.
- Use `example.env` for dummy/local template values only; never commit real
  credentials or session JSON.
