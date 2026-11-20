import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.js';
import { startServer } from './lib/server.js';
import { logInfo, logOk, logWarn } from './lib/utils.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 4173);

function build() {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.js')], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, BASE_PATH: process.env.BASE_PATH || '/' }
  });
}

build();
logOk(`本地开发服务器：http://localhost:${PORT}${site.base}`);

let timer = null;
const rebuild = () => {
  windowClear();
  timer = setTimeout(() => {
    logInfo('检测到文件变化，正在重新构建…');
    try {
      build();
      logOk('重新构建完成');
    } catch {
      logWarn('构建失败，请查看上方错误信息');
    }
  }, 180);
};
function windowClear() {
  if (timer) clearTimeout(timer);
}

for (const dir of ['content', 'data', 'scripts', 'src', 'public']) {
  const target = path.join(ROOT, dir);
  if (!fs.existsSync(target)) continue;
  fs.watch(target, { recursive: true }, (_event, filename) => {
    if (!filename || String(filename).includes('dist')) return;
    rebuild();
  });
}

startServer({ root: path.join(ROOT, 'dist'), port: PORT, base: site.base });
