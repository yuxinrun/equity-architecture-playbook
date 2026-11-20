import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.js';
import { startServer } from './lib/server.js';
import { logError } from './lib/utils.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 4173);

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  logError('找不到 dist/index.html，请先运行 npm run build');
  process.exit(1);
}

startServer({ root: dist, port: PORT, base: site.base });
