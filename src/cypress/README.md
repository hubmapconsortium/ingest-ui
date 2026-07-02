# Cypress smoke tests

These Cypress specs include opt-in authenticated smoke checks for React 19
migration confidence. Do not commit real auth/session tokens.

## Authenticated form smoke tests

In one terminal, provide a current local session JSON and start the app:

```sh
export CYPRESS_AUTH_INFO='{"name":"...","email":"...","groups_token":"..."}'

npm run start -- --host 127.0.0.1 --port 9696
```

Then, in a second terminal:

```sh
npm test
npm run cypress:forms
npm run testall
```

If you store the session JSON in a local untracked file:

```sh
export CYPRESS_AUTH_INFO="$(cat ./auth-info.local.json)"
npm test
```

The form smoke suite covers the new entity forms for Donor, Sample, Dataset,
Upload, Publication, Collection, and EPICollection. It verifies form loading,
key fields, and empty-submit validation. It does not create real entities.

For speed, each entity type is checked in a single visit: load assertions run
first, then the empty-submit validation assertion runs on the same page.

## Authenticated search smoke test

Optionally provide a known search keyword:

```sh
export CYPRESS_AUTH_SEARCH_KEYWORD="HBM000.TEST.000"
npm run cypress:auth-search
```

Without `CYPRESS_AUTH_SEARCH_KEYWORD`, the search smoke runs a broad
authenticated search and expects at least one result row.

## Cypress UI

```sh
npm run start -- --host 127.0.0.1 --port 9595
npm run cypress:open
npm run testall -- -v
```

`npm run testall` runs the UI form/bulk suite and the DEV Services suite through
the single `cypress/e2e/testall.cy.js` orchestrator spec. `npm run testall -- -v`
opens Cypress GUI with that one spec listed.

## Related verification commands

```sh
npm run verify:react19
npm run verify:docker-config
npm run verify:docker-build
```

## Notes

- Headless form test commands use `http://127.0.0.1:9696`.
- Cypress GUI/open commands use `http://127.0.0.1:9595`.
- `CYPRESS_AUTH_INFO` must be set in the same shell where Cypress runs.
- The `groups_token` must be valid and unexpired for HuBMAP service calls.
- Use `example.env` for dummy/local template values only; never commit real
  session JSON.
