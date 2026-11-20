import fs from 'node:fs';
import path from 'node:path';
import site from '../site.config.js';
import { ROOT, readJson, exists, logInfo, logWarn, logError, logOk } from './lib/utils.js';
import { loadContent } from './lib/content.js';
import { withBase } from './lib/layout.js';

const issues = { errors: [], warnings: [] };
const dataFiles = ['categories', 'tools', 'books', 'glossary', 'sources', 'quotes'];
const datasets = {};

for (const name of dataFiles) {
  try {
    datasets[name] = readJson(`data/${name}.json`);
    logOk(`data/${name}.json`);
  } catch (error) {
    issues.errors.push(`无法读取 data/${name}.json：${error.message}`);
  }
}

const href = (url) => withBase(site.base, url);
const asset = href;
if (datasets.categories) {
  const loaded = loadContent({ categories: datasets.categories, href, asset });
  issues.errors.push(...loaded.issues.errors);
  issues.warnings.push(...loaded.issues.warnings);
  logInfo(`文章 ${loaded.articles.length} 篇`);
}

/* 来源 ID 与文章引用校验 */
const sourceIds = new Set((datasets.sources || []).map((s) => s.id));
if (datasets.categories) {
  const loaded = loadContent({ categories: datasets.categories, href, asset });
  for (const article of loaded.articles) {
    for (const id of article.sources || []) {
      if (!sourceIds.has(id)) issues.warnings.push(`${article.relPath} 引用了未登记来源：${id}`);
    }
    if (['finance-tax', 'shareholder-agreement', 'control-rights', 'shareholder-exit', 'case-studies'].includes(article.category)) {
      if (!article.jurisdiction.length) issues.warnings.push(`${article.relPath} 涉及法律/案例内容但未标注法域`);
      if (!article.verifiedAt) issues.warnings.push(`${article.relPath} 涉及法律/案例内容但未标注资料核验日期`);
    }
  }
}

/* 结构化数据中的本地资源校验 */
const localAssetRefs = [
  'public/assets/illustrations/hero-architecture.svg',
  'public/assets/images/og-cover.svg',
  ...listSvgAssets('public/assets/diagrams')
];
for (const ref of localAssetRefs) {
  if (!exists(ref)) issues.errors.push(`本地资源缺失：${ref}`);
}

/* 数据与链接基础校验 */
if (datasets.glossary) {
  const ids = new Set();
  for (const item of datasets.glossary) {
    if (!item.term || !item.definition) issues.errors.push(`术语缺少 term 或 definition：${item.id || item.term}`);
    if (ids.has(item.id)) issues.errors.push(`术语 id 重复：${item.id}`);
    ids.add(item.id);
    if (item.related && !item.related.startsWith('/')) issues.errors.push(`术语 ${item.id} 的 related 必须是站内绝对路径`);
  }
}
if (datasets.books && datasets.books.length < 15) issues.warnings.push(`书目仅 ${datasets.books.length} 本，建议至少 15 本`);
if (datasets.sources) {
  for (const source of datasets.sources) {
    for (const field of ['id', 'title', 'publisher', 'jurisdiction', 'sourceType', 'url']) {
      if (!source[field]) issues.errors.push(`来源 ${source.id || '(无 id)'} 缺少字段 ${field}`);
    }
    if (!source.accessedAt) issues.warnings.push(`来源 ${source.id} 未记录访问日期`);
    if (!/^https?:\/\//.test(source.url || '')) issues.errors.push(`来源 ${source.id} 的 url 无效`);
  }
}
if (datasets.quotes) {
  for (const quote of datasets.quotes) {
    if (!quote.text || !quote.source) issues.errors.push(`金句 ${quote.id} 缺少文本或出处`);
    if (!quote.isEditorial && /待核验|公开引述/.test(quote.source || '')) {
      issues.errors.push(`金句 ${quote.id} 含未经核实的外部归属，请改为原创总结或补齐可靠出处`);
    }
  }
}

issues.warnings.forEach((w) => logWarn(w));
issues.errors.forEach((e) => logError(e));

if (issues.errors.length) {
  console.error(`\n内容校验失败：${issues.errors.length} 个错误，${issues.warnings.length} 个警告。`);
  process.exit(1);
}
logOk(`内容校验通过（${issues.warnings.length} 个警告）`);

function listSvgAssets(dirRel) {
  const dir = path.join(ROOT, dirRel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.svg')).map((name) => `${dirRel}/${name}`);
}
