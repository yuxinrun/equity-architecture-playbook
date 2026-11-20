import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ROOT, logError, logInfo, logOk } from './lib/utils.js';
import { startServer } from './lib/server.js';

const dist = path.join(ROOT, 'dist');
const shotsDir = path.join(ROOT, 'docs/screenshots');
const port = Number(process.env.SCREENSHOT_PORT || 46999);
const cli = process.env.PLAYWRIGHT_CLI || (process.platform === 'win32' ? 'playwright-cli.cmd' : 'playwright-cli');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  logError('找不到 dist/index.html，请先运行 npm run build');
  process.exit(1);
}

const shell = process.platform === 'win32';
const probe = spawnSync(cli, ['--version'], { cwd: ROOT, encoding: 'utf8', shell });
if (probe.error || probe.status !== 0) {
  logError('未找到 playwright-cli。请安装 @playwright/cli 或设置 PLAYWRIGHT_CLI 指向本地可执行文件。');
  process.exit(1);
}

fs.mkdirSync(shotsDir, { recursive: true });
const server = startServer({ root: dist, port, base: '/' });
if (!server.listening) {
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
}

const shots = [
  { url: '/', width: 1440, height: 900, file: 'home-desktop.png' },
  { url: '/equity-design/', width: 1440, height: 900, file: 'equity-design.png' },
  { url: '/equity-design/equity-vs-voting-vs-dividend-rights/', width: 1440, height: 900, file: 'article-detail.png' },
  { url: '/tools/dilution-calculator/', width: 1440, height: 900, file: 'calculator-dilution.png' },
  { url: '/company-structure/shareholder-board-management-boundaries/', width: 1440, height: 900, file: 'governance-diagram.png' },
  { url: '/case-studies/multi-round-dilution-scenario/', width: 1440, height: 900, file: 'case-study.png' },
  { url: '/', width: 390, height: 844, file: 'home-mobile.png' }
];

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cli, args, { cwd: ROOT, stdio: 'inherit', shell });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`playwright-cli 命令失败：${args.join(' ')}`));
    });
  });
}

try {
  await run(['open', `http://localhost:${port}/`]);
  for (const shot of shots) {
    await run(['resize', String(shot.width), String(shot.height)]);
    await run(['goto', `http://localhost:${port}${shot.url}`]);
    await run(['screenshot', '--filename', `docs/screenshots/${shot.file}`]);
    logOk(`docs/screenshots/${shot.file}`);
  }
  logOk(`已生成 ${shots.length} 张真实网页截图`);
} catch (error) {
  logError(error.message);
  process.exitCode = 1;
} finally {
  await run(['close']).catch(() => {});
  server.close();
}
