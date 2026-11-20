import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { logInfo } from './utils.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function safeResolve(root, pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, '');
  const candidate = path.resolve(root, relative);
  if (!candidate.startsWith(root)) return null;
  return candidate;
}

export function startServer({ root, port, base = '/' }) {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || '/', `http://localhost:${port}`);
    let pathname = url.pathname;

    if (base !== '/' && pathname.startsWith(base.replace(/\/$/, ''))) {
      pathname = pathname.slice(base.replace(/\/$/, '').length) || '/';
    }

    if (pathname.endsWith('/')) pathname += 'index.html';

    let file = safeResolve(root, pathname);
    if (!file) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const notFound = path.join(root, '404.html');
      if (fs.existsSync(notFound)) {
        file = notFound;
        response.writeHead(404, { 'Content-Type': MIME['.html'] });
        fs.createReadStream(file).pipe(response);
        return;
      }
      response.writeHead(404).end('Not Found');
      return;
    }

    const ext = path.extname(file).toLowerCase();
    response.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(file).pipe(response);
  });

  server.on('error', (error) => {
    logInfo(`服务器启动失败：${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, () => logInfo(`服务已启动：http://localhost:${port}${base}`));
  return server;
}
