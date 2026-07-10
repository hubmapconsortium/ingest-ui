# DEV Service Test Plan

## Immediate Setup

1. Add local DEV auth in ignored `cypress.env.json`.
2. Use dummy/testing accounts only, not personal accounts.
3. Prefer saved `groups_token` values for now while login automation is parked.
4. Keep all real credentials and tokens out of git.

Example `cypress.env.json`:

```json
{
  "serviceAuthRole": "writer",
  "authInfoByRole": {
    "writer": {
      "name": "Cypress Writer",
      "email": "writer-dummy@example.org",
      "groups_token": "PASTE_GROUPS_TOKEN"
    },
    "admin": {
      "name": "Cypress Admin",
      "email": "admin-dummy@example.org",
      "groups_token": "PASTE_GROUPS_TOKEN"
    }
  },
  "testAccounts": {
    "writer": {
      "username": "dummy-writer@example.org",
      "password": "dummy-password",
      "organization": "Google"
    }
  }
}
```

## How To Get Auth Info

1. Log into DEV manually with the dummy account.
2. Copy a valid token bundle into ignored `cypress.env.json`.
3. Set `serviceAuthRole` to the dummy role the service run should exercise.
4. Run `npm run test:c` and select the unified Cypress spec.

`auth_token` and `transfer_token` are intentionally omitted from service test
configuration because these tests are not covering Globus behavior. Keep dummy
account `username`/`password`/`organization` under `testAccounts` for later
login-bootstrap debugging. A saved `groups_token` under `authInfoByRole` or
`authInfo` currently takes priority so the service suite can keep moving; a
failed login/token flow should return cleanly to the login page once that path
is re-enabled.

Current login-bootstrap status:

- Service tests currently use the valid local `groups_token` first.
- Cypress clicks the Google icon on the Globus page for `organization: "Google"`.
- Google-page commands are wrapped in `cy.origin('https://accounts.google.com')`.
- The previous Cypress origin error is fixed.
- Google currently rejects the handoff with a `403` page before the password
  field appears, so fresh service token capture is parked for later.

## First Run

Run the unified Cypress suite and select the service tests:

```bash
npm run test:c
```

Current token-first verification:

- Ingest passes with the local `groups_token`.
- Search passes with the local `groups_token`.
- UBKG passes without auth-sensitive writes.
- Entity read/preflight coverage runs, but Entity lifecycle mutation tests fail
  if the token is not associated with a DEV data-provider group.

The initial service suite should:

- Read authenticated user groups from DEV `ingest-api`.
- Read pipeline testing privilege status from DEV `ingest-api`.
- Create a real DEV Donor through `entity-api`.
- Update that Donor.
- Read it back and confirm the update.
- Create/update/readback a Sample from a real DEV Donor.
- Create/update/readback a Dataset from a real DEV Sample.
- Create/update/readback an Upload.
- Read DEV `search-api` with a minimal query.
- Read DEV `search-api` with a Dataset filter and result-shape assertions.
- Read DEV UBKG organs, full organ metadata, Dataset types, and Upload Dataset values.

By default the suite derives `group_uuid` from the authenticated DEV user's
`/metadata/usergroups` response. Add `devServiceGroupUuid` to ignored
`cypress.env.json` to force a specific data-provider group locally.

## Next Service Test Expansion

- Create/update/readback a Publication using real Dataset sources.
- Create/update/readback a Collection using real Dataset sources.
- Create/update/readback an EPICollection using real Dataset sources.
- Add search-api checks that find the Cypress-created DEV entities by traceable label or lab ID.
- Add ingest-api allowable-edit-state checks against Cypress-created DEV entities.
- Add UBKG contract checks for any additional ontology endpoints used by Publication, Collection, and EPICollection forms.

## Role-Based Coverage

Add role-based runs using `authInfoByRole`:

- Writer dummy account.
- Admin dummy account.
- No-write/read-only dummy account, if available.
- Submit/testing-permission dummy account, if available.
- Entity owner vs non-owner cases, where possible.

## Form Test Expansion

Continue growing the per-form Cypress specs:

- Donor form.
- Sample form.
- Dataset form.
- Upload form.
- Publication form.
- Collection form.
- EPICollection form.

For each form, add coverage for:

- Complete URL prefill.
- Required and optional fields.
- Successful create.
- Successful edit.
- Immutable fields on edit.
- Dynamic fields based on source/type/status.
- Action buttons by entity status and permission set.
- Regular user and admin user variants.

## Action Button Matrix Targets

Expand beyond Dataset to cover all entity types:

- New.
- QA.
- Submitted.
- Published.
- Reorganized.
- Error.
- Public/read-only data.
- Write permission.
- Admin permission.
- Submit permission.
- Pipeline testing permission.
- Publish permission.

## Notes

- DEV is allowed to be mutated by these service tests.
- TEST and PROD should not be touched.
- The default mocked Cypress form suite should stay deterministic.
- Real DEV service tests should remain opt-in via the Cypress GUI opened by `npm run test:c`.
- Use traceable Cypress labels/descriptions on created entities so they are easy to find later.
