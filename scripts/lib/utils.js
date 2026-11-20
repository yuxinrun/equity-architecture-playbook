import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(LIB_DIR, '../..');

export function readJson(relPath) {
  const file = path.join(ROOT, relPath);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

export function writeFile(relPath, content) {
  const file = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

export function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

export function listFiles(dirRelPath, ext) {
  const dir = path.join(ROOT, dirRelPath);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (!ext || entry.name.endsWith(ext)) out.push(abs);
    }
  };
  walk(dir);
  return out.sort();
}

/** 去掉斜杠重复，确保以 / 结尾 */
export function normalizePath(p) {
  let out = '/' + String(p || '').replace(/^\/+/, '');
  out = out.replace(/\/{2,}/g, '/');
  if (!out.endsWith('/') && !path.extname(out)) out += '/';
  return out;
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}

export function escapeAttr(value = '') {
  return escapeHtml(value);
}

/** 统计文字量：中日韩字符按字计，拉丁按词计 */
export function countText(text = '') {
  const clean = String(text).replace(/\s+/g, ' ');
  const cjk = (clean.match(/[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  const latin = (clean.replace(/[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, ' ')
    .match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
  return cjk + latin * 2;
}

export function readingMinutes(text = '') {
  return Math.max(1, Math.round(countText(text) / 380));
}

export function formatDate(value) {
  if (!value) return '';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(value);
  return `${m[1]} 年 ${Number(m[2])} 月 ${Number(m[3])} 日`;
}

export function formatDateShort(value) {
  if (!value) return '';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(value);
  return `${m[1]}.${m[2]}.${m[3]}`;
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function uniq(list) {
  return [...new Set(list.filter(Boolean))];
}

export function truncate(text = '', max = 120) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/[，、；：,;:.\s]+$/, '') + '…';
}

export function logInfo(msg) {
  process.stdout.write(`  ${msg}\n`);
}

export function logWarn(msg) {
  process.stdout.write(`  \u001b[33m! ${msg}\u001b[0m\n`);
}

export function logError(msg) {
  process.stdout.write(`  \u001b[31m✗ ${msg}\u001b[0m\n`);
}

export function logOk(msg) {
  process.stdout.write(`  \u001b[32m✓\u001b[0m ${msg}\n`);
}