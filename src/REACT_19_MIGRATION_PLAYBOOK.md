# React 19 and CRA Replacement Playbook

This playbook is designed for an AI coding agent working in the HuBMAP Ingest UI repository. Each phase is intentionally small, independently verifiable, and ends before the next risky change.

## Overall objective

Migrate HuBMAP Ingest UI from:

- React 17 to React 19
- Create React App / `react-scripts` to Vite
- Incompatible dependencies to React 19-compatible versions

Preserve:

- Existing behavior and URLs
- Docker/nginx deployment
- Environment-variable substitution
- Production output in `build/`
- Datadog source-map uploads
- Cypress workflows

## Instructions for the AI agent

Use these instructions at the beginning of the migration:

> Work through only the phase I explicitly authorize.
>
> Before changing files:
>
> 1. Inspect the relevant code and current git status.
> 2. State the expected changes and risks.
> 3. Do not modify unrelated code or discard existing changes.
>
> During each phase:
>
> 1. Keep changes narrowly scoped.
> 2. Preserve current behavior unless the phase says otherwise.
> 3. Update documentation when commands or behavior change.
> 4. Run appropriate builds, tests, and static checks.
> 5. If there are tests you believe *should* be done (considering industry best practices), build them. if they cannot be done automatically, list them for me to approve.
>
> At the end of each phase:
>
> 1. Stop and summarize every meaningful change.
> 2. List tests performed (note new ones created) and their results.
> 3. Report warnings, unresolved questions, and manual checks.
> 4. Provide a concise sanity-check checklist for me.
> 5. Do not begin the next phase until I approve it.
>
> Do not combine the Vite, React, and MUI Data Grid migrations into one change.

---

# Phase 0: Baseline and migration inventory

## Prompt for the AI

> Perform Phase 0 only: establish a migration baseline without modifying application code.
>
> Inspect:
>
> - `package.json` and lockfile
> - Node/npm requirements
> - CRA-specific behavior
> - Environment-variable usage
> - Tests and Cypress configuration
> - Docker/nginx deployment
> - Source-map upload scripts
> - React 19-incompatible dependencies
> - Removed or deprecated React APIs
>
> Run the existing production build and any tests that can run non-interactively.
>
> Produce:
>
> - Baseline build/test results
> - Current warnings
> - Dependency compatibility table
> - List of CRA assumptions that Vite must preserve
> - Proposed migration order
> - Files likely to change in each phase
>
> Do not alter application files. Stop for approval afterward.

## Sanity checks

- Does the existing production build succeed?
- Does the current application start?
- Are known existing warnings clearly separated from new failures?
- Is the Docker output path confirmed as `build/`?
- Is the environment-placeholder deployment process understood?

## Stopping point

Approve the inventory before any migration work begins.

---

# Phase 1: Add baseline smoke coverage

The project currently has little automated unit coverage, so this phase creates guardrails before changing infrastructure.

## Prompt for the AI

> Perform Phase 1 only: add lightweight migration smoke coverage without changing production behavior or dependencies.
>
> Focus on tests that detect catastrophic migration regressions:
>
> - Application root renders
> - Important routes resolve
> - Key pages can mount
> - Required environment configuration is readable
> - A representative Data Grid renders
>
> Prefer Cypress for full application behavior where existing unit-test infrastructure is weak. Avoid building a large new test suite.
>
> Document any checks that must remain manual because authentication or backend services are required.
>
> Run the new checks and stop for approval.

## Sanity checks

- Open the application normally.
- Log in if practical.
- Visit search and one entity form.
- Confirm a Data Grid renders.
- Confirm browser console output is no worse than baseline.

## Stopping point

Commit the baseline tests separately if they are trustworthy.

---

# Phase 2: Replace CRA with Vite, retaining React 17

This isolates the build-system migration from React behavior changes.

## Prompt for the AI

> Perform Phase 2 only: replace Create React App with Vite while retaining React 17 and the current application dependencies.
>
> Requirements:
>
> - Replace `react-scripts` with Vite and the official React plugin.
> - Preserve the existing `npm start` and `npm run build` developer interface where practical.
> - Continue producing production assets under `build/`.
> - Preserve relative production asset URLs required by `"homepage": "."`.
> - Move or adapt `public/index.html` for Vite.
> - Preserve public files, favicon, manifest, external scripts, fonts, and the RUI web component.
> - Remove `%PUBLIC_URL%` usage appropriately.
> - Keep existing `REACT_APP_*` names for now.
> - Implement a clearly documented compatibility mechanism for existing `process.env` reads, or centralize environment access without performing an unrelated application-wide rewrite.
> - Preserve `NODE_ENV`, application version, development mode checks, and placeholder-based `build:tags`.
> - Preserve Docker/nginx expectations.
> - Adapt Datadog source-map paths if Vite cannot reasonably retain the CRA directory layout.
> - Replace CRA's test command with an explicit supported test setup, or document why current coverage is handled through Cypress.
> - Remove obsolete CRA-only files only when their lack of use is verified.
>
> Validate:
>
> - Development server
> - Ordinary production build
> - `build:tags`
> - Source-map build
> - Generated asset paths
> - Environment substitution
>
> Do not upgrade React, MUI, or other UI dependencies in this phase. Stop for approval.

## Sanity checks

- Compare the CRA and Vite versions side by side if possible.
- Confirm deep-link refreshes work through nginx.
- Confirm API requests use the expected endpoints.
- Confirm the banner still loads from `/assets/liveBanner.json`.
- Inspect built JavaScript for expected placeholder tokens in `build:tags`.
- Confirm no secret values were accidentally bundled beyond existing behavior.
- Confirm Datadog's expected script URLs match the generated output.

## Stopping point

Once Vite behavior matches CRA, commit the build-system migration separately.

---

# Phase 3: React 17 to React 18.3

React recommends 18.3 as a warning-enabled bridge to React 19.

## Prompt for the AI

> Perform Phase 3 only: upgrade React and React DOM from 17 to 18.3.
>
> Requirements:
>
> - Replace `ReactDOM.render` with `createRoot`.
> - Replace `unmountComponentAtNode` in tests.
> - Do not enable `StrictMode` yet unless it was already enabled.
> - Do not upgrade MUI Data Grid or proceed to React 19.
> - Investigate every new React warning.
> - Check class components, custom element refs, timers, effects, and error boundaries.
>
> Run:
>
> - Production build
> - Available unit/smoke tests
> - Cypress checks where practical
>
> Report all warnings that could affect React 19 and stop for approval.

## Sanity checks

- Authentication and logout still work.
- Navigation does not cause full-page failures.
- Forms do not submit twice.
- API calls are not unexpectedly duplicated.
- RUI integration mounts and unmounts properly.
- Idle timeout behavior remains correct.

## Stopping point

React 18.3 should run cleanly enough that its warnings form a finite React 19 worklist.

---

# Phase 4: Dependency compatibility upgrades

This is likely the most application-sensitive phase.

## Prompt for the AI

> Perform Phase 4 only: upgrade dependencies that block or do not declare compatibility with React 19. Keep React at 18.3 during this phase.
>
> Prioritize:
>
> - `@mui/x-data-grid`
> - `react-spinners`
> - Any additional dependency shown by peer-dependency analysis
>
> For MUI Data Grid:
>
> - Select the smallest supported upgrade that declares React 19 compatibility.
> - Read and follow every intervening official migration guide.
> - Use official codemods where safe, then review their output manually.
> - Update changed `valueGetter` and `valueFormatter` signatures.
> - Remove invalid TypeScript-style annotations from `.jsx`.
> - Verify toolbar slots, pagination, selection, exports, filtering, visibility, API refs, and custom CSS selectors.
> - Avoid upgrading Material UI itself unless required.
>
> Keep dependency upgrades separated into logical commits where practical.
>
> Run builds and focused checks after each major dependency upgrade. Stop for approval when compatibility blockers are resolved.

## Sanity checks

Pay special attention to:

- Search result grid
- Embedded search
- Bulk entity grid
- Bulk metadata grid
- Contributors grid
- Upload grid
- Pagination and page-size changes
- Filtering and column visibility
- CSV export
- Loading spinners
- Grid dimensions, alignment, scrolling, and hidden columns

## Stopping point

All direct dependencies should install without forcing invalid peer dependencies before attempting React 19.

---

# Phase 5: React 19 migration

## Prompt for the AI

> Perform Phase 5 only: upgrade React and React DOM from 18.3 to the selected stable React 19 release.
>
> Before editing, confirm the exact current stable React 19 version and review the official React 19 upgrade guide.
>
> Requirements:
>
> - Run applicable official React 19 codemods.
> - Review every codemod change manually.
> - Confirm the modern JSX transform is active.
> - Search for removed APIs, legacy context, string refs, function `defaultProps`, deprecated test utilities, and libraries using React internals.
> - Review root-level error handling because React 19 changes how render errors are reported.
> - Preserve existing Datadog/error-boundary behavior.
> - Do not adopt unrelated React 19 features during the compatibility migration.
>
> Run the full available validation suite and stop for approval.

## Sanity checks

- No React 19 compatibility warnings.
- No invalid peer dependencies.
- Error boundaries still display expected UI.
- Datadog still receives caught and uncaught errors appropriately.
- RUI custom elements and refs behave normally.
- Forms, dialogs, tooltips, grids, and navigation remain functional.

## Stopping point

At this point the application is on React 19, but cleanup and production certification remain separate.

---

# Phase 6: Strict Mode compatibility

This is optional but valuable. Keeping it separate prevents double-effect behavior from muddying the core upgrade.

## Prompt for the AI

> Perform Phase 6 only: evaluate and enable React Strict Mode in development.
>
> Audit:
>
> - Effects that perform API requests
> - Event listener setup and cleanup
> - Timers
> - Callback refs
> - RUI lifecycle handling
> - Datadog initialization
> - Global Axios interceptors
>
> Fix only actual idempotency or cleanup defects. Do not add guards whose sole purpose is hiding Strict Mode behavior.
>
> Verify that production behavior is unchanged and stop for approval.

## Sanity checks

- API requests are not duplicated in production.
- Development-only duplicate effects are understood.
- No duplicated error logging or Axios interceptors.
- RUI and idle timers clean themselves up correctly.
- Dialogs and notifications do not appear twice.

---

# Phase 7: Production and deployment certification

## Prompt for the AI

> Perform Phase 7 only: certify the migrated application for deployment.
>
> Validate:
>
> - Clean install from the lockfile
> - Development startup
> - Production build
> - `build:tags`
> - Source-map generation and Datadog dry run
> - Docker image build
> - nginx route fallback
> - Mounted live banner
> - Output paths and cache behavior
> - Cypress/smoke checks
>
> Compare bundle size and generated files with the baseline. Investigate major unexplained changes.
>
> Update README and migration notes with:
>
> - Supported Node version
> - Installation commands
> - Vite commands
> - Environment-variable conventions
> - Build output
> - Testing commands
> - Deployment details
>
> Do not perform cosmetic refactoring. Stop with a release-readiness report.

## Final acceptance checklist

- Clean clone/install works.
- No `react-scripts` dependency or CRA command remains.
- React 19 is installed exactly once.
- `npm ls` reports no important peer errors.
- Production Docker image serves the application.
- Deep links refresh successfully.
- Environment placeholders are correctly deployed.
- Search, entity forms, uploads, and bulk workflows pass.
- Datadog logging and source maps work.
- Migration commits are reviewable and reversible.

---

# Suggested commit boundaries

1. `test: establish migration smoke baseline`
2. `build: migrate from CRA to Vite`
3. `build: preserve environment and deployment behavior`
4. `chore: upgrade to React 18.3`
5. `chore: upgrade MUI Data Grid dependencies`
6. `chore: upgrade to React 19`
7. `fix: make effects Strict Mode compatible`
8. `docs: document Vite and React 19 workflows`

## Guiding principle

Change one major axis at a time: Vite first, the React renderer second, complex dependencies third, and React 19 last. This keeps failures attributable and provides clear review, testing, and rollback points.
