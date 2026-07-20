import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);
const reactPackageJson = JSON.parse(
  readFileSync(new URL('./node_modules/react/package.json', import.meta.url), 'utf8')
);

function mirrorAppCssToAssets() {
  const sourceCss = resolve(process.cwd(), 'src/App.css');
  const targetDir = resolve(process.cwd(), 'src/assets');
  const targetCss = resolve(targetDir, 'App.css');

  return {
    name: 'mirror-app-css-to-assets',
    buildStart() {
      mkdirSync(targetDir, { recursive: true });
      writeFileSync(targetCss, readFileSync(sourceCss));
    },
  };
}

function printReactVersionOnStart() {
  return {
    name: 'print-react-version-on-start',
    configureServer(server) {
      const printUrls = server.printUrls.bind(server);

      server.printUrls = () => {
        server.config.logger.info(`  React v${reactPackageJson.version}`);
        printUrls();
      };
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), [
    'GENERATE_SOURCEMAP',
    'PORT',
    'REACT_APP_',
  ]);
  const isBuild = command === 'build';
  const clientEnv = Object.fromEntries(
    Object.entries(loadedEnv).filter(([key]) => key.startsWith('REACT_APP_'))
  );

  const processEnv = {
    ...clientEnv,
    NODE_ENV: isBuild ? 'production' : 'development',
    PUBLIC_URL: '.',
    npm_package_version: packageJson.version,
  };

  return {
    base: './',
    envPrefix: 'REACT_APP_',
    define: {
      'process.env': JSON.stringify(processEnv),
    },
    plugins: [
      mirrorAppCssToAssets(),
      printReactVersionOnStart(),
      react({
        include: /\.[jt]sx?$/,
      }),
    ],
    resolve: {
      alias: {
        src: resolve(process.cwd(), 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: Number(loadedEnv.PORT || 8585),
    },
    build: {
      assetsDir: 'static',
      chunkSizeWarningLimit: 2000,
      emptyOutDir: true,
      outDir: 'build',
      sourcemap: loadedEnv.GENERATE_SOURCEMAP !== 'false',
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.names?.some((name) => name.endsWith('.css'))) {
              return 'static/css/main.[hash][extname]';
            }
            return 'static/media/[name].[hash][extname]';
          },
          chunkFileNames: 'static/js/[name].[hash].chunk.js',
          entryFileNames: 'static/js/main.[hash].js',
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.test.{js,jsx}'],
      restoreMocks: true,
    },
  };
});
