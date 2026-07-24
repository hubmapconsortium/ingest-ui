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

This covers the form/action unit tests under `src/tests/forms/`.

The full Vitest terminal report is also saved to
`.test-results/vitest.log`, so it remains available after Cypress opens during
`npm run test:all`.

## `npm run test:c`

Opens Cypress against the current unified spec:

```sh
npm run start -- --host 127.0.0.1 --port 8585
npm run test:c
```

Cypress defaults to `http://127.0.0.1:8585`; keep Vite on that same host and
port so redirect-sensitive authentication uses the expected app origin.

`npm run test:c` opens only `cypress/e2e/testall.cy.js`, which imports the
current form, bulk upload, and DEV service Cypress specs.

`cypress/e2e/search/authenticatedSearchSmoke.cy.js` is intentionally kept as a
targeted real-auth smoke spec. It is not imported by `testall.cy.js`; select it
directly in Cypress when validating authenticated search with a real session.

For DEV service specs and real authenticated smoke specs, keep real account
details and Groups tokens local and untracked. Copy `cypress.example.env.json`
to `cypress.env.json`, add the name, email, and manually acquired Groups token
for each account role, and keep that file untracked.

```sh
cp cypress.example.env.json cypress.env.json
npm run test:c
```

The supported roles are:

- `basic`: a normal user with read/write access
- `admin`: an administrator
- `readOnly`: a user with read-only access

Select the account used by real-auth specs with `authRole`. It defaults to
`basic` when omitted:

```json
{
  "authAccounts": {
    "basic": { "name": "...", "email": "...", "groups_token": "..." },
    "admin": { "name": "...", "email": "...", "groups_token": "..." },
    "readOnly": { "name": "...", "email": "...", "groups_token": "..." }
  },
  "authRole": "basic"
}
```

You can also supply the account map and selected role from the shell. The map
must be JSON:

```sh
export CYPRESS_AUTH_ACCOUNTS='{"basic":{"name":"...","email":"...","groups_token":"..."}}'
export CYPRESS_AUTH_ROLE="basic"
npm run test:c
```

The selected account is stored in the app's authenticated session shape:
`{ "name": "...", "email": "...", "groups_token": "..." }`.

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
- The selected `authAccounts` entry must have a valid name, email, and Groups
  token for authenticated specs.
- Use `example.env` for dummy/local template values only; never commit real
  Groups tokens.
