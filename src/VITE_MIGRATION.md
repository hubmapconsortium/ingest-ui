# Vite build and test workflow

The application uses Vite with React 18.3 as the warning-enabled bridge to
React 19.

Vite 7 requires Node.js 20.19+ or 22.12+. The Docker image and current
development baseline use Node.js 24.

## Commands

```sh
npm start
npm run build
npm run build:tags
npm run build:sourcemaps
npm test
npm run test:watch
```

- `npm start` runs the Vite development server on `PORT`, defaulting to 8585.
- Production files are emitted to `build/`.
- JavaScript remains under `build/static/js/` and CSS under
  `build/static/css/` for nginx and Datadog compatibility.
- Production asset references use Vite's relative `./` base.

## Environment compatibility

Existing `REACT_APP_*` variables remain supported. Vite loads the normal
`.env`, `.env.local`, and mode-specific files, then exposes only
`REACT_APP_*` values to browser code through the existing
`process.env.REACT_APP_*` interface.

Vite owns `NODE_ENV`; environment files should use `REACT_APP_NODE_ENV` for
deployment labels such as `local`, `dev`, or `prod`. A legacy
`NODE_ENV=local` entry is ignored by Vite and produces a warning.

The compatibility layer also provides:

- `process.env.NODE_ENV`
- `process.env.PUBLIC_URL`
- `process.env.npm_package_version`

`npm run build:tags` continues to compile the `%%REACT_APP_*%%` placeholders
from `envs/env.tags`. Container startup can replace those placeholders with
deployment-specific values using `envs/env_tool.py`.

## Tests

Vitest with jsdom replaces Create React App's Jest wrapper. The migration smoke
suite runs non-interactively with `npm test`.
