const { createServer, get } = require('node:http');
const { readFileSync, statSync } = require('node:fs');
const { extname, join, normalize, resolve, sep } = require('node:path');

const appRoot = process.cwd();
const buildDir = resolve(appRoot, 'build');
const indexPath = join(buildDir, 'index.html');
const nginxConfigPath = resolve(appRoot, '../docker/ingest-ui/ingest-ui.conf');

const deepLinks = [
  '/',
  '/new/donor',
  '/new/sample',
  '/new/publication',
  '/new/collection',
  '/new/epicollection',
  '/new/upload',
  '/bulk/donors',
  '/metadata/block',
  '/donor/test-uuid',
  '/publication/test-uuid',
];

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function verifyBuildOutput() {
  const indexHtml = readText(indexPath);

  assert(
    /<base\s+href=["']\/["']\s*\/?>/i.test(indexHtml),
    'build/index.html must include <base href="/" /> so refreshed deep links load ./static assets from the site root.'
  );
  assert(
    /src=["']\.\/static\/js\/[^"']+\.js["']/.test(indexHtml),
    'build/index.html must reference the generated JavaScript bundle.'
  );
  assert(
    /href=["']\.\/static\/css\/[^"']+\.css["']/.test(indexHtml),
    'build/index.html must reference the generated CSS bundle.'
  );

  return indexHtml;
}

function verifyNginxConfig() {
  const nginxConfig = readText(nginxConfigPath);

  assert(
    /listen\s+8080\s*;/.test(nginxConfig),
    'nginx config should listen on container port 8080.'
  );
  assert(
    /root\s+\/usr\/src\/app\/src\/build\s*;/.test(nginxConfig),
    'nginx config should serve the Vite build directory.'
  );
  assert(
    /try_files\s+\$uri\s+\/index\.html\s*;/.test(nginxConfig),
    'nginx config should fall back to /index.html for React Router deep links.'
  );
}

function safeBuildPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = join(buildDir, normalizedPath);

  if (!filePath.startsWith(`${buildDir}${sep}`) && filePath !== buildDir) {
    return indexPath;
  }

  try {
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      return join(filePath, 'index.html');
    }
    if (stat.isFile()) {
      return filePath;
    }
  } catch (error) {
    return indexPath;
  }

  return indexPath;
}

function serveBuild() {
  const server = createServer((request, response) => {
    const filePath = safeBuildPath(request.url || '/');
    const extension = extname(filePath);

    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
    });
    response.end(readFileSync(filePath));
  });

  return new Promise((resolveServer, rejectServer) => {
    server.once('error', rejectServer);
    server.listen(0, '127.0.0.1', () => resolveServer(server));
  });
}

function getUrl(url) {
  return new Promise((resolveRequest, rejectRequest) => {
    const request = get(url, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolveRequest({ body, statusCode: response.statusCode });
      });
    });
    request.on('error', rejectRequest);
  });
}

async function verifyDeepLinks(indexHtml) {
  const server = await serveBuild();
  const { port } = server.address();

  try {
    for (const route of deepLinks) {
      const response = await getUrl(`http://127.0.0.1:${port}${route}`);
      assert(response.statusCode === 200, `${route} should return HTTP 200.`);
      assert(
        response.body === indexHtml,
        `${route} should return the SPA index.html fallback.`
      );
    }
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }
}

async function main() {
  const indexHtml = verifyBuildOutput();
  verifyNginxConfig();
  await verifyDeepLinks(indexHtml);

  console.log('Production routing smoke passed: nginx fallback config and deep-link refresh behavior look good.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
