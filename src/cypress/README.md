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
npm run start -- --host 127.0.0.1 --port 9595
npm run test:c
```

Cypress defaults to `http://127.0.0.1:9595`. If that port is unavailable, start
Vite on a different testing port and pass the matching base URL:

```sh
npm run start -- --host 127.0.0.1 --port 9696
CYPRESS_BASE_URL=http://127.0.0.1:9696 npm run test:c
```

`npm run test:c` opens only `cypress/e2e/testall.cy.js`, which imports the
current form, bulk upload, and DEV service Cypress specs.

For DEV service specs, keep real tokens local and untracked. The Cypress helper
supports `cypress.env.json` or the shell variable below:

```sh
export CYPRESS_AUTH_INFO="$(cat ./auth-info.local.json)"
npm run test:c
```

## `npm run test:all`

Runs Vitest first, then opens Cypress:

```sh
npm run start -- --host 127.0.0.1 --port 9595
npm run test:all
```

## Related verification commands

```sh
npm run verify:react19
npm run verify:docker-config
npm run verify:docker-build
```

## Notes

- Keep `9595` as the default local testing port when possible.
- `CYPRESS_AUTH_INFO` must be set in the same shell where Cypress runs.
- The `groups_token` must be valid and unexpired for HuBMAP service calls.
- Use `example.env` for dummy/local template values only; never commit real
  session JSON.
