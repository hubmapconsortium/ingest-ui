# Cypress Test Handoff

## Current Goal

Build out Cypress coverage for HuBMAP Ingest UI forms, permissions, BulkSelector behavior, bulk upload pages, and DEV service integration tests.

The work is currently split into:

- Mocked UI/form Cypress tests that are safe and deterministic.
- Opt-in DEV service tests that mutate DEV data intentionally.

## Important Repo Context

Working directory:

```bash
/home/birdie/Documents/hubmap/ingest-ui/src
```

Dedicated local Cypress UI port:

```text
9696
```

Use this to start the app:

```bash
npm run start -- --host 127.0.0.1 --port 9696
```

Run Vitest unit tests:

```bash
npm run test:v
```

Open Cypress GUI for the unified Cypress suite:

```bash
npm run test:c
```

Run Vitest first, then open Cypress GUI:

```bash
npm run test:all
```

`npm run test:c` opens Cypress to the single `cypress/e2e/testall.cy.js`
orchestrator spec. UI specs use the local app on `9696`; service specs call DEV
service URLs directly from `cypress/e2e/services/dev/devServiceHelpers.js`.

The service test scripts also set `CYPRESS_SERVICE_USER_AGENT` to a Windows 10
Chrome 148 user agent to debug Globus browser-session rejection:

```text
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
```

The DEV service suite derives `group_uuid` from the authenticated user's DEV
`/metadata/usergroups` response. To force a specific local group, add
`devServiceGroupUuid` to ignored `cypress.env.json`.

Important Cypress/Electron note:

```bash
env -u ELECTRON_RUN_AS_NODE ...
```

The npm Cypress scripts already include this.

## Auth Strategy

Do not commit real tokens or dummy account passwords.

Use ignored local file:

```bash
cypress.env.json
```

Supported local auth shapes:

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

The DEV service helper only needs `groups_token` because these tests exercise
HuBMAP entity/search/ingest service auth, not Globus Transfer features. For now,
it prefers a locally configured token bundle:

```text
authInfoByRole[serviceAuthRole]
authInfo
```

If no valid local token bundle is configured, it can still try the dummy account
login bootstrap:

```text
testAccounts[serviceAuthRole]
```

using the configured dummy `username`, `password`, and `organization` to drive
the DEV Globus login flow and capture a fresh `?info={...}` token bundle.

Dummy testing account credentials may also be stored locally in `testAccounts` inside ignored `cypress.env.json` if useful for later UI login automation.

Login-flow tests can use `testAccounts` to verify the dummy account still
reaches normal token-bearing UI state. If a login/token flow fails, the expected
UI behavior should be a clean redirect back to the login page.

Current login-bootstrap status:

- Service tests currently use the valid local `groups_token` first.
- Cypress reaches the DEV Globus login page.
- For `organization: "Google"`, Cypress clicks the Google icon beneath the
  organization dropdown instead of selecting Google through the dropdown.
- The Globus-to-Google handoff now uses `cy.origin('https://accounts.google.com')`,
  so Cypress no longer leaves a pending Globus-page command after navigation.
- Google currently returns a `403` page before the password step:
  `We're sorry, but you do not have access to this page.`
- Fresh service token capture is parked until the Google login rejection is
  resolved later.

## Files Added / Updated

### Plan / Handoff

- `DEV_SERVICE_TEST_PLAN.md`
- `CYPRESS_TEST_HANDOFF.md`

### Cypress Form Specs

- `cypress/e2e/forms/create/donorForm.cy.js`
- `cypress/e2e/forms/create/sampleForm.cy.js`
- `cypress/e2e/forms/create/datasetForm.cy.js`
- `cypress/e2e/forms/create/uploadForm.cy.js`
- `cypress/e2e/forms/create/publicationForm.cy.js`
- `cypress/e2e/forms/create/collectionForm.cy.js`
- `cypress/e2e/forms/create/epicollectionForm.cy.js`
- `cypress/e2e/forms/create/bulkUploadPages.cy.js`
- `cypress/e2e/forms/create/formTestHelpers.js`

### DEV Service Specs

- `cypress/e2e/services/dev/devServiceHelpers.js`
- `cypress/e2e/services/dev/entityService.dev.cy.js`
- `cypress/e2e/services/dev/ingestService.dev.cy.js`
- `cypress/e2e/services/dev/searchService.dev.cy.js`
- `cypress/e2e/services/dev/ubkgService.dev.cy.js`

### Other Modified Files

- `.gitignore`
- `package.json`
- `cypress.example.env.json`
- `cypress/support/commands/general.js`
- `src/components/ui/tableBuilder.jsx`

## Mocked Form Suite Status

Latest full mocked form run:

```text
8 specs
40 tests
40 passing
```

Command used:

```bash
npm run test:c
```

Static checks passed:

```bash
npm run lint
```

## DEV Service Suite Status

Latest token-first focused Ingest run:

```text
ingestService.dev.cy.js: 2 passing
```

Latest full DEV service run with local `groups_token`:

```text
entityService.dev.cy.js: 1 passing, 2 failing
ingestService.dev.cy.js: 2 passing
searchService.dev.cy.js: 2 passing
ubkgService.dev.cy.js: 4 passing
```

The Entity failures are both DEV mutation authorization failures:

```text
403 User token is not associated with any data provider groups
```

Use a token associated with a DEV data-provider group, or configure the matching
`devServiceGroupUuid`, before expecting the Entity lifecycle mutation tests to
pass.

## Current Mocked Form Coverage

Per-form specs now cover:

- Required-field validation.
- Successful create from complete valid form.
- Successful edit/update from valid edit form.
- Request payload assertions for create/update.
- Success dialog assertions for create.
- Update snackbar or successful post-update navigation assertions for edit.

Entity forms covered:

- Donor.
- Sample.
- Dataset.
- Upload.
- Publication.
- Collection.
- EPICollection.

Bulk pages covered:

- Bulk Sample TSV happy path.
- Bulk Sample row-limit error.
- Sample block metadata upload success.
- Sample block metadata backend validation error.

## BulkSelector Coverage

BulkSelector coverage lives inside the forms that use it:

- Dataset.
- Publication.
- Collection.
- EPICollection.

Covered behavior:

- `source_list` URL prefill.
- Valid rows populate selected table.
- Duplicate source warning dialog.
- Missing source error dialog.
- Wrong-type rejection where whitelist applies.
- Embedded search type whitelist:
  - Publication/Collection/EPICollection only allow Dataset sources.

Important test string:

```text
HBM575.XFCT.276, HBM645.XLLN.924, HBM243.HRTG.365, segdszdg.PHSC.677, HBM628.HGGF.468, HBM452.MTRP.523, HBM237.XQJV.963, HBM536.GZQR.922, HBM293.GBPH.862, HBM645.XLLN.924, HBM566.QVLX.393, HBM279.SLFX.335,
```

## Sample Form Notes

Sample-specific logic is intentionally kept in `sampleForm.cy.js`.

Covered:

- Donor source vs Sample source changes visible fields.
- Source/sample type changes visible fields.
- RUI is available only for block samples with RUI-supported organ source/ancestor.
- Multiple sample generation hides RUI.
- Existing read-only sample locks immutable/writable fields separately.

Important clarification:

- Spreadsheet was deprecated/wrong for Sample RUI behavior.
- Current expected behavior: RUI should show only for block samples whose source/ancestors resolve to an RUI-supported organ.

## Embedded Search Crash Fix

Fixed:

```text
src/components/ui/tableBuilder.jsx
```

Dataset `creation_action` cell renderer no longer calls `.toString()` on a missing value.

Sparse Dataset search results now render `N/A` instead of crashing the form.

The Cypress embedded-search tests intentionally use sparse Dataset rows to cover this.

## Screenshots / Visual Checks

Visual checkpoints can still be enabled manually with:

```text
CYPRESS_VISUAL_CHECKPOINTS=true
```

Screenshots are intentionally taken at important UI states, including:

- Sample RUI available.
- Sample RUI hidden for multiple generation.
- Sample ancestor-supported organ RUI available.
- BulkSelector warning/error dialogs.
- Embedded search Dataset-only restrictions.
- Bulk upload success/error states.

Screenshots land under:

```text
cypress/screenshots/<spec-name>.cy.js/form-checkpoints/
```

## DEV Service Test Status

Service test scaffold exists but has not yet been run successfully in this session because a fresh ignored `cypress.env.json` auth token bundle was not present.

Initial DEV service spec:

```text
cypress/e2e/services/dev/entityService.dev.cy.js
```

Currently covers:

- DEV-only guardrails for entity-api, ingest-api, search-api, and UBKG URLs.
- GET DEV ingest-api `/metadata/usergroups`.
- GET DEV ingest-api `/has-pipeline-test-privs`.
- POST DEV entity-api `/entities/donor`.
- PUT DEV entity-api `/entities/{hubmap_id}`.
- GET DEV entity-api `/entities/{uuid}`.
- Chained POST/PUT/GET lifecycle for Sample from a real DEV Donor.
- Chained POST/PUT/GET lifecycle for Dataset from a real DEV Sample.
- Chained POST/PUT/GET lifecycle for Upload.
- POST DEV search-api `/search` with a minimal query.
- POST DEV search-api `/search` with Dataset entity filter and result-shape assertions.
- GET DEV UBKG `/organs/by-code?application_context=HUBMAP`.
- GET DEV UBKG `/organs?application_context=HUBMAP`.
- GET DEV UBKG `/dataset-types?application_context=HUBMAP`.
- GET DEV UBKG `/valueset?parent_sab=HUBMAP&parent_code=C003041&child_sabs=HUBMAP`.

DEV-only guardrails exist in:

```text
cypress/e2e/services/dev/devServiceHelpers.js
```

They assert service URLs include `.dev.`.

## Important User Preferences / Decisions

- DEV is allowed to be mutated.
- TEST and PROD should not be touched.
- Dummy permission accounts are acceptable for testing.
- Personal accounts should not be used for automated tests.
- Saved dummy credentials/tokens are acceptable in ignored local files.
- Mocked UI tests and real DEV service tests should remain separate.
- Forms should be tested per form/entity, not grouped by generic component category.
- BulkSelector behavior should be tested within each form that uses it.
- Future action-button coverage should be per form/entity and include regular/admin/user-permission variants.

## Existing Console Warnings Seen During Cypress Runs

These appeared during runs and were not addressed in this pass:

- React `helperText` prop warning.
- Controlled/uncontrolled input warning.
- Missing React key warning from UploadForm.
- MUI X `rowCount` warning with client pagination.
- `lassName` prop typo warning.

They did not fail the current suite.

## Watch-Outs

- Cypress sometimes deletes the tracked old screenshot:

```text
cypress/screenshots/SearchComponent.cy.jsx/SearchComponent -- renders (failed).png
```

If it shows as deleted after a run, restore it with:

```bash
mkdir -p 'cypress/screenshots/SearchComponent.cy.jsx'
git show 'HEAD:src/cypress/screenshots/SearchComponent.cy.jsx/SearchComponent -- renders (failed).png' > 'cypress/screenshots/SearchComponent.cy.jsx/SearchComponent -- renders (failed).png'
```

- `git restore` may fail because the parent repo `.git/index.lock` is not writable from this sandbox.
- Use direct `git show > file` restore for that screenshot.

## Recommended Next Steps

1. Add fresh dummy-account auth to ignored `cypress.env.json`.
2. Run:

```bash
npm run test:c
```

3. If the current service chain passes, expand service tests to:
   - Publication with Dataset source.
   - Collection with Dataset source.
   - EPICollection with Dataset source.

4. Add role-based service runs:
   - Writer.
   - Admin.
   - Read-only/no-write if available.
   - Submit/testing permission role if available.

5. Expand mocked form action-button matrices:
   - Donor.
   - Sample.
   - Dataset.
   - Upload.
   - Publication.
   - Collection.
   - EPICollection.

6. For each action-button matrix, cover:
   - Entity status.
   - User permissions.
   - Ownership/group where relevant.
   - Admin vs regular user.

7. Continue filling out per-form field permutations:
   - URL prefill for every supported field.
   - Required/optional fields.
   - Immutable edit fields.
   - Dynamic form sections based on source/type/status.
