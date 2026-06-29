# Cypress smoke tests

These Cypress specs include opt-in authenticated smoke checks for React 19
migration confidence. Do not commit real auth/session tokens.

## Authenticated form smoke tests

In one terminal, provide a current local session JSON and start the app:

```sh
export CYPRESS_AUTH_INFO='{"name":"...","email":"...","globus_id":"...","auth_token":"...","transfer_token":"...","groups_token":"..."}'

npm start
```

Then, in a second terminal:

```sh
npm run cypress:forms
```

If you store the session JSON in a local untracked file:

```sh
export CYPRESS_AUTH_INFO="$(cat ./auth-info.local.json)"
npm run cypress:forms
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
npm run cypress:open
```

## Related verification commands

```sh
npm run verify:react19
npm run verify:docker-config
npm run verify:docker-build
```

## Notes

- `npm start` must be running at `http://localhost:8585` unless
  `CYPRESS_BASE_URL` is set.
- `CYPRESS_AUTH_INFO` must be set in the same shell where Cypress runs.
- The session tokens must be valid and unexpired.
- Use `example.env` for dummy/local template values only; never commit real
  session JSON.
