import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);

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
    esbuild: {
      include: /src\/.*\.[jt]sx?$/,
      loader: 'jsx',
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    build: {
      assetsDir: 'static',
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
